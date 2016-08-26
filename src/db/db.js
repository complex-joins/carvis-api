import Stork from './storkSQL/src/index.js';
// require('dotenv').config();
let DB_CONFIG;

// if (process.env.PG_PORT_5432_TCP_ADDR) {
//   DB_CONFIG = {
//     host: process.env.PG_PORT_5432_TCP_ADDR,
//     port: 5432,
//     // ssl: true,
//     user: process.env.POSTGRES_USER,
//     password: process.env.POSTGRES_PASSWORD
//   };
// } else {
  DB_CONFIG = {
    host: process.env.TEST_DB_HOST,
    port: 5432,
    database: process.env.TEST_DB_DATABASE,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASS,
    ssl: true
  };
// }

// }
// console.log(DB_CONFIG);

// if (process.env.AWS && JSON.parse(process.env.AWS)) {
//   DB_CONFIG
// } else {
//   // DB_CONFIG = JSON.parse(process.env.DB_CONFIG_OBJ_JSON);
// }

const dbConnection = new Stork({
  connection: DB_CONFIG,
  client: 'pg'
});

export default dbConnection;
