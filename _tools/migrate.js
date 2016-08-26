'use strict';

var _db = require('../dist/db/db');

var _db2 = _interopRequireDefault(_db);

var _User = require('../dist/server/models/User');

var _Ride = require('../dist/server/models/Ride');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tables = [{ name: 'rides', schema: _Ride.RideSchema }, { name: 'users', schema: _User.UserSchema }];

_db2.default.migrate(tables).then(function () {
  return console.log('migration complete');
}).then(function () {
  return _db2.default.endConnection();
});