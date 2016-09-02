import { redisGetKey, redisGetKeyAsync, redisSetKeyWithExpire, redisSetKeyWithExpireAsync } from './../../redis/redisHelperFunctions';
import fetch from 'node-fetch';
const CARVIS_HELPER_API = process.env.CARVIS_HELPER_API;
const CARVIS_HELPER_API_KEY = process.env.CARVIS_HELPER_API_KEY;

// the below sets and gets the bearer tokens -- invoked on post and get to the API server route '/internal/lyftBearerToken', called from the helper API where the logic to refresh the token lives.

// Redis functions return value when no callback is provided

export const updateLyftToken = (req, res) => {
  let token = req.body.token;
  console.log('updateLyftToken', token);

  // setTimeout is milliseconds, redis expire is seconds - this is ~1 day.
  redisSetKeyWithExpire('lyftBearerToken', 84600, token, result => {
    // refresh call to the helper API on expire time -- this will on success do a post to this API / function again (making it recursive at interval)
    setTimeout(() => {
      refreshToken();
    }, 84600000);
    res.json({ message: 'updated lyftBearerToken in redis' });
  });
};

export const getLyftToken = (req, res) => {
  console.log('getLyftToken in Internal');
  redisGetKey('lyftBearerToken', token => {
    if (token) {
      res.json(token);
    } else {
      // call the helper API to query Lyft for a token
      refreshToken(token => {
        res.json(token);
      });
    }
  });
};

export const refreshToken = (cb) => {
  let helperURL = `http://${CARVIS_HELPER_API}/lyft/refreshBearerToken`;
  fetch(helperURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      }
    })
    .then(res => res.json())
    .then(data => {
      if (cb) {
        return cb(data);
      } else {
        return data;
      }
    })
    .catch(err => console.warn('error refreshing token', err));
};
