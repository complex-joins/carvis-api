import Stork from 'storkSQL';
let DB_CONFIG;
if (process.env.PROD) {
  DB_CONFIG = {
    host: process.env.PG_PORT_5432_TCP_ADDR,
    port: 5432,
    // ssl: true,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  };
}
// console.log('in AWS env', process.env.AWS);
// if (process.env.AWS && JSON.parse(process.env.AWS)) {
//   DB_CONFIG
// } else {
//   // DB_CONFIG = JSON.parse(process.env.DB_CONFIG_OBJ_JSON);
// }

const dbConnection = new Stork({
  connection: DB_CONFIG,
  client: 'pg'
});
console.log(dbConnection);
export default dbConnection;
