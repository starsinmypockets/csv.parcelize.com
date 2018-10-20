const jwt = require('jsonwebtoken');
const api = require('./api');
const JWT_EXPIRATION_TIME = 60 * 60 * 48;
const CLIENT_DOMAIN = 'csv.parcelize.com';

module.exports.handler = async event => {
  try {
    const eventBody = JSON.parse(event.body);
    console.log('CREATE USER BODY', eventBody);
    const sessUser = {username: eventBody.email};
    const token = jwt.sign({user: sessUser}, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRATION_TIME,
    });
    eventBody.token = token;

    const userOpts = {
      username: eventBody.username,
      name: eventBody.name,
      bearerToken: token,
    };

    const user = await api.createUser(userOpts);

    const emailOpts = {
      from: 'admin@parcelize.com',
      to: user.username,
      subject: 'Welcome to Parcelize!',
      text: `Have a look around. We just want to make a few simple tools to help make your life easier. Validate your account here: https://${CLIENT_DOMAIN}?token=${token}`,
      user: user,
    };

    const alertEmailOpts = {
      from: 'admin@parcelize.com',
      to: 'pjwalker76@gmail.com',
      subject: 'New Parcelize User!',
      text: 'Go look in the db, you got a new user!',
    };

    await Promise.all([
      api.sendEmail(alertEmailOpts),
      api.sendEmail(emailOpts),
    ]);

    return Promise.resolve({
      statusCode: 200,
      headers: {
        'Access-control-allow-origin': '*',
      },
      body: JSON.stringify(user),
    });
  } catch (e) {
    console.log('CREATE USER ERROR', e);
    return Promise.resolve({
      statusCode: 500,
      headers: {
        'Access-control-allow-origin': '*',
      },
      body: JSON.stringify(e),
    });
  }
};
