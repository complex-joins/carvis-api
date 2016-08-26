import { User } from '../models/User';
import { redisSetHash, redisHashGetAll, redisHashGetOne, redisSetKey, redisSetKeyWithExpire, redisGetKey, redisDelete } from './../../redis/redisHelperFunctions';
import _ from 'lodash';

export const getUserDashboardData = (req, res) => {
  let userId = req.params.userid;
  redisHashGetAll(userId, user => {
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
  });
};

export const updateUserData = (req, res) => {
  let userId = req.params.userid;
  let redisKeyValArray = [];
  let newKeys = Object.keys(req.body);
  for (let i = 0, len = newKeys.length; i < len; i++) {
    if (req.body[newKeys[i]] !== null) {
      redisKeyValArray.push(newKeys[i]);
      redisKeyValArray.push(req.body[newKeys[i]]);
    }
  }
  console.log('redisKeyValArray', userId, redisKeyValArray);
  // update redis, and after updating redis, update the DB.
  redisSetHash(userId, redisKeyValArray, result => {
    console.log('success setHash', userId, result);
    User.update({ id: userId }, req.body)
      .then(user => user.length === 0 ? res.json({}) : res.json(user))
      .catch(err => res.status(400)
        .json(err));
  });
};

export const createUser = (req, res) => {
  User.create(req.body)
    .then((user) => {
      let userId = user[0].id; // Carvis userId
      let redisKeyValArray = [];
      for (let key in user[0]) {
        if (user[0][key] !== null) {
          redisKeyValArray.push(key);
          redisKeyValArray.push(user[0][key]);
        }
      }
      redisSetHash(userId, redisKeyValArray, result => {
        user.length === 0 ? res.json({}) : res.json(user);
      });
    })
    .catch((err) => res.status(400)
      .json(err));
};

export const getAllUserData = (req, res) => {
  User.findAll()
    .then(users => {
      users.length === 0 ? res.json({}) : res.json(User.decryptCollection(users));
    })
    .catch(err => res.status(400)
      .json(err));
};

export const rawUserData = (req, res) => {
  User.findAll()
    .then(users => res.json(users))
    .catch(err => res.status(400)
      .json(err));
};

// note: if not found in redis, and not in db, it is created in DB, however, on that action we don't also add to Redis (todo?)
export const findOrCreateUser = (req, res) => {
  let userId = req.body.userId || req.body.id; // format?
  redisHashGetAll(userId, user => {
    if (user) {
      res.json(User.decryptModel(user)); // store encrypted in redis.
    } else {
      User.findOrCreate(req.body)
        .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user)))
        .catch((err) => res.status(400)
          .json(err));
    }
  });
};

// check for unique fields to identify existing users in the DB
// then first create or update the DB record, then do the same in Redis
export const updateOrCreateUser = (req, res) => {
  console.log('req.body:', req.body);
  const uniqueFields = ['email', 'uberEmail', 'lyftPhoneNumber', 'alexaUserId', 'id'];
  const findObj = _(req.body)
    .reduce((findObj, val, key) => {
      if (uniqueFields.indexOf(key) >= 0 && req.body[key] !== null) {
        findObj[key] = val;
      }
      return findObj;
    }, {});

  console.log('findObj', findObj);
  let userFields = _.clone(req.body, true);
  
  if (userFields.id) {
    delete userFields['id'];
    console.log('userFields:', userFields);  
  }

  User.updateOrCreate(findObj, userFields)
    .then(user => {
      user = user[0]; // [{}] => {}
      console.log('success DB find user updateOrCreate', user);

      let userKeys = Object.keys(user);
      let redisKeyValArray = [];
      for (let i = 0, len = userKeys.length; i < len; i++) {
        if (user[userKeys[i]] !== null) {
          redisKeyValArray.push(userKeys[i]);
          redisKeyValArray.push(user[userKeys[i]]);
        }
      }
      redisSetHash(user.id, redisKeyValArray, result => {
        return user.length === 0 ? res.json({}) : res.json(User.decryptModel(user));
      });

    })
    .catch(err => res.status(400)
      .json(err));
};

export const deleteUser = (req, res) => {
  let userId = req.params.userid;

  // in this case we want to delete both from redis and the DB.
  redisDelete(userId, user => {
    if (user) {
      console.log('success delete', userId, user);
    } else {
      console.log('user was not in redis', userId, user);
    }
    User.remove({ id: userId })
      .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user[0])))
      .catch((err) => res.status(400)
        .json(err));
  });
};

export const getRawUser = (req, res) => {
  let userId = req.params.userid;
  // get from redis, if not found, try DB
  redisHashGetAll(userId, user => {
    if (user) {
      res.json(user);
    } else {
      User.find({ id: userId })
        .then((user) => user.length === 0 ? res.json({}) : res.json(user))
        .catch((err) => res.status(400)
          .json(err));
    }
  });
};

// what is this? @alex?
function handleUserReturn(modelResults, req, res) {

}
