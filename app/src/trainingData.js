const rp = require('request-promise-native')
const api = require('./api')

/* const jwt = require('jsonwebtoken') */
/* const get = pr(http.get) */

module.exports.handler = async (event) => {
  try {
    const eventBody = event.body
    const fieldNames = ["bucketName", "bucketUrl"]
    const _bx = api.formatReqFields(eventBody, fieldNames)
    const reqBody = {}
    
    // tweak keys:
    const bx = _bx.map(row => {
      return {
        bucketName: row.bucketName,
        url: row.bucketUrl
      }
    })
    
    reqBody.bx = bx
    reqBody.user = eventBody.user
    reqBody.dataFields = eventBody.dataFields

    const opts = {
      uri: 'http://engine.parcelize.com/train',
      port: 80,
      method: 'POST',
      body: reqBody,
      json: true,
      headers: {
        'Content-type': 'application/json',
        'Access-control-allow-origins': '*'
      }
    }

    const res = await  rp(opts).json()
    
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

