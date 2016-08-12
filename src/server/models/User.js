import {User} from '../../db/User';

export const getUserDashboardData = function(req, res) {
  User.find({id: req.params.userid})
  .then((user) => res.json(user));
};

export const updateUserData = function (req, res) {
  User.update({id: req.params.userid})
  .then((user) => res.json(user));
};

export const createUser = function (req, res) {
  User.create(req.body)
  .then((user) => res.json(user));
};

export const getAllUserData = function (req, res) {
  User.findAll()
  .then((users) => res.json(users));
};
