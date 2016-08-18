import Stork from 'storkSQL';
// const DB_CONFIG_OBJ =
console.log(process.env.newest);
// console.log(DB_CONFIG_OBJ, typeof DB_CONFIG_OBJ);
// let db = {host:"ec2-54-163-245-32.compute-1.amazonaws.com","password":"q5n2_cI-kAXn3ILwTwTOncJqjk","database":"d58chdd0ccaivt","port":5432,"user":"vabewtuoqwydkd","ssl":true};
const dbConnection = new Stork(JSON.parse(process.env.DB_CONFIG_OBJ_JSON), 'pg');
export default dbConnection;
