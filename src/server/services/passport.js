import passport from 'passport';
import User from '../models/User';
import config from '../config';
import LocalStrategy from 'passport-local';
import JwtStrategy from 'passport-jwt.Strategy';
import ExtractJwt from 'passport-jwt.ExtractJwt';

const localOptions = { usernnameField: 'email' };
const localLogin = new LocalStrategy(localOptions, function(email, password, done) {
  User.findOrCreateUser({ email: email }, function(err, user) {
    if(err) { return done(err) };
    if(!user) { return done(null, false) };

    user.isValidPassword(password, function(err, isMatch) {
      if(err) { return done(err) };
      if(!isMatch) { return done(null, false) };

      return done(null, user);
    });
  });
});

cont jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: config.secret
};

const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
  User.findById(payload.sub, function(err, user) {
    if(err) { return done(err, false); }

    if(user) {
      done(null, user);
    } else {
      done(null, false);
    }
  });
});

passport.use(jwtLogin);
passport.use(localLogin);
