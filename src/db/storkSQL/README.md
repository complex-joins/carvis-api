## Getting Started ##
https://github.com/alexcstark/storkSQL

You'll need two things to get started: the library and a DB client.

`npm install storkSQL`

`npm install pg`

Stork uses knex which supports pg, mySQL, and SQlite.

### Configure the database ###

`db.js`
```javascript
import Stork from 'storkSQL';
// Put your information below
const DB_CONFIG_OBJ = {
  host: '',
  password: '',
  database: '',
  port: 3241,
  user: '',
  ssl: true
};
export default new Stork(DB_CONFIG_OBJ, 'pg');
```

The following methods on the db object exist to help you manage your database.
```
  dropTableIfExists(tableName)
  hasTable(tableName)
  createTable(tableName, schema)
  endConnection()
```

### Set up your schema and models ###
`User.js`
```javascript
import db from './path/to/db.js';
export const UserSchema = function (user) {
  user.increments('id').primary();
  user.string('email', 100).unique();
  user.string('password', 100);
  user.string('homeLatitude', 100);
  user.string('homeLongitude', 100);
  user.string('homeAddress', 100);
  user.timestamps();
};
export const User = dbm.model('users');
```

This will give you access to the following queries:
```
findAll()
findById(id)
find(obj)
findOne(obj)
findOrCreate(obj)
create(obj)
save(obj)
updateOrCreate(obj)
update(criteriaObj, updateObj)
remove(obj)
```

Each query will return a promise that must be resolved, like so:
```javascript
User.find({id: req.params.userid})
  .then((user) => res.json(user));
};
```

The library also support salting, hashing, and comparing passwords for Users
```
generateHash(password)
isValidPassword(password, userid)
```

It is recommended to create files to help manage your DB like this:
```javascript
import db from '../db';
import {RideSchema} from '../Ride';
import {UserSchema} from '../User';

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


```

Remember to transpile as async/await isn't supported everywhere, yet.


## To-Do ##
* Testing
* Relationships and joins
