const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const assert = require('chai')
  .assert;
const expect = require('chai')
  .expect;
const axios = require('axios');
import fetch from 'node-fetch';
const request = require('supertest');
const server = require('./testServer');
const User = require('../src/server/models/User');
import { redisSetHash, redisHashGetAll, redisHashGetOne, redisSetKey, redisSetKeyWithExpire, redisGetKey, redisIncrementKeyValue, redisHashGetOneAsync, redisDelete } from './../src/redis/redisHelperFunctions';
import { updateLyftToken, getLyftToken, refreshToken } from './../src/server/controllers/Internal';
import { createNewDeveloperKey } from './../src/server/controllers/DeveloperAPI';
import hasValidDevAPIToken from './../src/server/server-configuration/hasValidDevAPIToken';
import { getLyftBearerToken } from './../src/server/utils/ride-helper';
import { createMessage } from './../src/server/utils/twilioHelper';
import Stork from '../src/db/stork/src/index';
import _ from 'lodash';


let currentListeningServer;
let PORT = 8080;
let testUserId;
let testCount;
let redisTestUser;
let keyObj = {};
let DB_CONFIG = {
  host: process.env.TEST_DB_HOST,
  port: 5432,
  database: process.env.TEST_DB_DATABASE,
  user: process.env.TEST_DB_USER,
  password: process.env.TEST_DB_PASS,
  ssl: true
};
let alexaUserId = "amzn1.account.AM3B227HF3FAM1B261HK7FFM3A2";
let testRideId;

// if (process.env.AWS && JSON.parse(process.env.AWS)) {
//   DB_CONFIG
// } else {
//   // DB_CONFIG = JSON.parse(process.env.DB_CONFIG_OBJ_JSON);
// }

const db = new Stork({
  connection: DB_CONFIG,
  client: 'pg'
});




// TODO: REMOVE ALL TEST USERS, RIDES, REDIS KEYS, etc.
// =====
// remove test users --
// app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);
// remove test rides --
// app.delete('/rides/:rideid', hasValidAPIToken, deleteRide);
// remove test redis keys --
// redisDelete(keyName, cb)
// =====

describe('API server', function () {
  this.timeout(18000);
  before(function (done) {
    currentListeningServer = server.default.listen(PORT);

    db.dropTableIfExists('users')
      .then((res) => db.createTable('users', User.UserSchema))
      .then(() => done())
      .catch((err) => done(err));

  });

  after(function () {
    currentListeningServer.close();
  });

  describe('Check basic build', function () {
    it('should return 200', function (done) {
      axios.get(`http://localhost:${PORT}/`)
        .then(res => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        });
    });

    describe('Check restful routes', function () {
      // app.get('/dev/users', hasValidAPIToken, getAllUserData);
      it('should get all users when presented with the API access token', function (done) {
        let url = `http://localhost:${PORT}/dev/users`;
        fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': process.env.CARVIS_API_KEY
            }
          })
          .then(res => res.json())
          .then(data => {
            console.log('data get all users', data);
            testCount = data.length;
            expect(data[0].id)
              .to.be.ok;
            expect(data)
              .to.have.length.above(0);
            done();
          })
          .catch((err) => done(err));
      });
      // app.post('/dev/users', hasValidAPIToken, createUser);
      it('should allow a developer to add a user when presented with the right access token', function (done) {
        axios.post(`http://localhost:${PORT}/dev/users`, { email: `test${testCount}`, password: 'test', lyftToken: '23jlkjd39' }, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            // console.log('res', res);
            testUserId = res.data[0].id;
            assert.equal(res.status, 200, 'did not return 200', res.status);
            done();
          })
          .catch((err) => done(err));
      });
      // app.get('/users/:userid', hasValidAPIToken, getUserDashboardData);
      it('return the correct data for users posted to the DB', function (done) {
        let url = `http://localhost:${PORT}/users/${testUserId}`;
        fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': process.env.CARVIS_API_KEY
            }
          })
          .then(res => res.json())
          .then(data => {
            let newPassword = data.password || data[0].password;
            let newLyftToken = data.lyftToken || data[0].lyftToken;
            expect('test')
              .to.equal(newPassword);
            expect('23jlkjd39')
              .to.equal(newLyftToken);
            done();
          })
          .catch((err) => done(err));
      });
      // app.put('/users/:userid', hasValidAPIToken, updateUserData);
      // only tests for a 200 response
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

      // app.put('/users/:userid', hasValidAPIToken, updateUserData);
      it('should update a user and find the update in Redis', function (done) {
        let apiURL = `http://localhost:${PORT}/users/${testUserId}`; // hardcoded... bad.
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
            data = data[0]; // [{}] => {}
            // test for a non-empty response
            expect(data.id)
              .to.be.ok;
            // fetch the existing user, find new random email (in Redis)
            redisHashGetOne(data.id, 'email', newEmail => {
              expect(newEmail)
                .to.equal(body.email);
              done();
            });
          })
          .catch(err => console.warn('error fetch', err));
      });

      // the below tests: (note: could be separated out)
      // app.post('/rides', hasValidAPIToken, addRide);
      // app.put('/rides/:rideid', hasValidAPIToken, updateRide);
      // app.delete('/rides/:rideid', hasValidAPIToken, deleteRide);
      it('should add, update and delete a ride', function (done) {
        let url = `http://localhost:${PORT}/web/addRide`;
        let body = {
          winner: {
            vendor: 'Uber',
            estimate: 100,
            estimateType: 'fare'
          },
          origin: {
            descrip: 'test',
            coords: [1, 2]
          },
          destination: {
            descrip: 'test',
            coords: [1, 2]
          },
          userId: testUserId,
          rideStatus: 'estimate'
        };
        // create a ride
        fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': process.env.CARVIS_API_KEY
            },
            body: JSON.stringify(body)
          })
          .then(res => res.json())
          .then(data => {
            console.log('success create ride', data);

            // some equality tests for the req.body
            expect(data.rideStatus)
              .to.equal('estimate');
            expect(data.winner)
              .to.equal('Uber');
            expect(data.originLat)
              .to.equal('1');

            let testRideId = data.id;
            let updateURL = `http://localhost:${PORT}/rides/${testRideId}`;

            let updateBody = {
              winner: {
                vendor: 'Uber',
                estimate: 100,
                estimateType: 'fare'
              },
              origin: {
                descrip: 'test',
                coords: [1, 2]
              },
              destination: {
                descrip: 'test',
                coords: [1, 2]
              },
              userId: testUserId,
              rideStatus: 'testing!' // only field that changed
            };

            fetch(updateURL, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'x-access-token': process.env.CARVIS_API_KEY
                },
                body: JSON.stringify(updateBody)
              })
              .then(res => res.json())
              .then(data => {
                console.log('success update ride', data);
                // the ID of the updated ride equals the ID of the original
                expect(data.id)
                  .to.equal(testRideId);
                // updated rideStatus reflects new rideStatus
                expect(data.rideStatus)
                  .to.equal('testing!');

                let deleteURL = `http://localhost:${PORT}/rides/${testRideId}`;
                fetch(deleteURL, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-access-token': process.env.CARVIS_API_KEY
                    }
                  })
                  .then(res => res.json())
                  .then(data => {
                    console.log('success delete ride', data);
                    done();
                  })
                  .catch(err => done(err));
              })
              .catch(err => done(err));
          })
          .catch(err => done(err));
      });

      // app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);
      it('should delete the user created by the developer', function (done) {
        axios.delete(`http://localhost:${PORT}/dev/users/${testUserId}`, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            // test for an OK statuscode / response.
            assert.equal(res.status, 200, 'did not return 200', res.status);

            // test if the user was really deleted.
            let url = `http://localhost:${PORT}/users/${testUserId}`;
            fetch(url, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'x-access-token': process.env.CARVIS_API_KEY
                }
              })
              .then(res => res.json())
              .then(data => {
                console.log('successful could not find user after delete', data);
                expect(data)
                  .to.be.an('object');
                expect(data)
                  .to.be.empty;
                done();
              })
              .catch(err => done(err));
          });
      });
      // app.post('/users/updateOrCreate', hasValidAPIToken, updateOrCreateUser)
      it('should properly update or create', function (done) {
        let url = `http://localhost:${PORT}/users/updateOrCreate`;
        let body = {
          email: 'newuser@gmial.com',
          password: 'yo',
          lyftToken: 'yellow'
        };
        // updateOrCreate - create
        fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': process.env.CARVIS_API_KEY
            },
            body: JSON.stringify(body)
          })
          .then(res => res.json())
          .then(data => {
            console.log('successful updateOrCreate', data);
            expect(data.lyftToken)
              .to.equal(body.lyftToken);
            let userId = data.id;
            let secondBody = {
              id: userId,
              email: 'newuser@gmial.com',
              password: 'yo',
              lyftToken: 'blue'
            };
            // updateOrCreate - update
            console.log('firing second fetch updateOrCreate - update');
            fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-access-token': process.env.CARVIS_API_KEY
                },
                body: JSON.stringify(secondBody)
              })
              .then(res => res.json())
              .then(data => {
                console.log('successful updateOrCreate second pass', data);
                expect(data.lyftToken) // lyftToken - new lyftToken
                  .to.equal(secondBody.lyftToken);
                expect(data.email) // email - old/same email
                  .to.equal(body.email);
                expect(data.id) // userId same as before
                  .to.equal(userId);
                done();
              })
              .catch(err => done(err));
          })
          .catch(err => done(err));
      });

      // ========== alexa tests =============== //
      let alexaUserId = "amzn1.account.AM3B227HF3FAM1B261HK7FFM3A2";
      it('should return the correct data for an Alexa launch intent request', function (done) {
        axios.post(`http://localhost:${PORT}/alexa/launch/${alexaUserId}`, {
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
          // remove the hash just created
          redisDelete('testKey', () => done());
        });
      });

      it('should set a key with expiration', function (done) {
        redisSetKeyWithExpire('testAnotherKey', 1, 'anotherTestValue', function () {
          redisGetKey('testAnotherKey', res => {
            // test the setting / getting of the key
            expect(res)
              .to.equal('anotherTestValue');
          });

          // test the expiration
          setTimeout(() => {
            redisGetKey('testAnotherKey', res => {
              expect(res)
                .not.to.equal('anotherTestValue');
              // remove the key just added.
              redisDelete('testAnotherKey', () => done());
            });
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
        // remove the hash just created
        redisDelete('testHash', () => done());
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
        let apiURL = `http://localhost:${PORT}/internal/lyftBearerToken`
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
          .catch(err => {
            console.warn('error fetch', err);
            done(err);
          });
      });

      // commented out until helper api - carvis api in production
      // it('should do an integration test with the helper API', function (done) {
      //   // get the current lyftToken
      //   redisGetKey('lyftBearerToken', token => {
      //     console.log('current token', token);
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
      //           redisGetKey('lyftBearerToken', newToken => {
      //             expect(newToken)
      //               .not.to.equal(token);
      //             done();
      //           });
      //         }, 5000);
      //       })
      //       .catch(err => {
      //         console.warn('error refreshing token', err);
      //         done(err);
      //       });
      //   });
      // });

      it('should add a user to redis on creating a user', function (done) {
        let apiURL = `http://localhost:${PORT}/dev/users`
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
            console.log('success create user', data);
            redisTestUser = data[0].id;
            // fetch the new user, find the same email (in Redis)
            redisHashGetOne(redisTestUser, 'email', function (res) {
              expect(res)
                .to.equal(body.email);
              done();
            });
          })
          .catch(err => {
            console.warn('error fetch', err);
            done(err);
          });
      });

      it('should update a user and find the update in Redis', function (done) {
        var apiURL = `http://localhost:${PORT}/users/2`
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
          .then(res => res.json())
          .then(data => {
            // console.log('success update user', data);
            // fetch the existing user, find new random email (in Redis)
            redisHashGetOne(data[0].id, 'email', function (res) {
              expect(res)
                .to.equal(body.email);
              done();
            });
          })
          .catch(err => {
            console.warn('error delete user', err);
            done(err);
          });
      });
      // more tests within Redis.
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
          .catch(err => {
            console.warn('error fetch', err);
            done(err);
          });
      });

      it('should validate using that new key', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/testMyKey`
        let body = {
          count: 1
        };
        let token = keyObj.devKey;

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
            console.log('success public route test', data);
            // test for truthy response
            expect(data)
              .to.be.ok;
            done();
          })
          .catch(err => {
            console.warn('error public route test', err);
            done(err);
          });
      });

      it('should not validate using nonexistent key', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/testMyKey`
        let body = {
          count: 1
        };
        let token = keyObj.devKey + '1';

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
            console.log('public route test w wrong key', data);
            // test for truthy response
            expect(data.message)
              .to.equal('invalid API key');
            done();
          })
          .catch(err => {
            console.warn('error public route test', err);
            done(err);
          });
      });

      it('should increment key value when using DeveloperAPI', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/testMyKey`
        let body = {
          count: 1
        };
        let token = keyObj.devKey;
        // get the initial value of the developer key
        redisGetKey(token, count => {
          // post to the internal route, which routes to the helper API
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
              console.log('success lyftPhoneAuth via public route', data);
              // test for truthy response
              expect(data)
                .to.be.ok;
              redisGetKey(token, (newVal) => {
                expect(newVal)
                  .to.be.above(count);
                done();
              });
            })
            .catch(err => {
              console.warn('error fetch', err);
              done(err);
            });
        });
      });

      it('should do a placesCall', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/places`
        let token = keyObj.devKey;
        let body = {
          place: 'hack reactor', // destination.query
          origin: {
            descrip: 'Casa de Shez',
            coords: [37.7773563, -122.3968629] // Shez's house
          }
        };

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
            console.log('success public placesCall', data);
            // test for truthy response
            expect(data.body.place)
              .to.be.ok;
            // works, but can add more precise checks.
            done();
          })
          .catch(err => {
            console.warn('error public placesCall', err);
            done(err);
          });
      });

      // NOTE: currently Lyft will always return a -1 here, as we're overwriting the lyftBearerToken with the string 'true' in a previous test.
      it('should invoke addRide after getEstimate', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/estimate`
        let token = keyObj.devKey;
        let body = {
          requestType: 'cheap',
          origin: {
            descrip: 'Casa de Shez',
            coords: [37.7773563, -122.3968629] // Shez's house
          },
          destination: {
            descrip: 'Hack Reactor, Market Street, San Francisco, CA, United States',
            coords: [37.7836966, -122.4089664]
          },
          userId: 1
        };

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
            console.log('success public getEstimate', data);
            let rideId = data.id;
            // test for truthy response
            expect(data)
              .to.be.ok;
            // delete the ride we just created
            let deleteURL = `http://localhost:${PORT}/rides/${rideId}`
            fetch(deleteURL, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'x-access-token': process.env.CARVIS_API_KEY
                }
              })
              .then(res => res.json())
              .then(data => {
                // optional - check if really deleted.
                done();
              })
              .catch(err => {
                console.warn('error delete ride', err);
                done(err);
              });
          })
          .catch(err => {
            console.warn('error public getEstimate', err);
            done(err);
          });
      });

      it('should add a DB record on addRide', function (done) {
        let apiURL = `http://localhost:${PORT}/developer/addRide`
        let token = keyObj.devKey;
        let userId = 1;
        let rideId;
        let body = {
          winner: {
            vendor: 'Uber',
            estimate: 623,
            estimateType: 'fare'
          },
          userId: userId,
          origin: {
            descrip: 'Casa de Shez',
            coords: [37.7773563, -122.3968629]
          },
          destination: {
            descrip: 'Hack Reactor, Market Street, San Francisco, CA, United States',
            coords: [37.7836966, -122.4089664]
          }
        };

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
            console.log('success public addRide', data);
            // test for truthy response
            expect(data)
              .to.be.ok;
            rideId = data.id;
            console.log('rideId in addRide is', rideId);
            let queryURL = `http://localhost:${PORT}/rides/${userId}`;

            return fetch(queryURL, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'x-access-token': process.env.CARVIS_API_KEY
                }
              })
              .then(res => res.json())
              .then(data => {
                // console.log('rides for user', userId, data);
                expect(data)
                  .to.be.ok;
                // returns an array of objects, which have `id`
                // we check the user's rides to see if our test ride was added.
                for (let i = 0, len = data.length; i < len; i++) {
                  if (data[i]['id'] === rideId) {
                    // delete the ride we just created
                    let deleteURL = `http://localhost:${PORT}/rides/${rideId}`
                    fetch(deleteURL, {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-access-token': process.env.CARVIS_API_KEY
                        }
                      })
                      .then(res => res.json())
                      .then(data => {
                        // optional - check if really deleted.
                        done();
                      })
                      .catch(err => {
                        console.warn('error delete ride', err);
                        done(err);
                      });
                  }
                }
              })
              .catch(err => {
                console.warn('error db fetch ride for user', err);
                done(err);
              });
          })
          .catch(err => {
            console.warn('error public addRide', err);
            done(err);
          });
      });

      // live test, would actually request a ride
      // /developer/requestRide
      // it('should request a ride from the public endpoint', function(done) {
      //
      // });

      // can only test this after requesting a ride - risky
      // app.post('developer/shareETA/:userid', hasValidDevAPIToken, shareRideETA);
      // it('should return the shareETA URL', function (done) {
      //
      // });

      // note: commented out as it triggers a live SMS from Twilio -
      // uncomment this test when needed.
      // test separated from shareETA - invokes createMessage the same way.

      // it('should invoke createMessage with Twilio', function (done) {
      //   let url = `http://localhost:${PORT}/internal/sendTwilio`;
      //   let body = {
      //     message: 'test Twilio - Carvis-API'
      //   };
      //
      //   fetch(url, {
      //       method: 'POST',
      //       headers: {
      //         'x-access-token': process.env.CARVIS_API_KEY,
      //         'Content-Type': 'application/json'
      //       },
      //       body: JSON.stringify(body)
      //     })
      //     .then(res => res.json())
      //     .then(data => {
      //       console.log('success Twilio createMessage', data);
      //       expect(data)
      //         .to.be.ok;
      //       done();
      //     })
      //     .catch(err => done(err));
      // });

      // can only test this after requesting a ride - risky
      // app.post('/developer/cancelRide/:userid', hasValidDevAPIToken, cancelRide);
      // it('should cancel a requested ride', function(done) {
      //
      // });

      // note: this test should be done last - as it invalidates the previously created key.
      it('should return 404 if key used >99 times', function (done) {
        let token = keyObj.devKey;
        let apiURL = `http://localhost:${PORT}/developer/testMyKey`;
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
              redisDelete(token, () => done());
            } else {
              // test for truthy response
              expect(data)
                .to.be.ok;
              let err = 'RATE LIMITING NOT WORKING!';
              redisDelete(token, () => done(err));
            }
          })
          .catch(err => {
            console.warn('error fetch', err);
            done(err);
          });
      });
      /* note:
      integration testing for '/developer/lyftPhoneCodeAuth', not possible - as the code is sent by Lyft to the phoneNumber via SMS (and the phoneNumber has to be registered with them, so we can't use a Twilio number).

      app.post('/developer/uberLogin', hasValidDevAPIToken, uberLogin);
      note: to test this we need to add uberlogin credentials to process.env.

      to test actual requestRide -- we need to either make a dummy endpoint or code in the tokens so the third parties validate our requests.
      */
    });
    // TODO: integration tests for Ride.js and Redis / DB associated.
    // describe ... other tests
  });
});
