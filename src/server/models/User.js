import {User} from '../../db/User';

export const getUserDashboardData = (req, res) => {
  User.find({id: req.params.userid})
  .then((user) => res.json(user))
  .catch((err) => res.json(err));
};

export const updateUserData = (req, res) => {
  User.update({id: req.params.userid}, req.body)
  .then((user) => res.json(user))
  .catch((err) => res.json(err));
};

export const createUser = (req, res) => {
  User.create(req.body)
  .then((user) => res.json(user))
  .catch((err) => res.json(err));
};

export const getAllUserData = (req, res) => {
  User.findAll()
  .then((users) => res.json(users))
  .catch((err) => res.json(err));
};


export const findOrCreateUser = (req, res) => {
  User.findOrCreate(req.body)
  .then((user) => res.json(user))
  .catch((err) => res.json(err));
};
