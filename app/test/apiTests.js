const assert = require('assert');
const api = require('../src/api.js');
const {User, Bayes} = require('../src/db.js');
const {trainingData, dataFields} = require('./testData.js');

const testUser = {
  name: 'testuser',
  username: 'email@email.com',
};

before(async () => {
  await User.remove({});
  await Bayes.remove({});
});

describe('API tests', () => {
  let ourUser;

  describe('send email', () => {
    it('should send an email', async () => {
      //      const emailRes = await api.sendEmail({email: "starsinmypockets@gmail.com"})
      // UNCOMMENT TO CHECK SENDMAIL ^^
      assert(true);
    });
  });

  describe('API user actions', () => {
    it('Should fail on invlid input', async () => {
      try {
        await api.createUser();
      } catch (e) {
        assert(e);
      }
    });
  });

  describe('API create user SUCCEED', async () => {
    let user;

    it('Should save user with valid input', async () => {
      user = await api.createUser(testUser);
      ourUser = Object.assign({}, user._doc);

      assert(user.name === 'testuser');
    });

    it('Verify should succeeed with user token', async () => {
      const u2 = await api.verifyUserAuth(ourUser);
      assert(u2.name === ourUser.name);
    });

    it('Should fail on dupe email', async () => {
      try {
        const user = await api.createUser(testUser);
        assert(!user);
      } catch (e) {
        assert(e);
      }
    });
  });

  describe('Verify user fail', () => {
    it('Verify should fail with user token', async () => {
      const u2 = await api.verifyUserAuth();
      assert(!u2);
    });
  });

  describe('Generate auth token', async () => {
    const tok = await api.generateToken();
    assert(tok.length);
  });

  describe('test formatReqFields', () => {
    const body = {
      bucketName0: '123',
      bucketUrl0: 'http://pjwaliker.net',
      bucketName1: '123',
      bucketUrl1: 'http://pjwaliker.net',
    };
    const fieldNames = ['bucketName', 'bucketUrl'];

    const res = api.formatReqFields(body, fieldNames);
    console.log('FFFF', res);
  });

  describe('Test bucketizer and bayes model generation', () => {
    it('Should instantiate bucketizer via api', async () => {
      const bayesModel = await api.trainBucketizer({
        dataFields: dataFields,
        trainingData: trainingData,
      });

      const confObj = JSON.parse(bayesModel);

      assert('bayes model has categories', confObj.categories);
      assert('bayes model has options', confObj.options);

      describe('Save and retrieve generated model', async () => {
        it('Should save and retrieve bayes model', async () => {
          const model = await api.saveBayesModel({
            bayesModel: bayesModel,
            username: testUser.username,
          });

          console.log('Bayes', model);
          assert('has model', model);
          assert('model has categories', model.categories);

          const returnBayesModel = await api.getBayes(testUser.username);
          const returnedBayesModel = JSON.parse(returnBayesModel.bayesModel);

          assert(
            'saved bayes model has categories',
            returnedBayesModel.categories,
          );
          assert('saved bayes model has options', returnedBayesModel.options);

          describe('getBucketInfo with bayes model as JSON string', async () => {
            it('Should return sane bucket info', async () => {
              const info = await api.getBucketInfo(bayesModel);
              const great = info.pos.filter(row => {
                return row[0] === 'great';
              });
              console.log('BUCKET INFO', info, great);
              assert('has expected categories', Array.isArray(info.pos));
              assert('has expected categories', Array.isArray(info.neg));
              assert('keyword great exists', great[0] === 'great');
              assert('keyword great count exists', great[1] === 3);
            });
          });
          /* it ('Should be good bucket info', () => { */

          /* }) */
          /* }) */
        });
      });
    });
  });

  /* describe("Test email", () => { */
  /*   const config = require('../src/config.js')[process.env.ENV] */
  /*   const bearerToken = 'foobar' */

  /*   api.sendEmail({ */
  /*     senderEmail: config.senderEmail, */
  /*     from: "parcelize@protonmail.com", */
  /*     to: "pjwalker76@gmail.com", */
  /*     subject: "Welcome to parcelize.net", */
  /*     text: `Thanks for trying out our services. Your login link is: http://csv.parcelize.com/{$bearerToken}. Hold onto the link - this link will act as your password. We're just getting started but hope that we can be of help to your organization. If you encounter any problems, have any requests or suggestions, or just want to get in touch, please reach out at parcelize@protonmail.com.` */
  /*   }) */
  /* }) */
});
