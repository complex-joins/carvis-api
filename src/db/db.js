import Stork from 'storkSQL';
const dbConnection = new Stork(JSON.parse(process.env.DB_CONFIG_OBJ_JSON), 'pg');
export default dbConnection;
