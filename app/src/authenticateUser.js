const jwt = require('jsonwebtoken');
const api = require('./api');

module.exports.handler = async event => {
  try {
    const session = jwt.verify(
      event.headers.Authorization,
      process.env.JWT_SECRET,
    );

    if (session.user) {
      const eventBody = JSON.parse(event.body);

      const opts = {
        password: eventBody.password,
        verified: true,
        username: session.user.username,
      };

      const user = await api.updateUser(opts);
      console.log(user, 'authenitcated user');

      return Promise.resolve({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(user),
      });
    } else {
      return Promise.resolve({
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
      });
    }
  } catch (e) {
    console.log('AUTHENTICATE USER', e);
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(e),
    });
  }
};
