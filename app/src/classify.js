const api = require('./api');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

/**
 * @return Obj
 * {buckets: [
 *  {bucketName: 'foo', terms: ['bar', 'baz', ...]}, 
 * ... 
 * ]}
 */
const getSearchTermArray = eventBody => {
  // searchTerms are in format `bucket_$NAME_$I`
  const searchTermData = Object.keys(eventBody).filter(
    field => field.indexOf('bucket') === 0,
  );

  // group terms by bucket
  const searchTerms = searchTermData.reduce(
    (acc, key) => {
      const bucketName = key.split('_')[1];
      acc[bucketName] = acc[bucketName] || [];
      acc[bucketName].push(eventBody[key]);
      return acc;
    },
    {}, //acc
  );

  // now format as array
  const terms = Object.keys(searchTerms).map(key => {
    const row = {};
    row.bucketName = key;
    row.terms = searchTerms[key];
    return row;
  });

  return {buckets: terms};
};

module.exports.handler = async event => {
  try {
    const eventBody = JSON.parse(event.body);
    const tok = event.headers.Authorization;
    const session = jwt.verify(tok, secret);
    const user = session.user;

    const url = api.formatGoogleDocsLink(eventBody.url);
    const searchTerms = getSearchTermArray(eventBody);
    const dataFields = Object.keys(eventBody)
      .map(key => {
        if (key.includes('dataField')) {
          return eventBody[key];
        }
      })
      .filter(k => !!k);

    const csvData = await api.getCSVData([{bucketName: 'rows', url: url}]);

    const bx = await api.classifyData({
      username: user.username,
      data: csvData[0].rows,
      dataFields: dataFields,
      multiTermSearch: searchTerms,
    });

    await api.saveData({
      data: bx,
      type: 'bucketData',
      username: user.username,
    });

    const s3res = await postToS3(bx, session.user.username);

    return Promise.resolve({
      statusCode: 200,
      body: JSON.stringify(s3res),
      headers: {
        'Content-type': 'application/json',
        'Access-control-allow-origin': '*',
        'Access-control-allow-credentials': 'true',
      },
    });
  } catch (e) {
    console.log('CLASSIFY REQ ERROR', e);
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Access-control-allow-origin': '*',
        'Access-control-allow-credentials': 'true',
      },
    });
  }
};

async function postToS3(bx, username) {
  try {
    const crypto = require('crypto');
    const AWS = require('aws-sdk');
    const hash = crypto
      .createHash('md5')
      .update(username)
      .digest('hex');

    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: 'parcelize.parcels'},
      region: 'us-east-1',
    });

    const ts = new Date().getTime();
    const s3s = Object.keys(bx)
      .map(name => {
        if (Array.isArray(bx[name]) && bx[name].length > 0) {
          const filename = `${ts}_${hash}_${name}.csv`;
          const csv = api.json2csv(bx[name]);

          return s3
            .upload({
              Key: filename,
              Body: csv,
            })
            .promise();
        }
      })
      .filter(n => n); // remove falsy
    return Promise.all(s3s);
  } catch (e) {
    return Promise.reject(e);
  }
}
