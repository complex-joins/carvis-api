import db from '../src/db/db';
import {UserSchema} from '../src/server/models/User';
import {RideSchema} from '../src/server/models/Ride';

let tables = [
  {name: 'rides', schema: RideSchema},
  {name: 'users', schema: UserSchema}
];

db.migrate(tables)
.then(() => console.log('migration complete'));
