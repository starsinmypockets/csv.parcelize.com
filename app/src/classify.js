const rp = require('request-promise-native')
const api = require('./api')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

module.exports.handler = async (event) => {
  try {
    console.log("eb-0000", JSON.parse(event.body))
    const eventBody = JSON.parse(event.body)
    const reqBody = {}
    const tok = event.headers.Authorization
    const session = jwt.verify(tok, secret)
    
    reqBody.url= eventBody.url
    reqBody.session = session

    const opts = {
      url: 'http://engine.parcelize.com/classify',
      port: 80,
      method: 'POST',
      json: true,
      body: reqBody
    }

    const data = await rp(opts)
    const s3res = await postToS3(data, session.user.username)
    
    return Promise.resolve({
      statusCode: 200,
      body: JSON.stringify(s3res),
      headers: {
        'Content-type': 'application/json',
        'Access-control-allow-origin': '*'
      }
    })
  } catch (e) {
    console.log("CLASSIFY REQ ERROR", e)
    return Promise.resolve({
      statusCode: 500
    })
  }
}

async function postToS3(bx, username) {
  try {
		const crypto = require('crypto')
    const AWS = require('aws-sdk')  
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
    return Promise.reject(e)
  }
}
