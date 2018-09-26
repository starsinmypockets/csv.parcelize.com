const jwt = require('jsonwebtoken')
const api = require('./api')

module.exports.handler = async (event) => {
  try {
    const session = jwt.verify(event.headers.Authorization, process.env.JWT_SECRET)

    if (session.user) {
      const eventBody = JSON.parse(event.body)

      const opts = Object.assign({}, session.user, {
        password : eventBody.password
      })
          
      const user = await api.updateUser(opts)
      
      return Promise.resolve({
        statusCode: 200,
        body: JSON.stringify(user)
      })
    } else {
      return Promise.resolve({
        statusCode: 401,
      })
    }
  } catch (e) {
    console.log("AUTHENTICATE USER", e)
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify(e)
    })
  }
}
