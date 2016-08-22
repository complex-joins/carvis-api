import Stork from 'storkSQL';
console.log('env variables', process.env);
const dbConnection = new Stork(JSON.parse(process.env.DB_CONFIG_OBJ_JSON), 'pg');
export default dbConnection;
