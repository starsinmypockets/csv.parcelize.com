const {User, Bayes, Data} = require('./db.js');
const Bucketizer = require('./Bucketizer.js');
const stopwords = require('./stopwords/index.js');

const log = console.log;

const api = (module.exports = {
  createUser: async opts => {
    try {
      const user = new User(opts);
      return user.save();
    } catch (e) {
      log(e);
      return false;
    }
  },

  updateUser: async opts => {
    try {
      if (opts.password) {
        const bcrypt = require('bcryptjs');
        const {promisify} = require('util');
        const SALT_WORK_FACTOR = 10;
        const genSalt = promisify(bcrypt.genSalt);
        const hash = promisify(bcrypt.hash);
        const salt = await genSalt(SALT_WORK_FACTOR);
        const pwHash = await hash(opts.password, salt);

        opts.password = pwHash;
      }

      return await User.findOneAndUpdate({username: opts.username}, opts);
    } catch (e) {
      log('UPDATE-USER', e);
      return false;
    }
  },

  verifyUserAuth: async opts => {
    try {
      const user = await User.findOne({bearerToken: opts.bearerToken});
      return Promise.resolve(user);
    } catch (e) {
      log(e);
      return false;
    }
  },

  // returns user
  verifyPasswordAuth: async opts => {
    try {
      const bcrypt = require('bcryptjs');
      const user = await api.findUserByEmail(opts.username);
      const isMatch = await bcrypt.compare(opts.password, user.password);
      return isMatch ? user : false;
    } catch (e) {
      log('VERIFY PW AUTH', e);
      return false;
    }
  },

  generateToken: () => {
    return require('crypto')
      .randomBytes(24)
      .toString('hex');
  },

  findUserByToken: tok => {
    return User.findOne({bearerToken: tok});
  },

  findUserByUsername: username => {
    return User.findOne({username});
  },

  findUserByEmail: username => {
    return User.findOne({username});
  },

  findUser: opts => {
    return User.findOne(opts);
  },

  getUserByEmail: this.findUserByEmail,

  getUserByToken: this.findUserByToken,

  // return latest
  getBayes: async username => {
    return Bayes.findOne({username}, {}, {sort: {created: -1}});
  },

  sendAuthEmail: async opts => {
    console.log('SEND AUTH EMAIL', JSON.stringify(opts));
    try {
      const aws = require('aws-sdk');
      aws.config.update({region: 'us-east-1'});
      const ses = new aws.SES();

      const mailOptions = {
        Source: opts.from,
        Destination: {ToAddresses: [opts.to]},
        Message: {
          Subject: {
            Charset: 'UTF-8',
            Data: opts.subject,
          },
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: opts.text,
            },
          },
        },
      };

      const data = await ses.sendEmail(mailOptions).promise();
      return data;
    } catch (e) {
      console.log('SEND AUTH EMAIL', e);
      return Promise.reject(e);
    }
  },

  /**
   * given valid opts with valid urls, get trainingData
   * from GMAIL csvs
   * @param opts = [{bucketName: String, url: Valid URL}, ...]
   * @return {
   *  bucket1:  [
   *    {data row with datafields}
   *  ]
   * }
   **/
  getCSVData: async opts => {
    const getCSVData = require('./getCSVData.js');
    return await getCSVData(opts);
  },

  /**
   * @param opts = {
   *   trainingData: // raw training data
   *   dataFields: ["field1", "field2",...] // extant fields from trainingData and inputData both
   * }
   * @return training model object for bayes classifier
   *
   **/
  trainBucketizer: async opts => {
    try {
      const b8r = new Bucketizer();

      b8r.init({
        dataFields: opts.dataFields,
        trainingData: opts.trainingData,
        stopWords: stopwords,
      });

      return b8r.train();
    } catch (e) {
      log('TRAIN BUCKETIZER', e);
      return {err: 'fail'};
    }
  },

  getBucketInfo: async bayes => {
    try {
      const b8r = new Bucketizer();
      b8r.init({
        classifierModel: bayes,
      });

      return b8r.getBayesModelInfo();
    } catch (e) {
      log('GET BUCKETIZER INFO', e);
      return;
    }
  },

  classifyData: async opts => {
    const b8r = new Bucketizer();
    const bayes = await api.getBayes(opts.username);
    bayes.model.options = bayes.model.options || {};

    await b8r.init({
      classifierModel: bayes.bayesModel,
      data: opts.data,
      dataFields: opts.dataFields,
    });

    if (opts.multiTermSearch) {
      b8r.doMultiTermSearch(opts.multiTermSearch);
    }

    await b8r.doBayes();

    return b8r.buckets;
  },

  formatReqFields: (body, fieldNames) => {
    const bx = {};
    Object.keys(body).forEach(name => {
      fieldNames.map(f => {
        if (name.search(f) >= 0) {
          const n = parseInt(name.replace(f, ''));
          bx[n] = bx[n] || {};
          bx[n][f] = body[name];
        }
      });
    }, []);
    return Object.keys(bx).map(row => {
      return bx[row];
    });
  },

  formatGoogleDocsLink: str => {
    const id = str.replace(/http(.){0,1}:\/\//, '').split('/')[3];
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  },

  saveBayesModel: async opts => {
    try {
      const bayes = new Bayes(opts);
      const saved = await bayes.save();
      return saved;
    } catch (e) {
      log('SAVE MODEL', e);
    }
  },

  saveData: async opts => {
    try {
      const data = new Data(opts);
      const saved = await data.save();
      return saved;
    } catch (e) {
      console.log('SAVE DATA', e);
      return Promise.reject(e);
    }
  },

  json2csv: json => {
    const Json2csvParser = require('json2csv').Parser;
    try {
      const parser = new Json2csvParser();
      const csv = parser.parse(json);
      return csv;
    } catch (e) {
      console.log('JSON2CSV', e);
      return false;
    }
  },

  getData: opts => {
    return Data.findOne(opts);
  },
});
