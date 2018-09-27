const api = require('./api')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

module.exports.handler = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const tok = event.headers.Authorization
    const session = jwt.verify(tok, secret)
    const user = session.user
    
    const url = api.formatGoogleDocsLink(eventBody.url)
    const dataFields = eventBody.datafields || ['description'] // @@TODO take this out 
    const csvData = await api.getCSVData([{bucketName: "rows", url: url}])

    const bx = await api.classifyData({
      username: user.username,
      data: csvData[0].rows,
      dataFields: dataFields
    })
    
    await api.saveData({
      data: bx, 
      type: 'bucketData', 
      username: user.username
    })
    
    const s3res = await postToS3(bx, session.user.username)
    
    return Promise.resolve({
      statusCode: 200,
      body: JSON.stringify(s3res),
      headers: {
        'Content-type': 'application/json',
        'Access-control-allow-origin': '*'
      }
    })
  } catch (e) {
    console.log("CLASSIFY REQ ERROR", e)
    return Promise.resolve({
      statusCode: 500
    })
  }
}

async function postToS3(bx, username) {
  try {
		const crypto = require('crypto')
    const AWS = require('aws-sdk')  
		const hash = crypto.createHash('md5').update(username).digest("hex")

    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'parcelize.parcels'},
      region: 'us-east-1'
    })

    const ts = new Date().getTime()
    const s3s = Object.keys(bx).map(name => {
      if (Array.isArray(bx[name]) && bx[name].length > 0) {
        const filename = `${ts}_${hash}_${name}.csv`
        const csv = api.json2csv(bx[name])

        return s3.upload({
          Key: filename,
          Body: csv
        }).promise()
      } 
    }).filter(n => n)  // remove falsy
    return Promise.all(s3s)
  } catch (e) {
    return Promise.reject(e)
  }
}
