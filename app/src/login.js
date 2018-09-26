const jwt = require('jsonwebtoken')
const api = require('./api')
const JWT_EXPIRATION_TIME = 60 * 60 * 48

module.exports.handler = async (event, context) => {
  console.log("EVENT",event, context)
    const {username, password} = JSON.parse(event.body)
    console.log(username, password)
  
  try {
    const user = await api.verifyPasswordAuth({
      username: username,
      password: password
    })

    if (user) {
      const sessUser = { user: {
         username: user.email,
         id: user._id
        }
      }
      
      const token = await jwt.sign(sessUser, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME})

      return Promise.resolve({ 
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({auth: true, token: token})
      })
      
    } else {
      return Promise.reject({auth: false})
    }
  } catch (e) {
    console.log("LOGIN ERR", e)
    return Promise.reject({ // Error response
      auth: false,
      body: e
    })
  }
}
