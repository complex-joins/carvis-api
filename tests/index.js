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

let currentListeningServer;
let PORT = 8080;
let testUserId;
let testCount;
let redisTestUser;
let keyObj = {};

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
  before(function () {
    currentListeningServer = server.default.listen(PORT);
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
        axios.get(`http://localhost:${PORT}/dev/users`, {
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': process.env.CARVIS_API_KEY
            }
          })
          .then((res) => {
            testCount = res.data.length;
            assert.equal(res.status, 200, 'did not return 200', res.status);
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
      // app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);
      it('should delete the user created by the developer', function (done) {
        axios.delete(`http://localhost:${PORT}/dev/users/${testUserId}`, {
            headers: { 'x-access-token': process.env.CARVIS_API_KEY }
          })
          .then((res) => {
            assert.equal(res.status, 200, 'did not return 200', res.status);
            done();
          });
      });
      // app.post('/users/updateOrCreate', hasValidAPIToken, updateOrCreateUser)
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
          .catch(err => console.warn('error fetch', err));
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
          .catch(err => console.warn('error fetch', err));
      });

      it('should remove a user from redis on deleteUser', function (done) {
        let url = `http://localhost:${PORT}/dev/users/${redisTestUser}`;
        // tests the combination of the user and redis delete methods
        fetch(url, {
            method: 'DELETE',
            headers: {
              'x-access-token': process.env.CARVIS_API_KEY,
              'Content-Type': 'application/json'
            }
          })
          .then(res => res.json())
          .then(data => {
            console.log('success remove user', data);
            redisHashGetAll(redisTestUser, result => {
              if (result) {
                let err = 'redis did not remove user';
                done(err);
              } else {
                done();
              }
            });
          })
          .catch(err => console.warn('error delete user', err));
      });

      it('should update a user and find the update in Redis', function (done) {
        let apiURL = `http://localhost:${PORT}/users/5`; // hardcoded... bad.
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
            redisHashGetOne(data[0].id, 'email', newEmail => {
              expect(newEmail)
                .to.equal(body.email);
              done();
            });
          })
          .catch(err => console.warn('error fetch', err));
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
          .catch(err => console.warn('error fetch', err));
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
          .catch(err => console.warn('error public route test', err));
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
          .catch(err => console.warn('error public route test', err));
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
            .catch(err => console.warn('error fetch', err));
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
          .catch(err => console.warn('error public placesCall', err));
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
              .catch(err => console.warn('error delete ride', err));
          })
          .catch(err => console.warn('error public getEstimate', err));
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
                      .catch(err => console.warn('error delete ride', err));
                  }
                }
              })
              .catch(err => console.warn('error db fetch ride for user', err));
          })
          .catch(err => console.warn('error public addRide', err));
      });

      // /developer/requestRide
      // it('should request a ride from the public endpoint', function(done) {
      //
      // });

      // note: this test should be done last - as it invalidates the previously created key.
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
              redisDelete(token, () => done());
            } else {
              // test for truthy response
              expect(data)
                .to.be.ok;
              let err = 'RATE LIMITING NOT WORKING!';
              redisDelete(token, () => done(err));
            }
          })
          .catch(err => console.warn('error fetch', err));
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
