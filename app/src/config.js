module.exports = {
  test: {
    mongoConnectString: 'mongodb://parcelize-test:2c3sp9bwgBUfuTX@ds121945.mlab.com:21945/parcelize-test',
    senderEmail: {
      service: 'gmail',
      auth: {
        user: 'parcelize@gmail.com',
        pass: '3B7KQRfFfH3PA9J',
      },
      appPort: 3009,
    },
  },
  dev: {
    mongoConnectString: 'mongodb://admin:thephantomoftheopera@localhost:27017/dreamtigerclassifier',
    senderEmail: {
      service: 'gmail',
      auth: {
        user: '',
        pass: '',
      },
    },
    appPort: 3001,
  },
  aws: {
    mongoConnectString: 'mongodb://serverless:2js7uUD6yhfP9Xx@ds151602.mlab.com:51602/classify',
    senderEmail: {
      service: 'gmail',
      auth: {
        user: 'parcelize@gmail.com',
        pass: '3B7KQRfFfH3PA9J',
      },
      appPort: 3009,
    },
  },
}
