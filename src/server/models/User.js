import { User } from '../../db/User';

export const getUserDashboardData = (req, res) => {
  User.find({id: req.params.userid})
  .then((user) => user.length === 0 ? res.json({}) : res.json([User.decryptModel(user[0])]))
  .catch((err) => res.status(400).json(err));
};

export const updateUserData = (req, res) => {
  User.update({id: req.params.userid}, req.body)
  .then((user) => user.length === 0 ? res.json({}) : res.json(user))
  .catch((err) => res.status(400).json(err));
};

export const createUser = (req, res) => {
  User.create(req.body)
  .then((user) => user.length === 0 ? res.json({}) : res.json(user))
  .catch((err) => res.status(400).json(err));
};

export const getAllUserData = (req, res) => {
  User.findAll()
  .then((users) => users.length === 0 ? res.json({}) : res.json(User.decryptCollection(users)))
  .catch((err) => res.status(400).json(err));
};

export const findOrCreateUser = (req, res) => {
  User.findOrCreate(req.body)
  .then((user) => user.length === 0 ? res.json({}) : res.json(user))
  .catch((err) => res.status(400).json(err));
};

export const updateOrCreateUser = (req, res) => {
  let firstParam = Object.keys(req.body)[0];
  User.updateOrCreate({[firstParam]: req.body[firstParam]}, req.body)
  .then((user) => user.length === 0 ? res.json({}) : res.json(user))
  .catch((err) => res.status(400).json(err));
};

export const deleteUser = (req, res) => {
  User.remove({id: req.params.userid})
  .then((user) => user.length === 0 ? res.json({}) : res.json(user))
  .catch((err) => res.status(400).json(err));
};


function handleUserReturn(modelResults, req, res) {

}
