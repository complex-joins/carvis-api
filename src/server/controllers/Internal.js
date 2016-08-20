import { redisGetKey, redisSetKeyWithExpire } from './../../redis/redisHelperFunctions';
const CARVIS_HELPER_API = process.env.CARVIS_HELPER_API;
const CARVIS_HELPER_API_KEY = process.env.CARVIS_HELPER_API_KEY;

// NOTE: the below sets and gets the bearer tokens -- invoked on post and get to the API server route '/internal/lyftBearerToken', called from the helper API where the logic to refresh the token lives.

// on client consumption - instead of looking in process.env - check redis with `getLyftToken`

// Redis functions return value when no callback is provided

export const updateLyftToken = (req, res) => {
  let token = req.body.token;
  redisSetKeyWithExpire('lyftBearerToken', 84600, token /*, cb*/ );

  // refresh call to the helper API on expire time -- this will on success do a post to this API / function again (making it recursive at interval)
  // setTimeout is milliseconds, redis expire is seconds - this is ~1 day.
  setTimeout(refreshToken, 84600000);
};

export const getLyftToken = (req, res) => {
  let token = redisGetKey('lyftBearerToken', /*, cb*/ );
  if (!token) {
    // call the helper API to query Lyft for a token
    refreshToken();
    // wait a reasonable amount of time to query redis again for the token
    setTimeout(getLyftToken, 500);
  } else {
    return token; // change to res.send() ?
  }
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
