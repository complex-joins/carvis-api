const assert = require('chai').assert;
const expect = require('chai').expect;
const axios = require('axios');
const request = require('supertest');
const server = require('./testServer');

const User = require('../src/server/models/User');

let currentListeningServer;

let testUserId;
let testCount;

describe('API server', function () {
  this.timeout(15000);
  before(function () {
    currentListeningServer = server.default.listen(3030);
  });

  after(function () {
    currentListeningServer.close();
  });

  describe('Check basic build', function () {
    it('should return 200', function (done) {
      axios.get('http://localhost:3030/')
      .then((res) => {
        assert.equal(res.status, 200, 'did not return 200', res.status);
        done();
      });
    });

    describe('Check restful routes', function () {

      it('should get all users when presented with the API access token', function (done) {
        axios.get('http://localhost:3030/dev/users', {
          headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
        })
        .then((res) => {
          testCount = res.data.length;
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        })
        .catch((err) => done(err));
      });

      it('should allow a developer to add a user when presented with the right access token', function (done) {
        axios.post('http://localhost:3030/dev/users', {email: `test${testCount}`, password: 'test', lyftToken: '23jlkjd39'}, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
        })
        .then((res) => {
          testUserId = res.data[0].id;
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        })
        .catch((err) => done(err));
      });

      it('return the correct data for users posted to the DB', function (done) {
        axios.get(`http://localhost:3030/users/${testUserId}`, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
        })
        .then((res) => {
          expect(res.status).to.equal(200);
          expect('test').to.equal(res.data[0].password);
          expect('23jlkjd39').to.equal(res.data[0].lyftToken);
          done();
        })
        .catch((err) => done(err));
      });

      it('should allow users to update their information', function (done) {
        axios.put(`http://localhost:3030/users/${testUserId}`, {email: 'test${testUserId}second@gmail.com', password: 'newtest'},
        { headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        })
        .catch((err) => done(err));
      });


      it('should delete the user created by the developer', function (done) {
        axios.delete(`http://localhost:3030/dev/users/${testUserId}`, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        });
      });

      it('should properly update or create', function (done) {
        axios.post(`http://localhost:3030/users/updateOrCreate`, {email: 'newuser@gmial.com', password: 'yo', lyftToken: 'yellow'}, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          expect(res.data.lyftToken).to.equal('yellow');
          return axios.post(`http://localhost:3030/users/updateOrCreate`, {email: 'newuser@gmial.com', password: 'yo', lyftToken: 'blue'}, {
            headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
          });
        })
        .then((res) => {
          expect(res.data.lyftToken).to.equal('blue');
          // expect().to.equal('yo');
          done();
        })
        .catch((err) => done(err));
      });

    });
  });
});
