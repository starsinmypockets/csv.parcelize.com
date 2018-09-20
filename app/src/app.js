const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const Strategy = require('passport-http-bearer').Strategy
const archiver = require('archiver')
const api = require('./api.js')
const app = express()
const http = require('http')

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(user, done) {
  done(null, user)
})

passport.use(new Strategy(async (token, done)=> {
  try {
    const user = await api.findUserByToken(token)
  if (!user) return done(null, false)
    return done(null, user.email, {scope: 'all'})
  } catch (e) {
    return done(e)
  }
}))

app.use(bodyParser.json())
app.use(passport.initialize({session: false}))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Credentials", true)
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE")
  res.header("Cache-Control", "'max-age=0'")
  next()
})

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

app.post('/foo', (req, res) => {
  res.send(req.body)
})

app.post('/train', passport.authenticate('bearer'), async (req, res) => {
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

app.get('/training-data', passport.authenticate('bearer'), async (req, res) => {
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

app.post('/classify', passport.authenticate('bearer'), async (req, res) => {
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

    const body = req.body
    body.user = req.user
    
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


app.post('/download', passport.authenticate('bearer'), async (req, res) => {
  try {
    const bx = api.getData(req.body)
    console.log("BX", Object.keys(bx))
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    })

    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.log('DOWNLOAD BUCKETS', err)
      } else {
        // throw error
        throw err
      }
    })

    archive.on('error', function(err) {
      console.log('DOWNLOAD BUCKETS')
      throw err
    })

    Object.keys(bx).forEach(bk => {
      archive.append(api.json2csv(bx[bk]), {name: bk+'.csv'})
    })
    
    res.attachment('buckets.zip')
    archive.pipe(res)
    archive.finalize()
  } catch (e) {
    console.log('DOWNLOAD BUCKETS', e)
    res.send(e)
  }
})



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
module.exports.handler = serverless(app)
