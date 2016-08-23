import Stork from 'storkSQL';
let DB_CONFIG =  {
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT
};
// console.log('in AWS env', process.env.AWS);
// if (process.env.AWS && JSON.parse(process.env.AWS)) {
//   DB_CONFIG
// } else {
//   // DB_CONFIG = JSON.parse(process.env.DB_CONFIG_OBJ_JSON);
// }

const dbConnection = new Stork(DB_CONFIG, 'pg');
export default dbConnection;
