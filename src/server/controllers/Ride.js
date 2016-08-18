import { Ride } from '../../db/Ride';
import { User } from '../../db/User';
import { createMessage } from './../utils/twilioHelper';
import fetch from 'node-fetch';

const CARVIS_API = process.env.CARVIS_API || 'localhost:8080';
const CARVIS_API_KEY = process.env.CARVIS_API_KEY || require('./../../../secret/config.js')
  .CARVIS_API_KEY;
const CARVIS_HELPER_API = process.env.CARVIS_HELPER_API || require('./../../../secret/config.js')
  .CARVIS_HELPER_API;
const CARVIS_HELPER_API_KEY = process.env.CARVIS_HELPER_API_KEY || require('./../../../secret/config.js')
  .CARVIS_HELPER_API_KEY;

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

        let helperURL = CARVIS_HELPER_API + '/uber/requestRide';

        fetch(helperURL, {
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
            console.log('success lyft phone auth', data);
          })
          .catch(err => {
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

        let helperURL = CARVIS_HELPER_API + '/lyft/getCost';

        fetch(helperURL, {
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
            console.log('success lyft phone auth', data);
          })
          .catch(err => {
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

export const shareRideETA = (req, res) => {
  // note: how does rideId, origin, token, vendor get passed to this method?
  let rideId = req.params.rideid;
  let number = req.body.number;
  let message = req.body.message || "You can track my Lyft via this link: ";
  let token = req.body.token;
  let vendor = req.body.vendor || 'Lyft';
  let helperURL = vendor === 'Lyft' ? CARVIS_HELPER_API + '/lyft/shareETA' : CARVIS_HELPER_API + '/uber/shareETA';
  let body = {
    rideId: rideId,
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

export const cancelRide = (req, res) => {
  // note: how does rideId, origin, token, vendor get passed to this method?
  let rideId = req.params.rideid;
  let origin = req.body.origin;
  let token = req.body.token;
  let vendor = req.body.vendor || 'Lyft';
  let helperURL = vendor === 'Lyft' ? CARVIS_HELPER_API + '/lyft/cancelRide' : CARVIS_HELPER_API + '/uber/cancelRide';
  let body = {
    origin: origin,
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
