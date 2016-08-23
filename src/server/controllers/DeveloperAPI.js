import { redisSetKeyWithExpireAsync, redisIncrementKeyValue } from './../../redis/redisHelperFunctions';
import { uuid } from 'uuid-v4';

// the below functions are used to create an API token with limited validity - for external developers.

// The keys are added to Redis and given an expiration time and expiration based on usage (100 calls).
// They are also only valid for certain routes (public API routes).

export const createNewDeveloperKey = (req, res) => {
  // generate a unique id for the new key
  var newKey = uuid();
  // set a 3 day expiration on the key
  redisSetKeyWithExpireAsync(newKey, 259200, 0)
    .then(() => {
      // return the new key to the client -- this is their API key
      res.json(newKey);
    })
    .catch(err => {
      console.warn('error setting developer key redis', err);
    });
};
