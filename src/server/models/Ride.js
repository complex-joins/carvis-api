import {Ride} from '../../db/Ride';
export const addRide = function(req, res) {
  Ride.create(req.body)
  .then((ride) => res.json(ride));
};

export const getRidesForUser = function (req, res) {
  Ride.find({userId: req.params.userid})
  .then((rides) => res.json(rides));
};

export const updateRide = function (req, res) {
  Ride.update(req.body)
  .then((ride) => res.json(ride));
};

export const deleteRide = function (req, res) {
  Ride.delete(req.body)
  .then((ride) => res.json(ride));
};
