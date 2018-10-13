const jwt = require('jsonwebtoken');
const api = require('./api');

module.exports.handler = async event => {
  try {
    let bucketInfo = {};
    const session = jwt.verify(
      event.headers.Authorization,
      process.env.JWT_SECRET,
    );
    const user = await api.findUserByUsername(session.user.username);

    const bayes = await api.getBayes(session.user.username);
    
    if (bayes) { 
      const model = JSON.parse(bayes.bayesModel)
      bucketInfo = bayes ? await api.getBucketInfo(model) : {};
    }

    if (user) {
      return Promise.resolve({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          user: user,
          bucketInfo: bucketInfo,
          session: session,
        }),
      });
    } else {
      return Promise.resolve({
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        statusCode: 401,
      });
    }
  } catch (e) {
    console.log('VERIFY USER', e);
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(e),
    });
  }
};
