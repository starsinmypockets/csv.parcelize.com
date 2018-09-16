const {User, Bayes} = require('./db.js')
const Bucketizer = require('./Bucketizer.js')
const stopwords = require('./stopwords/index.js')

const log = console.log

const api = module.exports = {
  createUser: async (opts) => {
    try {
      const user = new User(opts)

      return await user.save()
    } catch (e) {
      log(e)
      return false
    }
  },

  verifyUserAuth: async (opts) => {
    try {
      const user = await User.findOne({bearerToken: opts.bearerToken})
      return Promise.resolve(user)
    } catch (e) {
      log (e)
      return false
    }
  },

  generateToken: () => {
    return require('crypto').randomBytes(48).toString('hex')
  },

  findUserByToken: (tok) => {
    return User.findOne({bearerToken: tok})
  },
  
  findUserByEmail: (email) => {
    return User.findOne({email: email})
  },

  getUserByEmail: this.findUserByEmail,

  getUserByToken: this.findUserByToken,

  getBayes: (email) => {
    return Bayes.findOne({user: email})
  },

  sendAuthEmail: async (opts) => {
    try {
      const aws = require('aws-sdk')
      aws.config.update({region: 'us-east-1'})
      const ses = new aws.SES()

      const mailOptions = {
        Source: opts.from,
        Destination:  { ToAddresses: [opts.to] },
        Message: {
          Subject: {
            Charset: 'UTF-8',
            Data: opts.subject,
          },
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: opts.text
            }
          }
        }
      }
      console.log("ses opts", mailOptions)

      const data = await ses.sendEmail(mailOptions).promise()
      console.log("ses res", data)
      return data
    } catch (e) {
      console.log(e)
      return Promise.reject(e)
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
  getCSVData: async (opts) => {
    const getCSVData = require("./getCSVData.js")
    return await getCSVData(opts)
  },
  
  /**
   * @param opts = {
   *   trainingData: [{bucketName: String, url: Valid URL},     ...],
   *   dataFields: ["field1", "field2",...] // extant fields from trainingData and inputData both
   * }
   * @return training model object for bayes classifier
   * 
   **/
  trainBucketizer: async (opts) => {
    try {
      const trainingData = await api.getCSVData(opts.trainingData)
      const b8r = new Bucketizer
      
      b8r.init({
        dataFields: opts.dataFields,
        trainingData: trainingData,
        stopWords: stopwords
      })

      return b8r.train()
    } catch (e) {
      log("TRAIN BUCKETIZER", e)
      return {err: 'fail'}
    }
  },

  getBucketInfo: async (model) => {
    try {
      const b8r = new Bucketizer
      
      b8r.init({
        classifierModel: model
      })

      return b8r.getBayesModelInfo()
    } catch (e) {
      log("GET BUCKETIZER INFO", e)
      return {err: 'fail'}
    }
  },

  classifyData: async (opts) => {
    const data = await api.getCSVData([{bucketName: "rows", url: opts.url}])
    const b8r = new Bucketizer
    const model = await api.getBayes(opts.email)
    model.model.options = model.model.options || {}

    await b8r.init({
      classifierModel: model.model,
      data: data[0].rows
    })

    await b8r.doBayes()
    // send CSVs
  },

  formatReqFields: (body, fieldNames) => {
    const bx = {}
    Object.keys(body).forEach(name => {
      fieldNames.map(f => {
        if (name.search(f) >= 0) {
          const n = parseInt(name.replace(f, ''))
          bx[n] = bx[n] || {}
          bx[n][f] = body[name]
        }
      })
    }, [])
    return Object.keys(bx).map(row => {
      return bx[row]
    })
  },

  formatGoogleDocsLink: (str) => {
    const id = str.replace(/http(.){0,1}:\/\//,'').split('/')[3]
    return `https://docs.google.com/spreadsheets/d/${id}/export/format=csv`
  },

  saveBayesModel: async  (opts) => {
    try {
      const model = new Bayes(opts)
      const saved = await model.save()
      return (saved)
    } catch (e) {
      log("SAVE MODEL")
    }
  },
}
