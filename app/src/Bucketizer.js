const bayes = require('bayes')

/**
 * Given:
 *  • a set of uniform JSON data that we want to categoprize into buckets
 *  • training data in the same format for each bucket (ex: "keep", "discard", "review")
 *  • -OR- a pretrained model with information for each bucket
 * Return:
 *  The data sorted into buckets: one JSON object per bucket
 * */
class Bucketizer {
  init(opts) {
    this.trainingData = opts.trainingData
    this.stopWords = opts.stopWords || opts.stopwords || []
    this.pipeline = opts.pipeline
    this.dataFields = opts.dataFields
    this.data = opts.data || {} // canonical input data
    this.buckets = {}

    // assign all data to none bucket
    this.buckets.none = JSON.parse(JSON.stringify(this.data))

    if (opts.classifierModel) {
      const classifierModel = (typeof opts.classifierModel === 'object') ? JSON.stringify(opts.classifierModel) : opts.classifierModel
      this.classifier = bayes.fromJson(classifierModel)
      this.classifier.tokenizer = this.tokenize
    } else {
      this.classifier = bayes({ tokenizer: this.tokenize })
    }

    this.classifier.stopWords = opts.stopWords || []
    return Promise.resolve(this)
  }

  // run pipeline tasls in order, processing through buckets.none
  // classified tasks are moved to bucket[name]
  // unclassified tasks remain in bucket.none
  doPipeline() {
    this.pipeline.forEeach((task) => {
      if (task.type === 'multiTermSearch') {
        this.doMultiTermSearch(task)
      }

      if (task.type === 'bayes') {
        this.doBayes(task)
      }
    })
  }

  debug() {
    this.showModel()
  }

  tokenize(text) {
    const stopWords = this.stopWords
    if (text) {
      return text.toLowerCase()
        .replace(/(https?:\/\/[^\s]+)/g, '') // no urls
      // .replace(/[.,\/#!$%'\^&\*;:{}=\-_`~()\r\n\t\\]/g,"") // no punctuation newline tab etc
        .replace(/[\W_]+/g, ' ') // remove all non alpha numeric characters
        .replace(/[0-9]/g, '') // no numbers
        .split(' ')
        .filter(w => stopWords.indexOf(w) < 0)
    }
    return []
  }

  /**
   * Training data is [ { bucketName: [...data] }, ...]
   * */
  train() {
    this.trainingData.map((bucket) => {
      const bucketName = Object.keys(bucket)[0]
      const data = bucket[bucketName]

      for (let i = 0; i < (data.length); i++) {
        const str = this.reduceDataFields(data[i])
        this.classifier.learn(str, bucketName)
      }
    })

    return this.classifier.toJson()
  }

  // classify with trained bayes classifier
  classify(str) {
    return this.classifier.categorize(str)
  }

  reduceDataFields(row) {
    return this.dataFields.reduce((acc, field) => acc.concat(`${row[field]} `), '').slice(0, -1) // remove trailing space
  }

  // get summarized info for client app
  getBayesModelInfo() {
    const output = {}
    const model = JSON.parse(this.classifier.toJson())
    const numTerms = 60 // @@TODO move to conf
    const wf = model.wordFrequencyCount
    Object.keys(wf).forEach((cat) => {
      const sortable = []

      for (const field in wf[cat]) {
        sortable.push([field, wf[cat][field]])
      }

      const infoArr = sortable.sort((a, b) => b[1] - a[1]).slice(0, numTerms)

      output[cat] = infoArr
    })
    return output
  }

  /**
   * @param {
   *   buckets: [
   *     { bucketName: "pos", terms: ["exception", "mediocre"] },
   *     { bucketName: "neg", terms: ["polyglot"] }
   *   ]
   * }
   */
  doMultiTermSearch(opts) {
    try {
      const rows = JSON.parse(JSON.stringify(this.buckets.none)) // blunt but effective clone

      // remove rows from 'none' bucket pending assignment
      this.buckets.none = []

      for (let i = 0; i < rows.length; i++) {
        let classified = false

        opts.buckets.forEach((task) => {
          // concat data fields as string
          const str = this.reduceDataFields(rows[i])

          // add to buckets
          const bucket = task.bucketName
          if (!this.buckets[bucket]) this.buckets[bucket] = []

          // if not already assigned to bucket...
          if (!classified) {
            task.terms.forEach((searchStr) => {
              const re = new RegExp(searchStr, 'ig')
              if (re.test(str)) {
                classified = true // BINGO
                this.buckets[bucket].push(rows[i])
              }
            })
          }
        })

        // if still not classified, return to buckets.none
        if (!classified) {
          this.buckets.none.push(rows[i])
        }

        Promise.resolve()
      }
    } catch (e) {
      console.error('Error at classifyInput', e)
      Promise.reject(e)
    }
  }

  doBayes() {
    const rows = JSON.parse(JSON.stringify(this.buckets.none))
    this.buckets.none = []

    for (let i = 0; i < rows.length; i++) {
      const str = this.reduceDataFields(rows[i])
      const bucketName = this.classify(str)
      if (bucketName) {
        if (!this.buckets[bucketName]) this.buckets[bucketName] = []
        this.buckets[bucketName].push(rows[i])
      } else {
        this.buckets.none.push(rows[i])
      }
    }
  }
}

module.exports = Bucketizer
