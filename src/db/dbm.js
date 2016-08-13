const DB_CONFIG_OBJ = require('../../secret/config').DB_CONFIG_OBJ;
import Stork from './stork/index';

const dbConnection = new Stork(DB_CONFIG_OBJ, 'pg');
console.log(dbConnection);
export default dbConnection;
