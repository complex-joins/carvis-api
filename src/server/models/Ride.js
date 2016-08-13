import {Ride} from '../../db/Ride';
export const addRide = function(req, res) {
  Ride.create(req.body)
  .then((ride) => res.json(ride))
  .catch((err) => res.json(err));
};

export const getRidesForUser = function (req, res) {
  Ride.find({userId: req.params.userid})
  .then((rides) => res.json(rides))
  .catch((err) => res.json(err));
};

export const updateRide = function (req, res) {
  Ride.update({id: req.params.rideid}, req.body)
  .then((ride) => res.json(ride))
  .catch((err) => res.json(err));
};

export const getAllRideData = function(req, res) {
  Ride.findAll()
  .then((rides) => res.json(rides))
  .catch((err) => res.json(err));
};

export const deleteRide = function (req, res) {
  Ride.delete({id: req.params.rideid})
  .then((ride) => res.json(ride))
  .catch((err) => res.json(err));
};
