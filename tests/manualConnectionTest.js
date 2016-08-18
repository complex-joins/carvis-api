const DB_CONFIG_OBJ = (process.env.DB_CONFIG_JSON) 
  ? JSON.parse(process.env.DB_CONFIG_JSON) 
  : require('../secret/config').DB_CONFIG_OBJ;
import Stork from 'storkSQL';

const dbConnection = new Stork(DB_CONFIG_OBJ, 'pg');

import {User} from '../src/db/User';
//
// User.findAll()
// .then((users) => console.log(users));

// User.create({email: 'alex@gmail', password:'gobblegobble'})
// .then((user) => console.log(user));
// User.findAll()
// .then((users) => console.log(User.decryptCollection(users)));
//
