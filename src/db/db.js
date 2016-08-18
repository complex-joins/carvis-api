import Stork from 'storkSQL';
const DB_CONFIG_OBJ = (process.env.DB_CONFIG_JSON) 
  ? JSON.parse(process.env.DB_CONFIG_JSON) 
  : require('../../secret/config').DB_CONFIG_OBJ;

const dbConnection = new Stork(DB_CONFIG_OBJ, 'pg');
export default dbConnection;
