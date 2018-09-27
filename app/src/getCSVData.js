const request = require('request')
const csv2json = require('csvtojson')

// 

/**
 * Given array of training data objects with links to google csvs:
  *  opts = [
  *    {bucketName: 'pos', url: 'https://google.com/foo'},
  *    {bucketName: 'neg', url: 'https://google.com/bar'},
  *  ]
  * 
  * returns an array of arrays, each inner array corresponding with the index of the bucket passed in ops
  *   { 
  *     pos: [{...}, [...]],  // rows
  *     neg: [{...}, [...]],  // rows
  *   }
  **/
async function getCSVData(opts) {
  console.log("OPTS", opts)
  const inner = 
      opts.map(cat => {
        return new Promise((resolve, reject) => {
          const url = cat.url
          console.log('UUUU', url)
          const csv = csv2json()
          const req = request({url: url, uri: url})
          const csvData = req.pipe(csv).setEncoding('utf8')
          const csvRows = []
          const maxLength = cat.maxLength || 10000 //10K
          let size = 0

          // @@TODO @@SECURITY we really need good validation here

          csvData.on('data', (chunk) => {
            size ++
            if (size < maxLength) {
              csvRows.push(JSON.parse(chunk))
            }
          })
          
          csvData.on('end', () => {
            const output = {}
            output[cat.bucketName] = csvRows
            resolve(output)
            // if this looks valid
          })

          csvData.on('error', (e) => {
            reject(e)
          })
        })
      })

    return Promise.all(inner)
}
  
  // @@TODO improve validation
/* function looksValid(data) { */
/*   try { */
/*     if (typeof data === 'undefined') return false */
/*     if (data.length < 0) return undefined */
/*     return true */
/*   } catch (e) { */
/*     console.log('Err validating training data at app', e) */
/*     return false */
/*   } */
/* } */

module.exports = getCSVData
