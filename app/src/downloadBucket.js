module.exports.handler = async (event) => {
  try {
    const eventBody = JSON.parse(event.body)
    const AWS = require('aws-sdk')  
    
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'parcelize.parcels'},
      region: 'us-east-1'
    })
    
    const dl = await s3.getObject({
      IfMatch: eventBody.ETag,
      Key: eventBody.Key
    })
    .promise()

    
    return Promise.resolve({
      statusCode: 200,
      body: dl.Body.toString(),
      headers: {
        'content-type': 'text/plain',
        'content-length': dl.ContentLength,
        'Access-control-allow-origin': '*'
      }
    })
  } catch (e) {
    console.log('DL-BUCKET', e)
    throw e
  }
}

