const jwt = require('jsonwebtoken')
const api = require('./api')
const JWT_EXPIRATION_TIME = 3600

module.exports.handler = async (event, context, callback) => {
  const { username, password } = JSON.parse(event.body)

  try {
    const user = await api.verifyPasswordAuth(username, password)
    const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME })
    // send authorization
    callback(null, { 
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({token})
    })
  } catch (e) {
    // send refuse authorization
    callback(null, { // Error response
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: e.message,
      }),
    })
  }
}
