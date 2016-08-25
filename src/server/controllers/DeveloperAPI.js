import { redisSetKeyWithExpire, redisIncrementKeyValue } from './../../redis/redisHelperFunctions';
import uuid from 'uuid-v4';

// the below functions are used to create an API token with limited validity - for external developers.

// The keys are added to Redis and given an expiration time and expiration based on usage (100 calls).
// They are also only valid for certain routes (public API routes).

export const createNewDeveloperKey = (req, res) => {
  // generate a unique id for the new key
  let newKey = uuid();
  console.log('new dev api key', newKey);

  // set a 3 day expiration on the key
  return redisSetKeyWithExpire(newKey, 259200, 1, token => {
    res.json(newKey);
  });
};
