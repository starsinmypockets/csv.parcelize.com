const assert = require('assert')
const B8r = require('../src/Bucketizer.js')
const {trainingData, testData, dataFields} = require('./testData.js')

describe('Test Bucketizer with Bayes', () => {
  const b8r = new B8r
  it("Hello", () => {
    assert("Hello b8r tests")
  })

  it("Bucketizer init and tr works as expected", async () => {
    await b8r.init({
      trainingData: trainingData,
      dataFields: dataFields,
      data: testData,
    })
    
    assert (typeof b8r === 'object')
  })

  it("Stopwords initialized as []", () => {
    console.log(b8r.stopWords)
    assert(Array.isArray(b8r.stopWords))
    assert(b8r.stopWords.length === 0)
  })

  it("Train bayes model works", () => {
    const modelJSON = b8r.train()
    const model = JSON.parse(modelJSON)

    assert(modelJSON)
    assert(model)
    assert(model.categories.pos)
    assert(model.categories.neg)
    assert(model.wordFrequencyCount.pos.good > 0)
  })

  it("Has buckets made", () => {
    assert(b8r.buckets)
  })
  
  it("Has buckets none", () => {
  console.log(b8r.buckets.none)
    assert(Array.isArray(b8r.buckets.none))
  })

  it("Buckets none has initial data in it", () => {
    assert(b8r.buckets.none.length > 0)
    assert(b8r.buckets.none.length === b8r.data.length)
  })

  it("reduceDataFields works with tokenizer", () => {
    const row = {
      name: "one two",
      foo: "ignore me",
      bar: "me too",
      description: "three four"
    }

    const r = b8r.reduceDataFields(row)
    const t = b8r.tokenize(r)
    assert(r === "one two three four")
    assert(t.length  === 4)
    assert(t[0] === "one")
  })

  it("Bayes classifier works", () => {
    b8r.doBayes()
    assert("No fail", true)
  })
  
  it("Cat buckets exist", () => {
    const bx = Object.keys(b8r.buckets)
    assert(bx.length === 3)
    assert(bx.join(" ") === "none pos neg")
  })
  
  it("Classifier classified rows correctly", () => {
    b8r.buckets.pos.forEach(row => {
      assert(row.cat === "pos")
    })
    b8r.buckets.neg.forEach(row => {
      assert(row.cat === "neg")
    })
  })

  it("Should return interesting accurate info about bayes model", () => {    const info = b8r.getBayesModelInfo()
    assert(info.pos)
    assert(info.neg)
  })
  
  it("Find known values in model info", () => {    
    const info = b8r.getBayesModelInfo()
    const goodWords = info.pos.map(arr => arr[0])
    assert(goodWords.indexOf('great') >= 0)
    assert(goodWords.indexOf('sucks') < 0)
  })
})

describe("Run pipeline with multiterm search", () => {
  const b8r = new B8r
  const testData = [
    {
      name: "This is definitely good",
      description: "Everything good very very great happy foo lalala",
      other: "foo bar ignore bad terrible sucks",
      cat: "pos"
    },
    {
      name: "Test one that sucks",
      description: "Bad terrible sucks",
      cat: "neg"
    },
    {
      name: "Test one that sucks",
      description: "Bad terrible sucks exception",
      cat: "pos",
      note: "This would be neg by Bayes, but we want it in the pos bucket"
    },
    {
      name: "This is definitely good development",
      description: "Everything good very very great happy foo lalala",
      other: "foo bar ignore bad terrible sucks",
      cat: "neg",
      note: "This would be neg but we want 'development' in the pos bucket"
    },
  ]
  
  it("Bucketizer 2 init and tr works as expected", async () => {
    await b8r.init({
      trainingData: trainingData,
      dataFields: dataFields,
      data: testData,
    })
    
    b8r.train()

    assert (typeof b8r === 'object')
    assert(Array.isArray(b8r.buckets.none))
  })

  it("Run multiterm search with passed in params", () => {
    const opts = {  
      buckets: [
        { bucketName: "pos", terms: ["exception", "mediocre"] },
        { bucketName: "neg", terms: ["development"] }
      ]
    }   
    
    b8r.doMultiTermSearch(opts)
    

    assert(b8r.buckets.pos.length === 1)
    b8r.buckets.pos.forEach(row => {
      assert(row.cat === "pos")
    })
    
    assert(b8r.buckets.neg.length === 1)
    b8r.buckets.neg.forEach(row => {
      assert(row.cat === "neg")
    })
    console.log(b8r.buckets.none)

    assert(b8r.buckets.none.length === 2)
  })

  it("Now do Bayes", () => {
    b8r.doBayes()
    assert(b8r.buckets.none.length === 0)
    assert(b8r.buckets.pos.length === 2)
    assert(b8r.buckets.neg.length === 2)
  })
})
