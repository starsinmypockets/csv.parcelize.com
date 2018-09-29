const jwt = require('jsonwebtoken')
const api = require('./api')
const JWT_EXPIRATION_TIME = 60 * 60 * 48
const CLIENT_DOMAIN = (process.env.IS_OFFLINE) ? 'localhost:3000/' : 'csv.parcelize.com'

module.exports.handler = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const sessUser = {username: eventBody.email}
    const token = jwt.sign({user: sessUser}, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION_TIME})
    eventBody.token = token
    const user = await api.createUser(eventBody)
    
    const emailOpts = {
      from: 'starsinmypockets@gmail.com',
      to: user.username,
      subject: "Welcome to Parcelize!",
      text: `Have a look around. We just want to make a few simple tools to help make your life easier. Validate your account here: http://${CLIENT_DOMAIN}?token=${token}`,
      user: user
    }

    await api.sendAuthEmail(emailOpts)
    return Promise.resolve({
      statusCode: 200,
      headers: {
        "Access-control-allow-origin": "*"
      },
      body: JSON.stringify(user)
    })
  } catch (e) {
    console.log("CLASSIFY REQ ERROR", e)
    return Promise.resolve({
      statusCode: 500,
      headers: {
        "Access-control-allow-origin": "*"
      },
      body: JSON.stringify(e)
    })
  }
}

