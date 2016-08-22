import bluebird from 'bluebird';

// to have Travis test redis, we need fakeredis - bit of a hack.
const checkTravis = process.env.TRAVIS ? JSON.parse(process.env.TRAVIS) : false;
const redis = checkTravis ?
  require('fakeredis') : bluebird.promisifyAll(require('redis'));

const CARVIS_CACHE_PORT = process.env.CARVIS_CACHE_PORT || 6379;
const CARVIS_CACHE = process.env.CARVIS_CACHE || '127.0.0.1';
const client = redis.createClient(CARVIS_CACHE_PORT, CARVIS_CACHE);

// this sets the Redis server as an LRU cache with 400MB space.
// elasticcache micro has 555MB, but leaving some space for safety ?
if (!process.env.TRAVIS) {
  client.config("SET", "maxmemory", "400mb");
  client.config("SET", "maxmemory-policy", "allkeys-lru");
}

// function to create a hash or set a new key:value on an existing hash
// hashName -- ie. userId (use carvis userId)
// keyValArray should be formatted [key, value, key, value]
export const redisSetHash = (hashName, keyValArray, cb) => {
  client.hmsetAsync(hashName, keyValArray)
    .then(res => {
      console.log('redis success creating', hashName, res);
      if (cb) {
        return cb(res);
      } else {
        return res;
      }
    })
    .catch(err => console.warn('redis error creating', hashName, err));
};

// function to get all key:value pairs from a hash
// hashName -- ie. userId
export const redisHashGetAll = (hashName, cb) => {
  client.hgetallAsync(hashName)
    .then(res => {
      console.log('redis success fetching', hashName, res);
      if (cb) {
        return cb(res);
      } else {
        return res;
      }
    })
    .catch(err => console.warn('redis error fetching', hashName, err));
};

// function to get a specific key:value from a hash
// hashName -- ie. userId || keyName -- ie. 'lyftToken'
export const redisHashGetOne = (hashName, keyName, cb) => {
  client.hgetAsync(hashName, keyName)
    .then(res => {
      console.log('redis success fetching', keyName, 'from', hashName, res);
      if (cb) {
        return cb(res);
      } else {
        return res;
      }
    })
    .catch(err => console.warn('redis error fetching', keyName, 'from', hashName, err));
};

// function to set a flat key -- ie. externalAPIToken:<token> | value.
export const redisSetKey = (keyName, value, cb) => {
  client.setAsync(keyName, value)
    .then(res => {
      console.log('redis success setting', keyName, res);
      if (cb) {
        return cb(res);
      } else {
        return res;
      }
    })
    .catch(err => console.warn('redis error setting key', keyName));
};

// function to set a flat key  with expire
export const redisSetKeyWithExpire = (keyName, expire, value, cb) => {
  client.setexAsync(keyName, expire, value)
    .then(res => {
      console.log('redis success setting', keyName, 'expire', expire, res);
      if (cb) {
        return cb(res);
      } else {
        return res;
      }
    })
    .catch(err => console.warn('redis error setting key', keyName));
};

// function to get a flat key:value -- ie. externalAPIToken:<token>
export const redisGetKey = (keyName, cb) => {
  client.getAsync(keyName)
    .then(res => {
      console.log('redis success getting', keyName, res);
      if (cb) {
        return cb(res);
      } else {
        return res;
      }
    })
    .catch(err => console.warn('redis error getting key', keyName));
};
