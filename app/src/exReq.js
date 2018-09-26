const rp = require('request-promise-native')
/* const jwt = require('jsonwebtoken') */
/* const get = pr(http.get) */

module.exports.handler = async (event) => {

  try {
    /* const eventData = JSON.parse(event.body) */
    /* const user = jwt.verify(event.headers.Authorization, secret) */
    /* const opts = { */
    /*   hostname: 'engine.parcelize.com', */
    /*   port: 80, */
    /*   path: '/training-data', */
    /*   method: 'POST', */
    /*   headers: { */
    /*     'Content-Type': 'application/json', */
    /*   } */
    /* } */
    const res = await rp('http://jsonplaceholder.typicode.com/todos/1').json()

    return Promise.resolve({
      statusCode: 200,
      headers: {
        'Content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: res
    })
  } catch (e) {
    console.log('ERR', e)
    return Promise.reject({
      statusCode: 500,
      body: JSON.stringify(e)
    })
  }
}
