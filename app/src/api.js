const {User, Bayes, Data} = require('./db.js')
const Bucketizer = require('./Bucketizer.js')
const stopwords = require('./stopwords/index.js')

const log = console.log

const api = module.exports = {
  createUser: async (opts) => {
    try {
      const user = new User(opts)
      user.bearerToken = api.generateToken()
      await user.save()
      return user
    } catch (e) {
      log(e)
      return false
    }
  },

  updateUser: async (opts) => {
    try {
      const user = await api.findUserByEmail(opts.email)

      if (opts.password)  {
        const bcrypt = require('bcryptjs')
        const { promisify } = require('util')
        const SALT_WORK_FACTOR = 10
        const genSalt = promisify(bcrypt.genSalt)
        const hash = promisify(bcrypt.hash)
        const salt = await genSalt(SALT_WORK_FACTOR)
        const pwHash = await hash(opts.password, salt)

        opts.password = pwHash
      }

      return user.update(opts)
    } catch (e) {
      log("UPDATE-USER", e)
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
  
  // returns user
  verifyPasswordAuth: async (opts) => {
    try {
      console.log('PW Auth api', opts)
      const bcrypt = require('bcryptjs')
      const user = await api.findUserByEmail(opts.email)
      console.log("PW Auth api", user)
      const isMatch = await bcrypt.compare(opts.candidatePassword, user.password)
      return (isMatch) ? user : false
    } catch (e) {
      log("VERIFY PW AUTH", e)
      return false
    }
  },

  generateToken: () => {
    return require('crypto').randomBytes(24).toString('hex')
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
    console.log("SEND AUTH EMAIL", JSON.stringify(opts))
    try {
      const aws = require('aws-sdk')
      aws.config.update({region: 'us-east-1'})
      const ses = new aws.SES()
      const bearerToken = opts.user.bearerToken

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
              Data: `Thanks for trying out our services. Your login link is: http://csv.parcelize.com/${bearerToken}. Hold onto the link - this link will act as your password. We're just getting started but hope that we can be of help to your organization. If you encounter any problems, have any requests or suggestions, or just want to get in touch, please reach out at parcelize@gmail.com.`
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
   *   trainingData: // raw training data
   *   dataFields: ["field1", "field2",...] // extant fields from trainingData and inputData both
   * }
   * @return training model object for bayes classifier
   * 
   **/
  trainBucketizer: async (opts) => {
    try {
      const b8r = new Bucketizer
      
      b8r.init({
        dataFields: opts.dataFields,
        trainingData: opts.trainingData,
        stopWords: stopwords
      })

      return b8r.train()
    } catch (e) {
      log("TRAIN BUCKETIZER", e)
      return {err: 'fail'}
    }
  },

  getBucketInfo: async (bayes) => {
    try {
      const b8r = new Bucketizer
      
      b8r.init({
        classifierModel: bayes
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
    const bayes= await api.getBayes(opts.email)
    bayes.model.options = bayes.model.options || {}

    await b8r.init({
      classifierModel: bayes.model,
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
      const bayes = new Bayes(opts)
      const saved = await bayes.save()
      return (saved)
    } catch (e) {
      log("SAVE MODEL", e)
    }
  },

  json2csv: (json) => {
    const Json2csvParser = require('json2csv').Parser
    try {
      const parser = new Json2csvParser()
      const csv = parser.parse(json)
      return csv
    } catch (e) {
      console.log("JSON2CSV", e)
      return false
    }
  },

  getData: (opts) => {
    console.log('GET DATA', opts)
    return Data.findOne(opts)
  }
}
