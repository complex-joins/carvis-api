const {UserSchema} = require('../dist/server/models/User');
const {RideSchema} = require('../dist/server/models/Ride');

exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('users', UserSchema),
      knex.schema.table('rides', RideSchema)
    ])
};

// TODO make migrations more efficient by doing the diff and only adding the new columns..

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('users')
  ]);
};
