/* ======== REDIS SCHEMA =====
places:
---------
city:{query}:{id}:lat || lng || routableAddress : <string>
--> for {id} etc. we use redis SCAN on city:{query}
==============================
userdata:
---------
users:{userId}:lyftToken: <string>
users:{userId}:lyftPaymentInfo: <string>
...other params
--> we query the specific needed userParams directly based on userId
===============================
LyftVendorToken
--------
internalTokens:LyftVendorToken: <string>
===============================
RATE LIMITING
--------
externalTokens:{tokenId}: <string>
===============================
*/
const bluebird = require("bluebird");
bluebird.promisifyAll(require('redis')); // promisified versions have 'Async' postfix - ie. client.getAsync() and client.hgetallAsync()
const client = redis.createClient();

// this sets the Redis server as an LRU cache with 400MB space.
// elasticcache micro has 555MB, but leaving some space for safety ?
client.config("SET", "maxmemory", "400mb");
client.config("SET", "maxmemory-policy", "allkeys-lru");
