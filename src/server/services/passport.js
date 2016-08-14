import passport from 'passport';
import User from '../models/User';
import LocalStrategy from 'passport-local';

const localOptions = { usernnameField: 'email' };
const localLogin = new LocalStrategy(localOptions, function (email, password, done) {
  User.findOrCreateUser({ email: email }, function (err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false);
    }

    user.isValidPassword(password, function (err, isMatch) {
      if (err) {
        return done(err);
      }
      if (!isMatch) {
        return done(null, false);
      }

      return done(null, user);
    });
  });
});

passport.use(localLogin);
