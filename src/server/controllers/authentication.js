import jwt from 'jwt-simple';
import { User } from '../models/User';
// import config from '../jwtconfig';

tokenForUser = user => {
  let timestamp = new Date()
    .getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, config.secret);
};

// User has already had their email and password auth'd
// We just need to give them a token
exports.signin = (req, res, next) => res.send({ token: tokenForUser(req.user) });

exports.signup = function (req, res, next) {
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    return res.status(422)
      .send({ error: 'You must provide email and password' });
  }

  // See if a user with the given email exists
  User.findOne({ email: email }, (err, existingUser) => {
    if (err) {
      return next(err);
    }

    // If a user with email does exist, return an error
    if (existingUser) {
      return res.status(422)
        .send({ error: 'Email is in use' });
    }

    // If a user with email does NOT exist, create and save user record
    let user = new User({
      email: email,
      password: password
    });

    user.save(err => {
      if (err) {
        return next(err);
      }

      // Repond to request indicating the user was created
      res.json({ token: tokenForUser(user) });
    });
  });
};
