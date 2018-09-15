const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const Strategy = require('passport-http-bearer').Strategy
const api = require('./api.js')
const app = express()
const config = require('./config.js')[process.env.ENV]

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
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  res.header("Cache-Control", "'max-age=0'")
  next()
})

// @@TODO implement logger
function log() {
  console.log("LOGGER")
  console.log(arguments)
  // @@TODO print to error log
}

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

    const opts = {
      trainingData: bx,
      dataFields: dataFields
    }

    const model = await api.trainBucketizer(opts)
    const bucketInfo = await api.getBucketInfo(model)
    // store Bayes model as JS object
    await api.saveBayesModel({model: model, user: req.user})
    res.send(bucketInfo)
  } catch (e) {
    log("CLASSIFY REQ ERROR", e)
    res.send({error: "error parsing fields"})
  }
})

// @@SECURITY add xsrf token
app.post('/verify-user', passport.authenticate('bearer'), async (req, res) => {
  // if we have a training model, we don't retrain
  // in order to retrain users need to give more info
  console.log(req.user)
  try {
    const user = await api.findUserByEmail(req.user)
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
      senderEmail: config.senderEmail,
      from: config.senderEmail.auth.user,
      to: user.email,
      subject: email.subject,
      text: email.text
    }

    console.log(emailOpts)

    api.sendAuthEmail(emailOpts)
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
    log('CLASSIFY', e)
    res.send({error: 'error more to come'})
  }
})

module.exports.handler = serverless(app)
// local:
/* app.listen(port, () => { */
/*   console.log('We are live on ' + port) */
/* }) */


