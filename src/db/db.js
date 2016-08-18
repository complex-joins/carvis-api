import Stork from 'storkSQL';
import pg from 'pg';
pg.defaults.ssl = true;

const dbConnection = new Stork(JSON.parse(process.env.DB_CONFIG_OBJ_JSON), 'pg');
export default dbConnection;


//
// function parseConnectionString() {
//   process.env.DB_CONFIG
// }
