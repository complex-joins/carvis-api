import { Ride } from '../../db/Ride';
import { User } from '../../db/User';
import fetch from 'node-fetch';

const CARVIS_API_KEY = !process.env.PROD ? require('./../../../secret/config.js')
  .CARVIS_API_KEY : process.env.CARVIS_API_KEY;
const CARVIS_API = !process.env.PROD ? require('./../../../secret/config.js')
  .CARVIS_API : process.env.CARVIS_API;
const CARVIS_HELPER_API_KEY = !process.env.PROD ? require('./../../../secret/config.js')
  .CARVIS_HELPER_API_KEY : process.env.CARVIS_HELPER_API_KEY;

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

      let dbURL = 'http://' + CARVIS_API + '/users/' + userId;
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
        'x-access-token': CARVIS_API_KEY
      }
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      data = data[0];

      if (vendor === 'Uber') {
        let token = data.uberToken;

        let body = {
          origin: origin,
          token: token,
          destination: destination,
          rideId: rideId
        };

        fetch('http://localhost:8888/uber/requestRide', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': CARVIS_HELPER_API_KEY
            },
            body: JSON.stringify(body)
          })
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            console.log('success lyft phone auth', data);
          })
          .catch(function (err) {
            console.warn('err lyft phone auth', err);
          });

      } else if (vendor === 'Lyft') {
        let lyftPaymentInfo = data.lyftPaymentInfo;
        let lyftToken = data.lyftToken;

        let body = {
          lyftPaymentInfo: lyftPaymentInfo,
          lyftToken: lyftToken,
          origin: origin,
          partySize: partySize,
          destination: destination,
          rideId: rideId
        };

        fetch('http://localhost:8888/lyft/getCost', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': CARVIS_HELPER_API_KEY
            },
            body: JSON.stringify(body)
          })
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            console.log('success lyft phone auth', data);
          })
          .catch(function (err) {
            console.warn('err lyft phone auth', err);
          });

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
