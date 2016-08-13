const DB_CONFIG_OBJ = require('../secret/config').DB_CONFIG_OBJ;
import Stork from 'storkSQL';

const dbConnection = new Stork(DB_CONFIG_OBJ, 'pg');

import {User} from '../src/db/User';

User.findAll()
.then((users) => console.log(users));
