const sls = require('serverless-http')
const app = require('./app.js')

module.exports.handler = sls(app)
// {console.log(123)}
