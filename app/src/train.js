const api = require('./api');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

module.exports.handler = async event => {
  try {
    const eventBody = JSON.parse(event.body);
    const fieldNames = ['bucketName', 'bucketUrl'];
    const _bx = api.formatReqFields(eventBody, fieldNames);
    const tok = event.headers.Authorization;
    const session = jwt.verify(tok, secret);
    const user = session.user;
    console.log('TOKEN', tok, 'SEC', secret, 'USER', user);

    // tweak keys:
    const bx = _bx.map(row => {
      return {
        bucketName: row.bucketName,
        url: row.bucketUrl,
      };
    });

    const trainingData = await api.getCSVData(bx);

    const opts = {
      trainingData: trainingData,
      dataFields: eventBody.dataFields,
    };

    const bayes = await api.trainBucketizer(opts);

    await api.saveBayesModel({bayesModel: bayes, username: user.username});
    await api.saveData({
      data: trainingData,
      type: trainingData,
      username: user.username,
    });

    const bucketInfo = await api.getBucketInfo(bayes);

    return Promise.resolve({
      statusCode: 200,
      body: JSON.stringify(bucketInfo),
      headers: {
        'Content-type': 'application/json',
        'Access-control-allow-origin': '*',
        'Access-control-allow-credentials': true,
      },
    });
  } catch (e) {
    console.log('CLASSIFY REQ ERROR', e);
    return Promise.resolve({
      headers: {
        'Content-type': 'application/json',
        'Access-control-allow-origin': '*',
        'Access-control-allow-credentials': true,
      },
      statusCode: 500,
    });
  }
};
