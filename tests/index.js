const assert = require('chai')
  .assert;
const expect = require('chai')
  .expect;
const axios = require('axios');
import fetch from 'node-fetch';
const request = require('supertest');
const server = require('./testServer');

const User = require('../src/server/models/User');
import { redisSetHash, redisHashGetAll, redisHashGetOne, redisSetKey, redisSetKeyWithExpire, redisGetKey, redisIncrementKeyValue, redisHashGetOneAsync } from './../src/redis/redisHelperFunctions';
import { updateLyftToken, getLyftToken, refreshToken } from './../src/server/controllers/Internal';
import { createNewDeveloperKey } from './../src/server/controllers/DeveloperAPI';
import hasValidDevAPIToken from './../src/server/server-configuration/hasValidDevAPIToken';
import { getLyftBearerToken } from './../src/server/utils/ride-helper';

let currentListeningServer;
let PORT = 8080;
let testUserId;
let testCount;
let keyObj = {};

describe('API server', function () {
  this.timeout(18000);
  before(function () {
    currentListeningServer = server.default.listen(PORT);
  });

  after(function () {
    currentListeningServer.close();
  });

  describe('Check basic build', function () {
    it('should return 200', function (done) {
      axios.get(`http://localhost:${PORT}/`)
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        });
    });

    describe('Check restful routes', function () {

      it('should get all users when presented with the API access token', function (done) {
        axios.get(`http://localhost:${PORT}/dev/users`, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            testCount = res.data.length;
            assert.equal(res.status, 200, 'did not return 200', res.status);
            done();
          })
          .catch((err) => done(err));
      });

      it('should allow a developer to add a user when presented with the right access token', function (done) {
        axios.post(`http://localhost:${PORT}/dev/users`, { email: `test${testCount}`, password: 'test', lyftToken: '23jlkjd39' }, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            testUserId = res.data[0].id;
            assert.equal(res.status, 200, 'did not return 200', res.status);
            done();
          })
          .catch((err) => done(err));
      });

      it('return the correct data for users posted to the DB', function (done) {
        axios.get(`http://localhost:${PORT}/users/${testUserId}`, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            expect(res.status)
              .to.equal(200);
            expect('test')
              .to.equal(res.data[0].password);
            expect('23jlkjd39')
              .to.equal(res.data[0].lyftToken);
            done();
          })
          .catch((err) => done(err));
      });

      it('should allow users to update their information', function (done) {
        axios.put(`http://localhost:${PORT}/users/${testUserId}`, { email: 'test${testUserId}second@gmail.com', password: 'newtest' }, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            done();
          })
          .catch((err) => done(err));
      });

      it('should delete the user created by the developer', function (done) {
        axios.delete(`http://localhost:${PORT}/dev/users/${testUserId}`, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            done();
          });
      });

      it('should properly update or create', function (done) {
        axios.post(`http://localhost:${PORT}/users/updateOrCreate`, { email: 'newuser@gmial.com', password: 'yo', lyftToken: 'yellow' }, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            expect(res.data.lyftToken)
              .to.equal('yellow');
            return axios.post(`http://localhost:${PORT}/users/updateOrCreate`, { email: 'newuser@gmial.com', password: 'yo', lyftToken: 'blue' }, {
              headers: { 'x-access-token': process.env.CARVIS_API_KEY }
            });
          })
          .then((res) => {
            expect(res.data.lyftToken)
              .to.equal('blue');
            // expect().to.equal('yo');
            done();
          })
          .catch((err) => done(err));
      });

      // ========== alexa tests =============== //

      it('should return the correct data for an Alexa launch intent request', function (done) {
        axios.post(`http://localhost:${PORT}/alexa/launch`, {
            headers: { 'Content-Type': 'application/json' }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            expect(res.data.prompt)
              .to.exist;
            done();
          })
          .catch((err) => done(err));
      });

      it('should return the correct data for an Alexa estimate intent request', function (done) {
        let body = { data: { request: { intent: { slots: { DESTINATION: { value: 'hack reactor' }, MODE: { value: 'cheapest' } } } } } };
        axios.post(`http://localhost:${PORT}/alexa/estimate`, body, {
            headers: { 'Content-Type': 'application/json' }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            expect(res.data.prompt)
              .to.exist;
            done();
          })
          .catch((err) => done(err));
      });

      it('should handle an Alexa estimate intent request for an unrecognized location', function (done) {
        let body = { data: { request: { intent: { slots: { DESTINATION: { value: 'ass FO airport' }, MODE: { value: 'cheapest' } } } } } };
        axios.post(`http://localhost:${PORT}/alexa/estimate`, body, {
            headers: { 'Content-Type': 'application/json' }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            expect(res.data.prompt)
              .to.exist;
            done();
          })
          .catch((err) => done(err));
      });

      it('should handle an Alexa estimate intent request that returns no valid estimates', function (done) {
        let body = { data: { request: { intent: { slots: { DESTINATION: { value: 'antarctica' }, MODE: { value: 'cheapest' } } } } } };
        axios.post(`http://localhost:${PORT}/alexa/estimate`, body, {
            headers: { 'Content-Type': 'application/json' }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            expect(res.data.prompt)
              .to.exist;
            done();
          })
          .catch((err) => done(err));
      });

      it('should get a new lyftToken!', function (done) {
        getLyftBearerToken(function (token) {
          expect(token)
            .to.be.ok;
          done();
        });
      });
      // ============= end of alexa tests ============== //
    });

    describe('Test Redis Helpers', function () {
      it('should get and set a flat value', function (done) {
        redisSetKey('testKey', 'testValue');
        redisGetKey('testKey', function (res) {
          expect(res)
            .to.equal('testValue');
        });
        done();
      });

      it('should get a flat value', function (done) {
        redisGetKey('testKey', function (res) {
          expect(res)
            .to.equal('testValue');
        });
        done();
      });

      it('should set a key with expiration', function (done) {
        redisSetKeyWithExpire('testAnotherKey', 1, 'anotherTestValue', function () {
          redisGetKey('testAnotherKey', function (res) {
            // test the setting / getting of the key
            expect(res)
              .to.equal('anotherTestValue');
          });

          // test the expiration
          setTimeout(() => {
            redisGetKey('testAnotherKey', function (res) {
              expect(res)
                .not.to.equal('anotherTestValue');

            });
            done();
          }, 1100);
        });
      });

      it('should set and get a hash', function (done) {
        redisSetHash('testHash', ['key1', 'val1', 'key2', 'val2']);
        redisHashGetAll('testHash', function (res) {
          expect(res)
            .to.deep.equal({ 'key1': 'val1', 'key2': 'val2' });
        });
        done();
      });

      it('should get a key from a hash', function (done) {
        redisHashGetOne('testHash', 'key1', function (res) {
          expect(res)
            .to.equal('val1');
        });
        done();
      });

      it('should getLyftToken', function (done) {
        redisSetKeyWithExpire('lyftBearerToken', 1, 'true', function (res) {
          expect(getLyftToken())
            .to.equal('true');
        });
        done();
      });

      it('should set and get lyftBearerToken', function (done) {
        redisSetKeyWithExpire('lyftBearerToken', 1, 'veryTrue', function (res) {
          redisGetKey('lyftBearerToken', function (res) {
            expect(res)
              .to.equal('veryTrue');
            done();
          });
        });
      });

      // note: could be separated into two tests.
      it('should update lyftBearerToken', function (done) {

        // change lyftBearerToken from 'veryTrue' to 'true'
        let req = { body: { token: "true" } };
        updateLyftToken(req);

        // fetch redis key - expect 'veryTrue' (from prev. test)
        redisGetKey('lyftBearerToken', function (token) {
          expect(token)
            .to.equal('true');
          done();
        });
      });

      it('should fetch the lyftBearerToken', function (done) {
        // fetch that token via the endpoint
        var apiURL = `http://localhost:${PORT}/internal/lyftBearerToken`
        fetch(apiURL, {
            method: 'GET',
            headers: {
              'x-access-token': process.env.CARVIS_API_KEY,
              'Content-Type': 'application/json'
            }
          })
          .then(res => {
            return res.json();
          })
          .then(data => {
            console.log(data);
            // expect the new token 'true'
            expect(data)
              .to.equal('true');
            done();
          })
          .catch(err => console.warn('error fetch', err));
      });

      it('should add a user to redis on creating a user', function (done) {
        var apiURL = `http://localhost:${PORT}/dev/users`
        let body = {
          email: 'someuser@gmail.com' + Math.random()
        };
        // create a new user with random email
        fetch(apiURL, {
            method: 'POST',
            headers: {
              'x-access-token': process.env.CARVIS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          })
          .then(res => {
            return res.json();
          })
          .then(data => {
            console.log(data);
            // fetch the new user, find the same email (in Redis)
            redisHashGetOne(data[0].id, 'email', function (res) {
              expect(res)
                .to.equal(body.email);
              done();
            });
          })
          .catch(err => console.warn('error fetch', err));
      });

      it('should update a user and find the update in Redis', function (done) {
        var apiURL = `http://localhost:${PORT}/users/1`
        let body = {
          email: 'TESTSAREBADMMMMMKAY2@gmail.com' + Math.random()
        };
        // update an existing user with a new random email
        fetch(apiURL, {
            method: 'PUT',
            headers: {
              'x-access-token': process.env.CARVIS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          })
          .then(res => {
            return res.json();
          })
          .then(data => {
            console.log('success update user', data);
            // fetch the existing user, find new random email (in Redis)
            redisHashGetOne(data[0].id, 'email', function (res) {
              expect(res)
                .to.equal(body.email);
              done();
            });
          })
          .catch(err => console.warn('error fetch', err));
      });

      // NOTE: commented out whilst deployed carvis-api is down.
      //   it('should do an integration test with the helper API', function (done) {
      //     // get the current lyftToken
      //     let token = redisGetKey('lyftBearerToken');
      //
      //     // call the helper API to refresh the lyftBearerToken
      //     let helperURL = process.env.CARVIS_HELPER_API + '/lyft/refreshBearerToken';
      //     fetch(helperURL, {
      //         method: 'GET',
      //         headers: {
      //           'Content-Type': 'application/json',
      //           'x-access-token': process.env.CARVIS_HELPER_API_KEY
      //         }
      //       })
      //       .then(res => {
      //         return res.json();
      //       })
      //       .then(data => {
      //         console.log('success refreshToken', data);
      //         setTimeout(() => {
      //           // fetch the new token - compare to not be equal to the old one
      //           expect(redisGetKey('lyftBearerToken'))
      //             .not.to.equal(token);
      //           done();
      //         }, 5000);
      //       })
      //       .catch(err => {
      //         console.warn('error refreshing token', err);
      //       });
      //   });
      //   // more tests within Redis.
    });

    describe('Test Developer API', function () {
      it('should create a new key', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/createToken`

        // get a new developer API key
        fetch(apiURL, {
            method: 'GET',
            headers: {
              'x-access-token': process.env.CARVIS_API_KEY,
              'Content-Type': 'application/json'
            }
          })
          .then(res => {
            return res.json();
          })
          .then(data => {
            console.log('success create new dev key', data);
            keyObj.devKey = data;
            // test for proper uuid-v4, which is 36 length
            expect(data)
              .to.have.length.above(35);
            redisGetKey(data, function (keyCount) {
              expect(keyCount)
                .to.be.above(0);
              done();
            });
          })
          .catch(err => console.warn('error fetch', err));
      });

      it('should validate using that new key', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/testMyKey`
        let body = {
          count: 1
        };

        // get a new developer API key
        fetch(apiURL, {
            method: 'POST',
            headers: {
              'x-access-token': 'c6930e19-f447-4ed2-823f-c4444c454a0d',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          })
          .then(res => {
            return res.json();
          })
          .then(data => {
            console.log('success public route test', data);
            // test for truthy response
            expect(data)
              .to.be.ok;
            done();
          })
          .catch(err => console.warn('error public route test', err));
      });

      it('should return 404 if key used >99 times', function (done) {
        let token = keyObj.devKey;
        let apiURL = `http://localhost:${PORT}/developer/testMyKey`
          // increment the key value 100 times
        for (let i = 0; i < 100; i++) {
          redisIncrementKeyValue(token);
        }
        let body = {
          count: 1
        };

        // note: these don't return in order - sometimes the 99th fetch returns before the 98th fetch, and so the 98th fetch might have the higher redis/key usage rate - so comparison with i won't work.
        // if one does rapid requests (machine time) redis will update fast enough to notice the rate limit between 100-200 requests, but not instantly when 100 requests is reached.
        fetch(apiURL, {
            method: 'POST',
            headers: {
              'x-access-token': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          })
          .then(res => {
            return res.json();
          })
          .then(data => {
            console.log('success rate limit test', data.message);
            if (data.message === 'API key over rate limit, request new key') {
              done();
            } else {
              // test for truthy response
              expect(data)
                .to.be.ok;
              let err = 'RATE LIMITING NOT WORKING!';
              done(err);
            }
          })
          .catch(err => console.warn('error fetch', err));
      });

      // NOTE: this test runs, and passes, but is live (sends actual SMS from Lyft to your phoneNumber) - so commented out for now.

      // it('should increment key value when using DeveloperAPI', function (done) {
      //   let token = 'c6930e19-f447-4ed2-823f-c4444c454a0d';
      //   let oldVal = redisGetKey(token);
      //
      //   let apiURL = `http://localhost:${PORT}/developer/lyftPhoneAuth`
      //   let body = {
      //     phoneNumber: "4242179767"
      //   };
      //
      //   // post to the internal route, which routes to the helper API
      //   fetch(apiURL, {
      //       method: 'POST',
      //       headers: {
      //         'x-access-token': 'c6930e19-f447-4ed2-823f-c4444c454a0d',
      //         'Content-Type': 'application/json'
      //       },
      //       body: JSON.stringify(body)
      //     })
      //     .then(res => {
      //       return res.json();
      //     })
      //     .then(data => {
      //       console.log('success lyftPhoneAuth via public route', data);
      //       // test for truthy response
      //       expect(data)
      //         .to.be.ok;
      //       redisGetKey(token, (newVal) => {
      //         expect(newVal)
      //           .to.be.above(oldVal);
      //         done();
      //       });
      //     })
      //     .catch(err => console.warn('error fetch', err));
      // });

      // note: integration testing for app.post('/developer/lyftPhoneCodeAuth', hasValidDevAPIToken, lyftPhoneCodeAuth); not possible - as the code is sent by Lyft to the phoneNumber via SMS (and the phoneNumber has to be registered with them, so we can't use a Twilio number).

      /*
      app.post('/developer/uberLogin', hasValidDevAPIToken, uberLogin);
      note: to test this we need to add uberlogin credentials to process.env.
      */

      // more tests.
    });
    // TODO: integration tests for Ride.js and Redis / DB associated.
    // describe ... other tests
  });
});
