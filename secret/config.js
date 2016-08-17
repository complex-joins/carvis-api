// secret/config.js

// Create a copy of this file called config.js and put your API keys there
module.exports = {
  DB_CONFIG_OBJ: {
    host: 'ec2-54-225-89-110.compute-1.amazonaws.com',
    password: 'oRSQ_ftv16N6j73loVMTdwgbZW',
    database: 'd2f7venevnjv5t',
    port: 5432,
    user: 'ecogqyqjcbbetg',
    ssl: true
  },
  UBER_SERVER_TOKEN: 'pG-f76yk_TFCTMHtYHhY7xUfLVwmt9u-l4gmgiHE',
  GOOGLE_PLACES_API_KEY: 'AIzaSyDlX18NHXJ27_aZaXfpuABKe4B_ysOcoPA',
  LYFT_BEARER_TOKEN: 'gAAAAABXqkmC1umTQbXVia0xRwloEZkq1ljy5eT1Mk2VfTuE6iMqkWeRDiTBXEmhlNuFUTpwJLu6zbEeRoACqnfp_uFZnpGAEROwnIm3nvV8QLAJD0jrGBGk8ErUgyMlytHXpJ0-cup_3aSv1TH3or368C34grkfSIkN3xbnrH7u6MsQMvHUXN8VJi8xbUNaMLK1Y9HMA51NXApOxhGUan2ZDTqop9UM2A==',
  LYFT_USER_ID: 'gC8NlVZa847Y:PB3nRSO6pvd6SqV_85yr_hC-wgIDL0e-',
  twilioCredentials: {
    accountSid: 'ACbec44eaea12e629b07ccc6f5a8371836',
    authToken: 'a3adbdb1e299c34ef0ac11e8cc859bfd'
  },
  CARVIS_API: '54.183.205.82',
  CARVIS_API_KEY: 'o2h3nrkjSDfQ@#rjlks2$TASjdfs',
  USER_ENCRYPT: '239823jf'
};

/*
LYFT_BEARER_TOKEN currently hardcoded, needs to be updated every 86400 seconds.
TODO: update dynamically:
-- for updating one has to use the `refreshBearerToken` function from './../src/server/utils/d.js'.
*/
