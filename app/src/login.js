const jwt = require('jsonwebtoken')
const api = require('./api')
const JWT_EXPIRATION_TIME = 3600
console.log("fpp")
module.exports.handler = async (event, context) => {
  console.log("EVENT",event)
    const {username, password} = JSON.parse(event.body)
  
  try {
    const _user = await api.verifyPasswordAuth({
      email: username,
      password: password
    })

    const user = {
      username: _user.email,
      appUses: _user.appUses,
      id: _user._id
    }

    const token = await jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME })

    console.log("tok", jwt)

    return Promise.resolve({ 
      statusCode: 200,
      body: JSON.stringify({auth: true, token: token})
    })
  } catch (e) {
    console.log("LOGIN ERR", e)
    return Promise.reject({ // Error response
      auth: false,
      body: e
    })
  }
}
