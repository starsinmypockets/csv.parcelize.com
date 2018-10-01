const mongoose = require('mongoose');

try {
  const conStr = process.env.PARCELIZE_MLAB_CONNECT;
  mongoose.connect(
    conStr,
    {auto_reconnect: true},
  );
} catch (e) {
  console.log('ERROR INSTANTIATE MONGO');
  throw e;
}

const userSchema = new mongoose.Schema({
  name: {type: String, required: true},
  username: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  bearerToken: {type: String, unique: true},
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  verified: {type: Boolean, default: false},
  password: {type: String},
  appUses: {type: Object, default: {}},
});

const bayesModel = new mongoose.Schema({
  username: {type: String, required: true},
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  bayesModel: {type: Object, required: true}, // JSON
});

const dataModel = new mongoose.Schema({
  username: {type: String, required: true},
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  dataType: {type: String, enum: ['trainingData', 'bucketData']},
  data: {type: Object, required: true}, // JSON
});

if (process.env.IS_OFFLINE) {
  delete mongoose.connection.models.User;
  delete mongoose.connection.models.Bayes;
  delete mongoose.connection.models.Data;
}

module.exports = {
  User: mongoose.model('User', userSchema),
  Bayes: mongoose.model('Bayes', bayesModel),
  Data: mongoose.model('Data', dataModel),
};
