import {User} from '../../db/User';

export const getUserDashboardData = (req, res) => {
  User.find({id: req.params.userid})
  .then((user) => res.json(user));
};

export const updateUserData = (req, res) => {
  User.update({id: req.params.userid})
  .then((user) => res.json(user));
};

export const createUser = (req, res) => {
  User.create(req.body)
  .then((user) => res.json(user));
};

export const getAllUserData = (req, res) => {
  User.findAll()
  .then((users) => res.json(users));
};


export const findOrCreateUser = (req, res) => {
  User.findOrCreate(req.body)
  .then((user) => res.json(user));
};
