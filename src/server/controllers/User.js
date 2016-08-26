import { User } from '../models/User';
import { redisSetHash, redisHashGetAll, redisHashGetOne, redisSetKey, redisSetKeyWithExpire, redisGetKey } from './../../redis/redisHelperFunctions';
import _ from 'lodash';

export const getUserDashboardData = (req, res) => {
  let userId = req.params.userid;
  var user = redisHashGetAll(userId /*, cb*/ );

  if (user) {
    console.log('found user in redis, getUserDashboardData', user);
    res.json(User.decryptModel(user));
  } else {
    console.log('no redis - doing db fetch getUserDashboardData');
    User.find({ id: userId })
      .then((user) => user.length === 0 ? res.json({}) : res.json([User.decryptModel(user[0])]))
      .catch((err) => res.status(400)
        .json(err));
  }
};

export const updateUserData = (req, res) => {
  let userId = req.params.userid;
  let redisKeyValArray = [];
  let newKeys = Object.keys(req.body);
  for (let i = 0, len = newKeys.length; i < len; i++) {
    redisKeyValArray.push(newKeys[i]);
    redisKeyValArray.push(req.body[newKeys[i]]);
  }
  console.log('redisKeyValArray', userId, redisKeyValArray);
  redisSetHash(userId, redisKeyValArray);

  User.update({ id: userId }, req.body)
    .then((user) => {
      // console.log('USER =====', user);
      return user.length === 0 ? res.json({}) : res.json(user)
    })
    .catch((err) => res.status(400)
      .json(err));
};

export const createUser = (req, res) => {
  User.create(req.body)
    .then((user) => {
      let userId = user[0].id; // Carvis userId
      let redisKeyValArray = [];
      for (let key in user[0]) {
        redisKeyValArray.push(key);
        redisKeyValArray.push(user[0][key]);
      }
      redisSetHash(userId, redisKeyValArray);
      user.length === 0 ? res.json({}) : res.json(user);
    })
    .catch((err) => res.status(400)
      .json(err));
};

export const getAllUserData = (req, res) => {
  User.findAll()
    .then((users) => {
      return users.length === 0 ? res.json({}) : res.json(User.decryptCollection(users));
    })
    .catch((err) => res.status(400).json(err));
};

// note: if not found in redis, and not in db, it is created in DB, however, on that action we don't also add to Redis (todo?)
export const findOrCreateUser = (req, res) => {
  let userId = req.body.userId || req.body.id; // format?
  let user = redisHashGetAll(userId /*, cb*/ );
  if (user) {
    res.json(User.decryptModel(user));
  } else {
    User.findOrCreate(req.body)
      .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user)))
      .catch((err) => res.status(400)
        .json(err));
  }
};

// TODO - redis.
export const updateOrCreateUser = (req, res) => {
  const uniqueFields = ['email', 'uberEmail', 'lyftPhoneNumber', 'alexaUserId', 'id'];
  const findObj = _(req.body).reduce((findObj, val, key) => {
    if (uniqueFields.indexOf(key) >= 0 && findObj[key] !== null) {
      findObj[key] = val;
    }
    return findObj;
  }, {});

  User.updateOrCreate(findObj, req.body)
  .then((user) => {
    return user.length === 0 ? res.json({}) : res.json(User.decryptModel(user[0]));
  })
  .catch((err) => res.status(400).json(err));
};

export const deleteUser = (req, res) => {
  User.remove({ id: req.params.userid })
    .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user[0])))
    .catch((err) => res.status(400)
      .json(err));
};

export const rawUserData = (req, res) => {
  User.findAll()
    .then((users) => res.json(users))
    .catch((err) => res.status(400)
      .json(err));
};

export const getRawUser = (req, res) => {
  User.find({ id: req.params.userid })
    .then((user) => user.length === 0 ? res.json({}) : res.json(user))
    .catch((err) => res.status(400)
      .json(err));
};

// what is this? @alex?
function handleUserReturn(modelResults, req, res) {

}
