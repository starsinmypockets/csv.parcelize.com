const first = require('./first-names.json')
const middle = require('./middle-names.json')
const last = require('./last-names.json')
const place = require('./place-names.json')
const en = require('./en.json')

module.exports = en.concat(first).concat(middle).concat(last).concat(place)
  .concat(en)
