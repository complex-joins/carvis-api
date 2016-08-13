import db from '../src/db/db';
import {RideSchema} from '../src/db/Ride';
import {UserSchema} from '../src/db/User';

const resetDb = async function() {
  await db.dropTableIfExists('users');
  console.log('dropping users table');
  await db.dropTableIfExists('rides');
  console.log('dropping rides table');

  if (!(await db.hasTable('users'))) {
    await db.createTable('users', UserSchema);
    console.log('created new users table');
  }

  if (!(await db.hasTable('rides'))) {
    await db.createTable('rides', RideSchema);
    console.log('created new rides table');
  }

  await db.endConnection(); /* eslint-ignore */
  console.log('connection destroyed');
};


resetDb();
