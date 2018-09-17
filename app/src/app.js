const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const Strategy = require('passport-http-bearer').Strategy
const api = require('./api.js')
const app = express()

console.log(process.env)
//const port = config.appPort

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(user, done) {
  done(null, user)
})

passport.use(new Strategy(async (token, done)=> {
  try {
    const user = await api.findUserByToken(token)
    console.log('auth',  token, user)
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
    apiVersion: "0.0.7",
    env: process.env.ENV
  })
})

app.post('/train', passport.authenticate('bearer'), async (req, res) => {
  // seperate fields from indexes
  try {

    const fieldNames = ["bucketName", "bucketUrl"]
    const _bx = api.formatReqFields(req.body, fieldNames)
    const dataFields = req.body.dataFields
    

    // tweak keys:
    const bx = _bx.map(row => {
      return {
        bucketName: row.bucketName,
        url: row.bucketUrl
      }
    })

    const trainingData = await api.getCSVData(bx)
    
    const opts = {
      trainingData: trainingData,
      dataFields: dataFields
    }
    
    // @@TODO validate training data 
    // if valid send response
    // don't wait for training to finish
    res.send(opts)
    const bayes = await api.trainBucketizer(opts)
    api.saveBayesModel({bayesModel: bayes, user: req.user})
  } catch (e) {
    console.log("CLASSIFY REQ ERROR", e)
    res.send(e)
  }
})

app.get('/training-data', passport.authenticate('bearer'), async (req, res) => {
  try {
    const model = await api.getBayes(req.user).bayes
    console.log("bucket model", model)
    if (model) {
      const bucketInfo = await api.getBucketInfo(model)
      return res.send({bucketInfo: bucketInfo})
    } else {
      res.send({})
    }
  } catch (e) {
    console.log('TRAINING-DATA', e)
    res.send({bucketInfo: false})
  }
})

// @@SECURITY add xsrf token
app.post('/verify-user', passport.authenticate('bearer'), async (req, res) => {
  // if we have a training model, we don't retrain
  // in order to retrain users need to give more info
  try {
    const user = await api.findUserByToken(req.token)
    console.log("User", user)
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

    console.log(emailOpts)

    await api.sendAuthEmail(emailOpts)
    res.json(user)
  } catch (e) {
    console.log("CREATE-USER", e)
    res.sendStatus(500)
  }
})

app.post('/classify', passport.authenticate('bearer'), async (req, res) => {
  try {
    const url = api.formatGoogleDocsLink(req.body.url)
    await api.classifyData({email: req.user, url: url})
    res.send({success: 'working on it'})
  } catch (e) {
    console.log('CLASSIFY', e)
    res.send({error: 'error more to come'})
  }
})

module.exports.handler = serverless(app)
// local:
/* app.listen(port, () => { */
/*   console.log('We are live on ' + port) */
/* }) */

