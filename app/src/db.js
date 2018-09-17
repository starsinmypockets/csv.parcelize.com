const config = require('./config.js')[process.env.ENV]
const mongoose = require('mongoose')

mongoose.connect(config.mongoConnectString)

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String, required: true, index: true, unique: true,
  },
  bearerToken: { type: String, unique: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  appUses: { type: Number, default: 0 },
})

const bayesModel = new mongoose.Schema({
  user: { type: String, required: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  bayesModel: { type: Object, required: true }, // JSON
})

module.exports = {
  User: mongoose.model('User', userSchema),
  Bayes: mongoose.model('Bayes', bayesModel),
}
