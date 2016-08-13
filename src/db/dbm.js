// const DB_CONFIG_OBJ = require('../../secret/config').DB_CONFIG_OBJ;
import Stork from './stork/index';
import pg from 'pg';
pg.defaults.ssl = true;

export default new Stork({
  connection: process.env.DATABASE_URL,
  client: 'pg'
});
