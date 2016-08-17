import Stork from 'storkSQL';
console.log('before requiring in db/db.js');
const DB_CONFIG_OBJ = process.env.DB_CONFIG_JSON ? JSON.parse(DB_CONFIG_JSON) : require('../../secret/config').DB_CONFIG_OBJ;
console.log('after requiring in db/db.js');


const dbConnection = new Stork(DB_CONFIG_OBJ, 'pg');
export default dbConnection;
