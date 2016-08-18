// import { Ride } from '../../db/Ride';
// import { User } from '../../db/User';
//
// var fetch = require('node-fetch');
// var config = require('/../../secret/config.js');
// // var lyfthelper = require('./../utils/lyft-helper.js');
// // var uberhelper = require('./../utils/uber-helper.js');
//
//
// export const addRide = function (req, res) {
//   Ride.create(req.body)
//     .then((ride) => {
//       ride = ride[0];
//       console.log(ride);
//
//       let vendor = ride.winner;
//       let rideId = ride.id;
//       let origin = {
//         lat: ride.originLat,
//         lng: ride.originLng,
//         routableAddress: ride.originRoutableAddress
//       };
//       let destination = {
//         lat: ride.destinationLat,
//         lng: ride.destinationLng,
//         routableAddress: ride.destinationRoutableAddress
//       };
//       let partySize = ride.partySize || 1;
//
//       // carvisUserId -- to query the user table for tokens etc.
//       let userId = ride.userId;
//
//       // let dbURL = 'http://' + config.CARVIS_API + '/users/' + userId;
//       let dbURL = 'http://localhost:8080/users/' + userId;
//       console.log('pre db get', vendor, userId, dbURL, rideId);
//
//       return getUserAndRequestRide(dbURL, origin, destination, partySize, rideId, vendor)
//     })
//     .catch((err) => res.status(400)
//       .json(err)); // add catch for errors.
// };
//
// const getUserAndRequestRide = function (dbURL, origin, destination, partySize, rideId, vendor) {
//
//   fetch(dbURL, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-access-token': config.CARVIS_API_KEY
//       }
//     })
//     .then(function (res) {
//       return res.json();
//     })
//     .then(function (data) {
//       // console.log('success fetching user from DB', data); // pre-decrypt.
//       data = User.decryptModel(data[0]); // decrypt the tokens to pass to vendor
//
//       if (vendor === 'Uber') {
//         let token = data.uberToken;
//         console.log('uber token post decrypt', token);
//         uberhelper.confirmPickup(origin, token, destination, rideId);
//
//       } else if (vendor === 'Lyft') {
//         let lyftPaymentInfo = data.lyftPaymentInfo;
//         let lyftToken = data.lyftToken;
//         console.log('token post decrypt', lyftToken); // works!
//
//         lyfthelper.getCost(lyftToken, origin, destination, lyftPaymentInfo, partySize, rideId);
//
//       } else {
//         console.warn('not a valid vendor - check stacktrace');
//       }
//     })
//     .catch(function (err) {
//       console.warn('error fetching user from db', err);
//     });
// };
//
// export const getRidesForUser = function (req, res) {
//   Ride.find({ userId: req.params.userid })
//     .then((rides) => res.json(rides))
//     .catch((err) => res.status(400)
//       .json(err));
// };
//
// export const updateRide = function (req, res) {
//   Ride.update({ id: req.params.rideid }, req.body)
//     .then((ride) => res.json(ride))
//     .catch((err) => res.status(400)
//       .json(err));
// };
//
// export const getAllRideData = function (req, res) {
//   Ride.findAll()
//     .then((rides) => res.json(rides))
//     .catch((err) => res.status(400)
//       .json(err));
// };
//
// export const deleteRide = function (req, res) {
//   Ride.delete({ id: req.params.rideid })
//     .then((ride) => res.json(ride))
//     .catch((err) => res.status(400)
//       .json(err));
// };
