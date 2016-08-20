const bluebird = require("bluebird");
bluebird.promisifyAll(require('redis')); // ie. client.getAsync()
const client = redis.createClient();

// this sets the Redis server as an LRU cache with 400MB space.
// elasticcache micro has 555MB, but leaving some space for safety ?
client.config("SET", "maxmemory", "400mb");
client.config("SET", "maxmemory-policy", "allkeys-lru");

// function to create a hash or set a new key:value on an existing hash
// hashName -- ie. userId
export const redisSetHash = (hashName, keyValArray, cb) => {
  client.hmset(hashName, keyValArray, (err, res) => {
    if (err) {
      console.warn('redis error creating', hashName, err);
    } else {
      console.log('redis success creating', hashName, res);
      // if (cb) {
      //   cb(res);
      // }
    }
  });
};

// function to get all key:value pairs from a hash
// hashName -- ie. userId
export const redisHashGetAll = (hashName, cb) => {
  client.hgetall(hashName, (err, res) => {
    if (err) {
      console.warn('redis error fetching', hashName, err);
    } else {
      console.log('redis success fetching', hashName, res);
      // if (cb) {
      //   cb(res);
      // }
    }
  });
};

// function to get a specific key:value from a hash
// hashName -- ie. userId || keyName -- ie. 'lyftToken'
export const redisHashGetOne = (hashName, keyName, cb) => {
  client.hget(hashName, keyName, (err, res) => {
    if (err) {
      console.warn('redis error fetching', keyName, 'from', hashName, err);
    } else {
      console.log('redis success fetching', keyName, 'from', hashName, res);
      // if (cb) {
      //   cb(res);
      // }
    }
  });
};

// function to set a flat key -- ie. externalAPIToken:<token> | value.
export const redisSetKey = (keyName, value, cb) => {
  client.set(keyName, value, (err, res) => {
    if (err) {
      console.warn('redis error setting key', keyName);
    } else {
      console.log('redis success setting', keyName, res);
      // if (cb) {
      //   cb(res);
      // }
    }
  });
};

// function to get a flat key:value -- ie. externalAPIToken:<token>
export const redisGetKey = (keyName) => {
  client.get(keyName, (err, res) => {
    if (err) {
      console.warn('redis error getting key', keyName);
    } else {
      console.log('redis success getting', keyName, res);
      // if (cb) {
      //   cb(res);
      // }
    }
  });
};
