const assert = require('chai').assert;
const axios = require('axios');
const server = require('./testServer');
let currentListeningServer;

describe('API server', function () {
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
      it('should ', function (done) {
        axios.get('http://localhost:3030/dev/users', {
          headers: {'x-access-token': process.env.CARVIS_API_KEY || require('../secret/config').CARVIS_API_KEY}
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        });
      });
    });
  });


});
