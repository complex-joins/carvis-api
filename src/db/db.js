const DB_CONFIG_OBJ = require('../../secret/config').DB_CONFIG_OBJ;
import Stork from 'storkSQL';

const dbConnection = new Stork(DB_CONFIG_OBJ, 'pg');
export default dbConnection;
