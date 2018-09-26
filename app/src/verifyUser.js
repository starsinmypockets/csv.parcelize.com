const jwt = require('jsonwebtoken')
const api = require('./api')

module.exports.handler = async (event) => {
  try {
    const session = jwt.verify(event.headers.Authorization, process.env.JWT_SECRET,)
    console.log('jwt session', session.user.username)
    const user = await api.findUserByUsername(session.user.username)
    
    if (user) {
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
    console.log("VERIFY USER", e)
    return Promise.resolve({
      statusCode: 500,
      body: JSON.stringify(e)
    })
  }
}
