import { Ride } from '../../db/Ride';

var lyfthelper = require('./../../../../carvis/carvis-web/src/server/utils/lyft-helper.js');
var uberhelper = require('./../../../../carvis/carvis-web/src/server/utils/uber-helper.js');

export const addRide = function (req, res) {
  var rideId;

  Ride.create(req.body)
    .then((ride) => {
      rideId = ride.id; // is there a cleaner way to do this?
      return res.json(ride);
    })
    .catch((err) => res.json(err)); // add catch for errors.

  let vendor = req.body.winner;
  let origin = {
    lat: req.body.originLat,
    lng: req.body.originLng,
    routableAddress: originRoutableAddress
  };
  let destination = {
    lat: req.body.destinationLat,
    lng: req.body.destinationLng,
    routableAddress: req.body.destinationRoutableAddress
  };
  let partySize = req.body.partySize || 1;

  // carvisUserId -- to query the user table for tokens etc.
  let userId = req.body.userId;
  let dbURL = 'http://54.183.205.82/users' + userId;

  return fetch(dbURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log('success fetching user from DB', data);

      if (vendor === 'Uber') {
        let token = data.uberToken;
        return uberhelper.confirmPickup(origin, token, destination);

      } else if (vendor === 'Lyft') {
        let lyftPaymentInfo = data.lyftPaymentInfo;
        let lyftToken = data.lyftToken;
        return lyfthelper.getCost(lyftToken, origin, destination, lyftPaymentInfo, partySize, rideId);

      } else {
        console.warn('not a valid vendor - check stacktrace');
        return; // return a 404.
      }
    })
    .catch(function (err) {
      console.warn('error fetching user from db', err);
    });

};

export const getRidesForUser = function (req, res) {
  Ride.find({ userId: req.params.userid })
    .then((rides) => res.json(rides))
    .catch((err) => res.json(err));
};

export const updateRide = function (req, res) {
  Ride.update({ id: req.params.rideid }, req.body)
    .then((ride) => res.json(ride))
    .catch((err) => res.json(err));
};

export const getAllRideData = function (req, res) {
  Ride.findAll()
    .then((rides) => res.json(rides))
    .catch((err) => res.json(err));
};

export const deleteRide = function (req, res) {
  Ride.delete({ id: req.params.rideid })
    .then((ride) => res.json(ride))
    .catch((err) => res.json(err));
};
