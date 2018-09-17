const http = require('http')

module.exports.handler = () => {
 console.log('foo') 
 const body = '{"bucketName0":"handy","bucketUrl0":"https://docs.google.com/spreadsheets/d/1sD7ZOGW0ME82eicFOWof950kWKbQAU3Gh46n7vkaB4Q/export?format=csv","bucketName1":"dandy","bucketUrl1":"https://docs.google.com/spreadsheets/d/1w870W-Zlz99k_bq0Z3dd0SvKVRUpKyQu8hPnN5gAuAA/export?format=csv","dataFields":["description"],"user":"testapi@api.com"}'
 const opts = {
    hostname: 'engine.parcelize.com',
    port: 80,
    path: '/train',
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    }
 }
 
 const req = http.request(opts, res => {
   let data = ''
   res.setEncoding('utf8')
   res.on('data', chunk => {
    data += chunk
   })
   res.on('end', () => {
    console.log('res data', data)
   })
   res.on('error', err => {
    console.log("ERR", err)
   })
 })

 req.write(body)
 req.end()
}
