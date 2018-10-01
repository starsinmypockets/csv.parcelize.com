const jwt = require('jsonwebtoken');
const api = require('./api');
const JWT_EXPIRATION_TIME = 60 * 60 * 48;

module.exports.handler = async event => {
  const {username, password} = JSON.parse(event.body);
  console.log(username, password);

  try {
    const user = await api.verifyPasswordAuth({
      username: username,
      password: password,
    });

    if (user) {
      const session = {
        user: {
          username: username,
          id: user._id,
        },
      };

      const token = await jwt.sign(session, process.env.JWT_SECRET, {
        expiresIn: JWT_EXPIRATION_TIME,
      });

      const resUser = await api.findUserByUsername(session.user.username);
      const bayes = await api.getBayes(session.user.username);
      let bucketInfo;

      if (bayes) {
        bucketInfo = await api.getBucketInfo(bayes.bayesModel);
      }

      return Promise.resolve({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          auth: true,
          token: token,
          user: resUser,
          bucketInfo: bucketInfo,
        }),
      });
    } else {
      return Promise.resolve({
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (e) {
    console.log('LOGIN ERR', e);
    return Promise.resolve({
      // Error response
      statusCode: 500,
    });
  }
};
