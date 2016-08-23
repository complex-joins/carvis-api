import Stork from 'storkSQL';
let DB_CONFIG;
console.log('in AWS env', process.env.AWS);
if (process.env.AWS && JSON.parse(process.env.AWS)) {
  DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: true
  };
} else {
  DB_CONFIG = JSON.parse(process.env.DB_CONFIG_OBJ_JSON);
}

const dbConnection = new Stork(DB_CONFIG, 'pg');
export default dbConnection;
