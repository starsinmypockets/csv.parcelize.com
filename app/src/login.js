const jwt = require('jsonwebtoken')
const api = require('./api')
const JWT_EXPIRATION_TIME = 3600

module.exports.handler = async (event, context) => {
  console.log(event)
  context.callbackWaitsForEmptyEventLoop = false
  
  try {
    const user = await api.verifyPasswordAuth({
      email: event.body.username,
      password: event.body.password
    })
    console.log('user', user)

    const sessUser = {
      username: user.email,
      appUses: user.appUses,
      id: user._id
    }

    const token = jwt.sign({ sessUser }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME })

    return Promise.resolve({ 
      auth: true,
      token: token,
      user: sessUser
    })
  } catch (e) {
    console.log("LOGIN ERR", e)
    return Promise.reject({ // Error response
      auth: false,
      body: e
    })
  }
}
