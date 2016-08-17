import { Ride } from '../../db/Ride';
import { User } from '../../db/User';
import fetch from 'node-fetch';

var config = require('./../../../secret/config.js');
// var lyfthelper = require('./../utils/lyft-helper.js');
// var uberhelper = require('./../utils/uber-helper.js');

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

      let dbURL = 'http://' + config.CARVIS_API + '/users/' + userId;
      // let dbURL = 'http://localhost:8080/users/' + userId;
      console.log('pre db get', vendor, userId, dbURL, rideId);

      return getUserAndRequestRide(dbURL, origin, destination, partySize, rideId, vendor)
    })
    .catch((err) => res.status(400)
      .json(err)); // add catch for errors.
};

const getUserAndRequestRide = (dbURL, origin, destination, partySize, rideId, vendor) => {

  fetch(dbURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': config.CARVIS_API_KEY
      }
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      data = data[0];

      if (vendor === 'Uber') {
        let token = data.uberToken;

        // TODO: fetch() POST to the helper API server '/uber/requestRide'
        uberhelper.confirmPickup(origin, token, destination, rideId);

      } else if (vendor === 'Lyft') {
        let lyftPaymentInfo = data.lyftPaymentInfo;
        let lyftToken = data.lyftToken;

        // TODO: fetch() POST to the helper API server '/lyft/getCost'
        lyfthelper.getCost(lyftToken, origin, destination, lyftPaymentInfo, partySize, rideId);

      } else {
        console.warn('not a valid vendor - check stacktrace');
      }
    })
    .catch(err => {
      console.warn('error fetching user from db', err);
    });
};

export const getRidesForUser = (req, res) => {
  Ride.find({ userId: req.params.userid })
    .then((rides) => res.json(rides))
    .catch((err) => res.status(400)
      .json(err));
};

export const updateRide = (req, res) => {
  Ride.update({ id: req.params.rideid }, req.body)
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
