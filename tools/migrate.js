import db from '../dist/db/db';
import {UserSchema} from '../dist/server/models/User';
import {RideSchema} from '../dist/server/models/Ride';

let tables = [
  {name: 'rides', schema: RideSchema},
  {name: 'users', schema: UserSchema}
];

db.migrate(tables)
.then(() => console.log('migration complete'))
.then(() => db.endConnection());
