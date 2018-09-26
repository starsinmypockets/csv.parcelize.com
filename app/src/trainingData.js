const rp = require('request-promise-native')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

module.exports.handler = async (event) => {
  try {
    const tok = event.headers.Authorization
    const session = jwt.verify(tok, secret)
    const reqBody = { session: session }
    console.log('TRAINING DATA', tok, session, reqBody)
    
    const opts = {
      url: 'http://engine.parcelize.com/training-data',
      port: 80,
      method: 'POST',
      json: true,
      body: reqBody,
    }

    const res = await  rp(opts)
    
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

