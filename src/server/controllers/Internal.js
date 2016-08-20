import { redisGetKey, redisSetKeyWithExpire } from './../../redis/redisHelperFunctions';

export const updateLyftToken = (req, res) => {
  let token = req.body.token;
  redisSetKeyWithExpire('lyftBearerToken', 86000, token /*, cb*/ );
};

export const getLyftToken = (req, res) => {
  redisGetKey('lyftBearerToken', /*, cb*/ ); // returns value when no callback
};
