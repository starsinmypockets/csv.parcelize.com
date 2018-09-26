const rp = require('request-promise-native')
const api = require('./api')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

module.exports.handler = async (event) => {
  try {
    console.log("eb-0000", JSON.parse(event.body))
    const eventBody = JSON.parse(event.body)
    const fieldNames = ["bucketName", "bucketUrl"]
    const _bx = api.formatReqFields(eventBody, fieldNames)
    const reqBody = {}
    const tok = event.headers.Authorization
    const session = jwt.verify(tok, secret)
    
    // tweak keys:
    const bx = _bx.map(row => {
      return {
        bucketName: row.bucketName,
        url: row.bucketUrl
      }
    })
    
    reqBody.bx = bx
    reqBody.session = session
    reqBody.dataFields = eventBody.dataFields

    console.log("BODY", reqBody)

    const opts = {
      url: 'http://engine.parcelize.com/train',
      port: 80,
      method: 'POST',
      json: true,
      body: reqBody
    }

    console.log(opts)

    const res = await rp(opts)
    
    return Promise.resolve({
      statusCode: 200,
      body: JSON.stringify(res),
      headers: {
        'Content-type': 'application/json',
        'Access-control-allow-origin': '*'
      }
    })
  } catch (e) {
    console.log("CLASSIFY REQ ERROR", e)
    return Promise.reject({
      statusCode: 500,
      body: JSON.stringify(e)
    })
  }
}
