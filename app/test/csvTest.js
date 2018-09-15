const assert = require("assert")
const getCSVData = require("../src/getCSVData.js")
const testData = [
  {bucketName: "pos", url: "https://docs.google.com/spreadsheets/d/154vV1W6tHSS5-lMJNoQ2lVXP-C6_qldP8PYVrB4FPhc/export?format=csv"},
  {bucketName: "neg", url: "https://docs.google.com/spreadsheets/d/1PWHYoDtVq7FpHtsdPl4QFvYNs7VzCJffMFBgcWIArnA/export?format=csv"}
]

describe("HEY", (done) => {
  
  it('Should return data in the expected format', async () => {
      const csvData = await getCSVData(testData)
      /* console.log("csvData", csvData) */
      
      it("should be data", () => {
        assert(csvData)
        assert(csvData.length === 2)
      })

      testData.forEach((item, i) => {
        const key = item.bucketName
        const inner = csvData[i][key]

        assert (inner)
        assert (inner.length > 10)
      })
  })
})
