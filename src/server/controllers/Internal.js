import { redisGetKey, redisGetKeyAsync, redisSetKeyWithExpire, redisSetKeyWithExpireAsync } from './../../redis/redisHelperFunctions';
import fetch from 'node-fetch';
const CARVIS_HELPER_API = process.env.CARVIS_HELPER_API;
const CARVIS_HELPER_API_KEY = process.env.CARVIS_HELPER_API_KEY;

// the below sets and gets the bearer tokens -- invoked on post and get to the API server route '/internal/lyftBearerToken', called from the helper API where the logic to refresh the token lives.

// on client consumption - instead of looking in process.env - check redis with `getLyftToken`

// Redis functions return value when no callback is provided

export const updateLyftToken = (req, res) => {
  let token = req.body.token;
  console.log('updateLyftToken', token);

  // refresh call to the helper API on expire time -- this will on success do a post to this API / function again (making it recursive at interval)
  // setTimeout is milliseconds, redis expire is seconds - this is ~1 day.
  setTimeout(refreshToken, 84600000);
  redisSetKeyWithExpire('lyftBearerToken', 84600, token /*, cb*/ );
};

export const getLyftToken = (req, res) => {
  redisGetKey('lyftBearerToken', function (token) {
    console.log('got key', token);
    if (token) {
      res.json(token);
    } else {
      // call the helper API to query Lyft for a token
      refreshToken();
      // wait a reasonable amount of time to query redis again for the token
      return setTimeout(getLyftToken, 500);
    }
  });
};

const refreshToken = () => {
  let helperURL = CARVIS_HELPER_API + '/lyft/refreshBearerToken';
  fetch(helperURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      }
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      console.log('success refreshToken', data);
    })
    .catch(err => {
      console.warn('error refreshing token', err);
    });
};
