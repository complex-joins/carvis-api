const db = require('../dist/db/db');
const {UserSchema} = require('../dist/server/models/User');
const {RideSchema} = require('../dist/server/models/Ride');

let tables = [
  {name: 'rides', schema: RideSchema},
  {name: 'users', schema: UserSchema}
];


db.migrate(tables)
.then(() => console.log('migration complete'));
