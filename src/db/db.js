import Stork from 'storkSQL';
const DB_CONFIG = convertDB_CONFIG(process.env.DB_CONFIG_OBJ_JSON);
const dbConnection = new Stork(JSON.parse(process.env.DB_CONFIG_OBJ_JSON), 'pg');
export default dbConnection;


function convertDB_CONFIG(input){
  let test = "{'password':'q5n2_cI-kAXn3ILwTwTOncJqjk','database':'d58chdd0ccaivt','port':5432,'host':'ec2-54-163-245-32.compute-1.amazonaws.com','user':'vabewtuoqwydkd','ssl':true}";
  let DB_CONFIG;
  if (input.indexOf("'password'") >= 0) {
    DB_CONFIG = input.replace(/\'/g, '"');
  } else {
    DB_CONFIG = input;
  }
  return DB_CONFIG;
}
