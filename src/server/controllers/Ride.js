import { Ride } from '../models/Ride';
import { User } from '../models/User';
import { createMessage } from './../utils/twilioHelper';
import fetch from 'node-fetch';
import { redisHashGetAll, redisSetKeyWithExpire, redisGetKey, redisHashGetOne } from './../../redis/redisHelperFunctions';

const CARVIS_API = process.env.CARVIS_API;
const CARVIS_API_KEY = process.env.CARVIS_API_KEY;
const CARVIS_HELPER_API = process.env.CARVIS_HELPER_API;
const CARVIS_HELPER_API_KEY = process.env.CARVIS_HELPER_API_KEY;

export const addRide = function (req, res) {
  Ride.create(req.body)
    .then((ride) => {
      ride = ride[0];
      console.log(ride);

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
      let user = redisHashGetAll(userId /*, cb*/ ); // redis query for user.
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
      } else { // only invoked if we don't have the user in Redis at the moment
        let dbURL = 'http://' + CARVIS_API + '/users/' + userId;
        console.log('pre db get', vendor, userId, dbURL, rideId);

        return getUserAndRequestRideDB(dbURL, origin, destination, partySize, rideId, vendor);
      }
    })
    .catch((err) => res.status(400)
      .json(err)); // add catch for errors.
};

const getUserAndRequestRideDB = (dbURL, origin, destination, partySize, rideId, vendor) => {

  return fetch(dbURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_API_KEY
      }
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      data = data[0];

      if (vendor === 'Uber') {
        let body = {
          origin: origin,
          token: data.uberToken,
          destination: destination,
          rideId: rideId
        };
        return helperAPIQuery(body, vendor);

      } else if (vendor === 'Lyft') {
        let body = {
          lyftPaymentInfo: data.lyftPaymentInfo,
          lyftToken: data.lyftToken,
          origin: origin,
          partySize: partySize,
          destination: destination,
          rideId: rideId
        };
        return helperAPIQuery(body, vendor);

      } else {
        console.warn('not a valid vendor - check stacktrace');
      }
    })
    .catch(err => {
      console.warn('error fetching user from db', err);
    });
};

// TODO: add redis check for cost signature Uber
const helperAPIQuery = (body, vendor) => {
  if (vendor === 'Lyft') {
    let helperURL = CARVIS_HELPER_API + '/lyft/getCost';
  } else {
    let helperURL = CARVIS_HELPER_API + '/uber/requestRide';
  }

  return fetch(helperURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(body)
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      console.log('success request ride', data);
    })
    .catch(err => {
      console.warn('err request ride', err);
    });
};

export const shareRideETA = (req, res) => {
  // note: how does rideId, origin, token, vendor get passed to this method?
  let userId = req.params.userid;
  let vendorKey = `${userId}:vendor`;
  let rideKey = `${userId}:ride`;

  let vendorRideId = req.body.vendorRideId || redisGetKey(rideKey);
  let vendor = req.body.vendor || redisGetKey(vendorKey);
  let token = req.body.token || vendor === 'Uber' ? redisHashGetOne(userId, 'uberToken') : redisHashGetOne(userId, 'lyftToken');

  let number = req.body.number; // number to send to
  let message = req.body.message || "You can track my Lyft via this link: ";

  let helperURL = vendor === 'Lyft' ? CARVIS_HELPER_API + '/lyft/shareETA' : CARVIS_HELPER_API + '/uber/shareETA';

  let body = {
    rideId: vendorRideId,
    token: token
  };

  fetch(helperURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(body)
    })
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log('success lyft shareETA', data);

      let URLmessage = message + data.shareUrl;
      createMessage(number, URLmessage);
      res.json();
    })
    .catch(err => {
      console.warn('err lyft shareETA', err);
    });
};

// TODO: improve and add Uber.
export const cancelRide = (req, res) => {
  let userId = req.params.userId;
  let rideKey = `${userId}:ride`;
  let vendorKey = `${userId}:vendor`;
  let carvisRideKey = `${userId}:carvisRide`;
  let vendorRideId = req.body.vendorRideId || redisGetKey(rideKey);
  let carvisRideId = req.body.rideId || redisGetKey(carvisRideKey);
  let vendor = req.body.vendor || redisGetKey(vendorKey);
  let origin = req.body.origin; // how is this passed -- redis also?

  // todo: check required params uberCancel
  let token = req.body.token || vendor === 'Uber' ? redisHashGetOne(userId, 'uberToken') : redisHashGetOne(userId, 'lyftToken');

  let helperURL = vendor === 'Lyft' ? CARVIS_HELPER_API + '/lyft/cancelRide' : CARVIS_HELPER_API + '/uber/cancelRide';

  let body = {
    userLocation: origin,
    token: token,
    carvisRideId: carvisRideId,
    vendorRideId: vendorRideId
  };

  fetch(helperURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(body)
    })
    .then(response => {
      return response.json();
    })
    .then(data => {
      console.log('success lyft cancelRide', data);
      // update DB is handled by the helper API.
      // no response needed here.
    })
    .catch(err => {
      console.warn('err lyft cancelRide', err);
    });
};

export const getRidesForUser = (req, res) => {
  Ride.find({ userId: req.params.userid })
    .then((rides) => res.json(rides))
    .catch((err) => res.status(400)
      .json(err));
};

export const updateRide = (req, res) => {
  let carvisRideId = req.params.rideid;
  let lyftRideId = req.body.lyftRideId || null;
  let vendor = lyftRideId ? 'Lyft' : 'Uber';

  let carvisRideKey = `${userId}:carvisRide`;
  let rideKey = `${userId}:ride`;
  let vendorKey = `${userId}:vendor`;

  // in later functions one needs to do calls to Redis to get
  // the token, vendorRideId, rideId and vendor -> to cancel and shareRideETA
  redisSetKeyWithExpire(carvisRideKey, 300, carvisRideId);
  redisSetKeyWithExpire(rideKey, 300, lyftRideId);
  redisSetKeyWithExpire(vendorKey, 300, vendor);

  Ride.update({ id: carvisRideId }, req.body)
    .then((ride) => res.json(ride))
    .catch((err) => res.status(400)
      .json(err));
};

export const getAllRideData = (req, res) => {
  Ride.findAll()
    .then((rides) => res.json(rides))
    .catch((err) => res.status(400)
      .json(err));
};

export const deleteRide = (req, res) => {
  Ride.delete({ id: req.params.rideid })
    .then((ride) => res.json(ride))
    .catch((err) => res.status(400)
      .json(err));
};
