const assert = require('assert')
const api = require('../src/api.js')
const {User, Bayes} = require('../src/db.js')
const mongoose = require('mongoose')

before(() => {
  console.log('BEFORE')
  return User.remove({})
})

describe('API tests', () => {
  let ourUser

  describe('send email', () => {
    it('should send an email', async () => {
//      const emailRes = await api.sendAuthEmail({email: "starsinmypockets@gmail.com"})
      // UNCOMMENT TO CHECK SENDMAIL ^^
      assert(true)
    })
  })

  describe('API user actions', () => {
    it('Should fail on invlid input', async () => {
      try {
        const user = await api.createUser() 
      } catch (e) {
        assert (e)
      }
    }) 
  })

  describe("API create user SUCCEED", async () => {
    const userOpts = {
      name: "testuser",
      email: "email@email.com"
    }
    
    let user
    
    it('Should save user with valid input', async () => {
      user = await api.createUser(userOpts)
      ourUser = Object.assign({}, user._doc)
      console.log("OG save")

      assert(user.name === "testuser")
      assert(user.bearerToken.length > 10)
      assert(typeof user.bearerToken === "string")
    })
  
    it('Verify should succeeed with user token', async () => {
      console.log("<3",ourUser)
      const u2 = await api.verifyUserAuth(ourUser)
      assert(u2.name === ourUser.name)
    })

    it('Should fail on dupe email', async () => {
      console.log("create dupe")
      
      const user = await api.createUser(userOpts)
      console.log('d', user)
      assert(!user)
    })
  })
      
  describe("Verify user fail", () => {
    it('Verify should fail with user token', async () => {
      const u2 = await api.verifyUserAuth()
      assert(!u2)
    })
  })

  describe("Generate auth token", async () => {
    const tok = await api.generateToken()
    assert(tok.length)
  })

  describe("test formatReqFields", () => {
    const body = { bucketName0: '123',
    bucketUrl0: 'http://pjwaliker.net',
   bucketName1: '123',
    bucketUrl1: 'http://pjwaliker.net' }
    const fieldNames = ["bucketName", "bucketUrl"]
    
    const res = api.formatReqFields(body, fieldNames)
    console.log("FFFF", res)
  })

  describe("Test email", () => {
    const config = require('../src/config.js')[process.env.ENV]
    const bearerToken = 'foobar'

    api.sendAuthEmail({
      senderEmail: config.senderEmail,
      from: "parcelize@protonmail.com",
      to: "pjwalker76@gmail.com",
      subject: "Welcome to parcelize.net",
      text: `Thanks for trying out our services. Your login link is: http://csv.parcelize.com/{$bearerToken}. Hold onto the link - this link will act as your password. We're just getting started but hope that we can be of help to your organization. If you encounter any problems, have any requests or suggestions, or just want to get in touch, please reach out at parcelize@protonmail.com.`
    })
  })
})
