import Stork from 'storkSQL';
const DB_CONFIG = convertDB_CONFIG(process.env.DB_CONFIG_OBJ_JSON);
const dbConnection = new Stork(JSON.parse(process.env.DB_CONFIG_OBJ_JSON.slice(0, -1)), 'pg');
export default dbConnection;


function convertDB_CONFIG(input){
  let DB_CONFIG;
  if (input.indexOf("'password'") >= 0) {
    DB_CONFIG = input.replace(/\'/g, '"');
  } else {
    DB_CONFIG = input;
  }
  return DB_CONFIG;
}


console.log("test".slice(0, -1));
