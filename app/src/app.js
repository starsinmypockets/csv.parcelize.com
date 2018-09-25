const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const api = require('./api.js')
const app = express()
const http = require('http')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const JWT_EXPIRATION_TIME = 3600

app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('hello')
})

app.use((req, res, next) => {
  const tok= jwt.verify(req.headers.authorization, process.env.JWT_SECRET)
  req.user = tok.user
  next()
})

app.get('/test', (req, res) => {
  res.json({
    apiVersion: "0.0.9",
    env: process.env.ENV
  })
})

app.get('/protected', (req, res) => {
  res.send({
    protected: true,
    auth: "heck ya"
  })
})

app.post('/login', async (req, res) => {
	const { username, password } = JSON.parse(req.body)

	try {
		const user = await api.verifyPasswordAuth(username, password)
		const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME })
    
    return res.send({
      statusCode: 200,
			body: JSON.stringify({token})
    })
	} catch (e) {
    res.send({
			statusCode: 401,
			body: JSON.stringify({
				error: e.message,
			}),
		})
	}
})

app.post('/verify-user', async (req, res) => {
  try {
    res.send({verified: true, appUses: 1, trainingModel: true})
  } catch (e) {
    res.sendStatus(401)
  }
})

// @TODO need to put this in an unprotected endpoint
app.post('/create-user', async (req, res) => {
  try {
    const user = await api.createUser(req.body)
    const email = require('./email.js').authenticate
    const emailOpts = {
      from: 'admin@parcelize.com',
      to: user.email,
     subject: email.subject,
      text: email.text,
      user: user.toObject()
    }

    await api.sendAuthEmail(emailOpts)
    res.json(user)
  } catch (e) {
    console.log("CREATE-USER", e)
    res.sendStatus(500)
  }
})

app.post('/register-user', async (req, res) => {
  try {
    req.body.verified = true
    req.body.email = req.user
    console.log('REGISTER', req.body)
    await api.updateUser(req.body)
    res.sendStatus(200)
  } catch (e) {
    console.log('REGISTER USER', e)
    res.sendStatus(500)
  }
})

app.post('/train', async (req, res) => {
  // seperate fields from indexes
  console.log("TRAIN REQ 1 ", req)
  try {
    const fieldNames = ["bucketName", "bucketUrl"]
    const _bx = api.formatReqFields(req.body, fieldNames)
    const body = {}
    
    // tweak keys:
    const bx = _bx.map(row => {
      return {
        bucketName: row.bucketName,
        url: row.bucketUrl
      }
    })
    
    body.bx = bx
    body.user = req.user
    body.dataFields = req.body.dataFields

    const opts = {
      hostname: 'engine.parcelize.com',
      port: 80,
      path: '/train',
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      }
    }
    
    const _req = http.request(opts, _res => {
      let data = ''
      _res.setEncoding('utf8')
      _res.on('data', chunk => {
        data += chunk
      })
      _res.on('end', () => {
        res.send(data)
      })
      _res.on('error', err => {
        console.log("ERR", err)
        res.send({err: err})
      })
    })

   _req.write(JSON.stringify(body))
   _req.end()
  } catch (e) {
    console.log("CLASSIFY REQ ERROR", e)
    res.send(e)
  }
})

app.post('/classify', async (req, res) => {
  try {
    const opts = {
      hostname: 'engine.parcelize.com',
      port: 80,
      path: '/classify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }
        //res.send(JSON.parse(data))

    const body = req.body
    body.user = req.user
    
    const _req = http.request(opts, _res => {
      let data = ''
      _res.setEncoding('utf8')
      _res.on('data', chunk => {
        data += chunk
      })
      _res.on('end', async () => {
        const s3res = await postToS3(JSON.parse(data), req, res)
        console.log('s3 response', s3res)
        // @@SECURITY not sure to share this with client
        res.json(s3res)
      })
      _res.on('error', err => {
        console.log("ERR", err)
        res.send({err: err})
      })
    })
    
    _req.end(JSON.stringify(body))
  } catch (e) {
    console.log('TRAINING-DATA', e)
    res.send({bucketInfo: false})
  }
})

app.post('/dl-bucket', async (req, res) => {
  try {
    const AWS = require('aws-sdk')  
    const fileName = req.body.Key
    console.log('DL', fileName, req.body.fileName)

    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'parcelize.parcels'},
      region: 'us-east-1'
    })

    // validate permissions
    const dl = await s3.getObject({
      IfMatch: req.body.ETag,
      Key: req.body.Key
    })
    .promise()
    console.log('dl', dl)
    
    // parse bucket name
    res.attachment('test.csv')
    res.setHeader('content-type', dl.ContentType)
    res.setHeader('content-length', dl.ContentLength)

    return res.send(dl.Body)
  } catch (e) {
    console.log('DL-BUCKET')
    throw e
  }
})

async function postToS3(bx, req, res) {
  try {
		const crypto = require('crypto')
    const AWS = require('aws-sdk')  
		const username = req.user.username
		const hash = crypto.createHash('md5').update(username).digest("hex")

    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'parcelize.parcels'},
      region: 'us-east-1'
    })

    const ts = new Date().getTime()
    const s3s = Object.keys(bx).map(name => {
      if (Array.isArray(bx[name]) && bx[name].length > 0) {
        const filename = `${ts}_${hash}_${name}.csv`
        const csv = api.json2csv(bx[name])

        return s3.upload({
          Key: filename,
          Body: csv
        }).promise()
      } 
    }).filter(n => n)  // remove falsy

    return Promise.all(s3s)
  } catch (e) {
    console.log("WRITE CSV ERROR", e)
    return res.sendStatus(500)
  }
}

module.exports.handler = serverless(app)
