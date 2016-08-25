import Stork from 'storkSQL';
const dbConnection = new Stork({
  connection: JSON.parse(process.env.DB_CONFIG_OBJ_JSON),
  client: 'pg'
});
export default dbConnection;
