const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const Strategy = require('passport-http-bearer').Strategy
const LocalStrategy = require('passport-local').Strategy
const api = require('./api.js')
const app = express()
const session = require('express-session')
const http = require('http')
const cors = require('cors')
const SESSION_SECRET = "2390vhdiaj0943287ufwiecjaskjhdsalhfslf"
const { ensureLoggedIn } = require('connect-ensure-login')


passport.use(new Strategy(async (token, done)=> {
  try {
    const user = await api.findUserByToken(token)
  if (!user) return done(null, false)
    return done(null, user.email, {scope: 'all'})
  } catch (e) {
    return done(e)
  }
}))

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    console.log("LOCAL", username, password)
    const apiRes = await api.verifyPasswordAuth({email: username, candidatePassword: password})
    console.log("LOCAL", apiRes)
    if (apiRes) return done(null, apiRes) // pass
    return done(null, false) // fail
  } catch (e) {
    console.log("PASSWORD STRATEGY", e)
    return done(e, false) // fail
  }
}))

app.use(session({ 
  secret: SESSION_SECRET, 
  resave: false, 
  saveUninitialized: false, 
  cookie: { 
    domain: 'csv.parcelize.com',
    maxAge: 60000 
  } 
}))
app.use(bodyParser.json())
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function(user, done) {
  console.log("SERIALIZE", user._id)
  return done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  console.log("DE-SERIALIZE", id)
  const user = await api.findUser({_id: id})
  return done(null, user.email)
})

app.use(cors())

/* app.use(function(req, res, next) { */
/*   res.header("Access-Control-Allow-Origin", "*") */
/*   res.header("Access-Control-Allow-Credentials", true) */
/*   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization", "Cookie") */
/*   res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE") */
/*   res.header("Cache-Control", "'max-age=0'") */
/*   res.header('set-cookie', 'foobar') */
/*   next() */
/* }) */

/**
 * ROUTES
 **/
app.get('/', (req, res) => {
  res.send('hello')
})

app.get('/test', (req, res) => {
  res.json({
    apiVersion: "0.0.9",
    env: process.env.ENV
  })
})

app.post('/login', passport.authenticate('local'), (req, res) => {
    res.sendStatus(200)
  }
)

app.post('/verify-user', passport.authenticate('bearer'), async (req, res) => {
  try {
    res.send({verified: true, appUses: 1, trainingModel: true})
  } catch (e) {
    res.sendStatus(401)
  }
})

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

app.post('/register-user', passport.authenticate('bearer'), async (req, res) => {
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


app.post('/train', ensureLoggedIn('/login'), async (req, res) => {
  // seperate fields from indexes
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

app.get('/training-data', ensureLoggedIn('/login'), async (req, res) => {
  try {
    const opts = {
      hostname: 'engine.parcelize.com',
      port: 80,
      path: '/training-data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const body = {user: req.user}
    
    const _req = http.request(opts, _res => {
      let data = ''
      _res.setEncoding('utf8')
      _res.on('data', chunk => {
        data += chunk
      })
      _res.on('end', () => {
        res.setHeader('content-type', 'application/json')
        res.send(JSON.parse(data))
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

app.post('/classify', ensureLoggedIn('/login'), async (req, res) => {
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

app.post('/dl-bucket', ensureLoggedIn('/login'), async (req, res) => {
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
		const user = req.user || req.body.user || req.body.email
		const hash = crypto.createHash('md5').update(user).digest("hex")

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
