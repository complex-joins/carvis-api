const CARVIS_HELPER_API = process.env.CARVIS_HELPER_API;
const CARVIS_HELPER_API_KEY = process.env.CARVIS_HELPER_API_KEY;
const CARVIS_API = process.env.CARVIS_API;
const CARVIS_API_KEY = process.env.CARVIS_API_KEY;

import fetch from 'node-fetch';
import { Ride } from './../models/Ride';
import { User } from './../models/User';
import { createMessage } from './../utils/twilioHelper';
import { helperAPIQuery, getUserAndRequestRideDB } from './Ride';
import { redisHashGetAll, redisSetKeyWithExpire, redisGetKey, redisHashGetOne } from './../../redis/redisHelperFunctions';
import { getLyftBearerToken } from './../utils/ride-helper';

//===== these are controllers for the web and public api's =====//

export const lyftPhoneAuth = (req, res) => {
  let phoneNumber = req.body.phoneNumber;
  console.log('phone number is ', phoneNumber);

  let url = CARVIS_HELPER_API + '/lyft/phoneauth';

  fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(req.body) // pass through the body.
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log('success lyft phone auth', data);
      res.json({ message: 'on its way' });
    })
    .catch(function (err) {
      console.warn('err lyft phone auth', err);
    });
};

export const lyftPhoneCodeAuth = (req, res) => {
  let lyftCode = req.body.lyftCode;
  // let phoneNumber = req.body.phoneNumber;
  console.log('got code', lyftCode);

  let url = CARVIS_HELPER_API + '/lyft/phoneCodeAuth';

  fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(req.body) // pass through body.
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log('success lyft phone code auth', data);
      res.json({ message: 'yes!' });
    })
    .catch(function (err) {
      console.warn('err lyft phone code auth', err);
    });
};

export const uberLogin = (req, res) => {
  let url = CARVIS_HELPER_API + '/uber/login';

  fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(req.body) // pass through body.
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log('success uber login', data);
      res.json({ message: 'on its way' });
    })
    .catch(function (err) {
      console.warn('err uber login', err);
    });
};

export const testKey = (req, res) => {
  let count = req.body.count;
  console.log('another one', count);
  res.json({ message: 'another one' + count });
};

// `place` is a string, such as 'hack reactor'
// the callback should invoke getEstimate which will flow into addRide
// `nearbyLoc` is [lat, lng]
export const placesCall = (req, res) => {
  let key = process.env.GOOGLE_PLACES_API_KEY;
  let place = req.body.place;
  let origin = req.body.origin; // {descrip: string, coords: [lat, lng]}
  let nearbyLoc = origin.coords;
  let loc, radius;
  if (nearbyLoc) { // nearby location was passed in as reference to search near
    loc = '' + nearbyLoc[0] + ',' + nearbyLoc[1];
    radius = '150000';
  } else { // default to searching the entire world
    loc = '0,0';
    radius = '20000000';
  }

  let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${place}&location=${loc}&radius=${radius}&key=${key}`;

  fetch(url)
    .then(res => {
      return res.json();
    })
    .then(data => {
      // if no predictions found, break out
      if (!data.predictions.length) {
        res.json({ message: 'no prediction found on google places' });
      }

      let placeDesc = data.predictions[0].description;
      console.log('Place found:', placeDesc);
      // TODO: filter out place results with distance from home > 100 miles
      let placeId = data.predictions[0].place_id;
      let detailURL = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${key}`;

      fetch(detailURL)
        .then(res => {
          return res.json();
        })
        .then(data => {
          let placeLat = data.result.geometry.location.lat;
          let placeLng = data.result.geometry.location.lng;
          let routableAddress = data.result.formatted_address;

          // note: different response needs to be handled on client.
          // on client you'd display the option - provide user a confirm modal so they can confirm we suggested the right destination
          // after which getEstimate can be invoked from client.
          let body = {
            place: {
              lat: placeLat,
              lng: placeLng,
              routableAddress: routableAddress,
              descrip: placeDesc,
              id: placeId // google maps id of place
            }
          };
          res.json({ body: body });
        })
        .catch(err => {
          console.log('error on place detail', err, '\nplace:', place);
        });
    })
    .catch(err => {
      console.log('err in places:', err, '\nplace:', place, '\nurl', url);
    });
};

// this works the same as the getEstimate in ride-helper
// with the difference that it looks for req.body for arguments
export const getEstimate = (req, res) => {
  // body
  let requestType = req.body.requestType;
  let origin = req.body.origin; // {descrip: string, coords: [lat, lng]}
  let destination = req.body.destination; // same format as origin
  let start = origin.coords;
  let dest = destination.coords;
  let userId = req.body.userId; // user we're doing the query for

  // tokens, URLs
  let lyftToken = getLyftBearerToken();
  let uberToken = process.env.UBER_SERVER_TOKEN;
  let uberURL = 'https://api.uber.com/v1/';
  let lyftURL = 'https://api.lyft.com/v1/';
  let uberPath, lyftPath;

  // comparison function lyft vs uber estimates
  const compare = (uberEstimate, lyftEstimate) => {
    let estimateType = requestType.includes('cheap') ? 'fare' : 'eta';
    let uberAsWinner = { vendor: 'Uber', estimate: uberEstimate, estimateType: estimateType };
    let lyftAsWinner = { vendor: 'Lyft', estimate: lyftEstimate, estimateType: estimateType };
    if (uberEstimate < 0 && lyftEstimate > 0) {
      return lyftAsWinner;
    } else if (lyftEstimate < 0 && uberEstimate > 0) {
      return uberAsWinner;
    } else if (uberEstimate < 0 && lyftEstimate < 0) {
      return null;
    }
    // TODO: what if prices/times are equal? check times/prices as well
    // if that is also equal, return one randomly
    return uberEstimate < lyftEstimate ? uberAsWinner : lyftAsWinner;
  };
  // this function formats a text-based description of the winner / ride.
  // const formatAnswer = (winner, mode, originDescrip, destDescrip) => {
  //   mode = mode.includes('cheap') ? 'cheapest' : 'fastest';
  //   let winnerEstimate, answer;
  //
  //   // convert estimate to $ or minutes
  //   if (mode === 'fastest') {
  //     let minutes = Math.floor(winner.estimate / 60);
  //     winnerEstimate = minutes.toString() + ' minute';
  //     winnerEstimate += minutes > 1 ? 's' : '';
  //   } else {
  //     winner.estimate = (staging) ? winner.estimate * 2 : winner.estimate;
  //     let dollars = Math.floor(winner.estimate / 100);
  //     let cents = Math.floor(winner.estimate % 100);
  //     winnerEstimate = dollars.toString() + ' dollars';
  //     winnerEstimate += (cents) ? ' and ' + cents.toString() + ' cents' : '';
  //   }
  //   answer = `The ${mode} ride to ${destDescrip} is from ${winner.vendor}, with an estimate of ${winnerEstimate}`;
  //   return answer;
  // };

  // we can estimate price and/or time for rides
  if (requestType.includes('cheap')) {
    uberPath = 'estimates/price';
    lyftPath = 'cost';
  } else if (requestType.includes('fast')) {
    uberPath = 'estimates/time';
    lyftPath = 'eta';
  }

  let uberEndpoint = `${uberURL}${uberPath}?start_latitude=${start[0]}&start_longitude=${start[1]}&end_latitude=${dest[0]}&end_longitude=${dest[1]}`;
  let lyftEndpoint = `${lyftURL}${lyftPath}?lat=${start[0]}&lng=${start[1]}&start_lat=${start[0]}&start_lng=${start[1]}&end_lat=${dest[0]}&end_lng=${dest[1]}`;

  let lyftAuth = 'Bearer ' + lyftToken;
  let uberAuth = 'Token ' + uberToken;
  let firstResult = null;
  let winner = null;

  // do calls to both APIs for the relevant estimates
  fetch(uberEndpoint, {
      method: 'GET',
      headers: {
        Authorization: uberAuth,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      let uberEstimate;
      if (uberPath === 'estimates/price') {
        if (!data.prices) {
          uberEstimate = -1;
        } else {
          let dollarsString = data.prices[0].estimate.slice(1);
          // TODO: make car type dynamic. right now hardcoded to POOL/LINE
          uberEstimate = parseFloat(dollarsString) * 100;
        }
      } else if (uberPath === 'estimates/time') {
        // TODO: always make calls to BOTH time and price and return both
        // uber will still give a time estimate even when there's no valid fare
        uberEstimate = data.times[0].estimate;
      }
      // check to see if uber or lyft returned an estimate firstResult
      // and invoke the comparison function when we have both
      if (firstResult) {
        winner = compare(uberEstimate, firstResult);
        console.log('Winner:', winner);
        // let answer = formatAnswer(winner);
        let body = {
          // answer: answer,
          winner: winner,
          userId: userId,
          origin: origin,
          destination: destination
        };
        return addRideToDB({ body: body }, res); // hack. TODO: test.
      } else {
        firstResult = uberEstimate;
      }
      console.log('Uber Pool estimate:', uberEstimate);
    })
    .catch(function (err) {
      console.log('error in uber fetch', err);
    });

  fetch(lyftEndpoint, {
      method: 'GET',
      headers: {
        Authorization: lyftAuth,
        'Content-Type': 'application/json'
      }
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      let lyftEstimate;
      if (lyftPath === 'cost') {
        if (!data.cost_estimates || !data.cost_estimates[0].estimated_cost_cents_max) {
          lyftEstimate = -1;
        } else {
          lyftEstimate = parseFloat(data.cost_estimates[0].estimated_cost_cents_max);
        }
      } else if (lyftPath === 'eta') {
        // lyft will still give a time estimate even when there's no valid fare
        if (!data.eta_estimates || !data.eta_estimates[0].eta_seconds) {
          lyftEstimate = -1;
        } else {
          lyftEstimate = data.eta_estimates[0].eta_seconds;
        }
      }
      if (firstResult) {
        winner = compare(firstResult, lyftEstimate);
        console.log('Winner:', winner);
        // let answer = formatAnswer(winner);

        let body = {
          // answer: answer,
          winner: winner,
          userId: userId,
          origin: origin,
          destination: destination
        };
        return addRideToDB({ body: body }, res); // hack. TODO: test.
      } else {
        firstResult = lyftEstimate;
      }
      console.log('Lyft Line estimate:', lyftEstimate);
    })
    .catch(function (err) {
      console.log('error in lyft fetch', err);
    });
};

// this calls the Ride controller addRide method, which adds a ride to the DB
// and invokes further Lyft/Uber methods
export const addRideToDB = (req, res) => {
  console.log('addRideToDB', req.body);
  let winner = req.body.winner;
  let userId = req.body.userId;
  let origin = req.body.origin;
  let destination = req.body.destination;
  // let answer = req.body.answer;
  // NOTE: what to do with answer ? // any way to return this to the client? (or should these calculations / formatting happen on client ? )
  // currently answer is not used.

  let body = {
    userId: userId,
    rideStatus: 'estimate',
    originLat: origin.coords[0],
    originLng: origin.coords[1],
    originRoutableAddress: origin.descrip,
    destinationLat: destination.coords[0],
    destinationLng: destination.coords[1],
    destinationRoutableAddress: destination.descrip,
    winningVendorRideType: null, // TODO: populate correctly - dynamic car type
    winner: winner.vendor
  };

  if (winner.vendor === 'Uber') {
    if (winner.estimateType === 'fare') {
      body.uberEstimatedFare = winner.estimate;
    } else {
      body.uberEstimatedETA = winner.estimate;
    }
  } else {
    if (winner.estimateType === 'fare') {
      body.lyftEstimatedFare = winner.estimate;
    } else {
      body.lyftEstimatedETA = winner.estimate;
    }
  }

  // here we've prepared the body for DB post
  // - instead of posting to /rides and doing the DB post in models/rideId
  // we do the DB post directly! less latency :)
  Ride.create(body)
    .then((ride) => { // returns [{}]
      ride = ride[0];
      console.log(ride);
      res.json(ride);
      // we return the ride - this should be returned to the web client so the client has access to the carvis rideId for future queries/updates etc.
    })
    .catch((err) => res.status(400)
      .json(err)); // add catch for errors.
};

// untested.
// body should include `ride` which is the object used previously for DB add.
export const requestRide = (req, res) => {
  let ride = req.body.ride;
  let vendor = ride.winner;
  let rideId = ride.id;
  let origin = {
    lat: ride.originLat,
    lng: ride.originLng,
    routableAddress: ride.originRoutableAddress
  };
  let destination = {
    lat: ride.destinationLat,
    lng: ride.destinationLng,
    routableAddress: ride.destinationRoutableAddress
  };
  let partySize = ride.partySize || 1;

  // carvisUserId -- to query the user table for tokens etc.
  let userId = ride.userId;
  redisHashGetAll(userId, user => {
    console.log('user on redis getall addRide', user);
    if (user) {
      if (vendor === 'Uber') {
        let body = {
          origin: origin,
          token: user.uberToken,
          destination: destination,
          rideId: rideId
        };
        return helperAPIQuery(body, vendor);

      } else if (vendor === 'Lyft') {
        let body = {
          lyftPaymentInfo: user.lyftPaymentInfo,
          lyftToken: user.lyftToken,
          origin: origin,
          partySize: partySize,
          destination: destination,
          rideId: rideId
        };
        return helperAPIQuery(body, vendor);
      }
    } else { // only invoked if we don't have the user in Redis
      let dbURL = 'http://' + CARVIS_API + '/users/' + userId;
      console.log('pre db get', vendor, userId, dbURL, rideId);

      return getUserAndRequestRideDB(dbURL, origin, destination, partySize, rideId, vendor);
    }
  });
};
