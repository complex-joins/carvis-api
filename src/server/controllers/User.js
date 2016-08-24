import { User } from '../models/User';

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
  .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user)))
  .catch((err) => res.status(400).json(err));
};

export const updateOrCreateUser = (req, res) => {
  const uniqueFields = ['email', 'uberEmail', 'lyftPhoneNumber', 'alexaUserId', 'id'];
  const findObj = _(uniqueFields).reduce((findObj, val, key) => {
    if (uniqueFields.indexOf(key) >= 0 && findObj[key] !== null) {
      findObj[key] = val;
    }
    return findObj;
  }, {});
  
  User.updateOrCreate(findObj)
  .then((user) => {
    return user.length === 0 ? res.json({}) : res.json(User.decryptModel(user[0]));
  })
  .catch((err) => res.status(400).json(err));
};

export const deleteUser = (req, res) => {
  User.remove({id: req.params.userid})
  .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user[0])))
  .catch((err) => res.status(400).json(err));
};

export const rawUserData = (req, res) => {
  User.findAll()
  .then((users) => res.json(users))
  .catch((err) => res.status(400).json(err));
};

export const getRawUser = (req, res) => {
  User.find({id: req.params.userid})
  .then((user) => user.length === 0 ? res.json({}) : res.json(user))
  .catch((err) => res.status(400).json(err));
};

function handleUserReturn(modelResults, req, res) {

}
