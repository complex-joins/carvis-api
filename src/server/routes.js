// import passport from 'passport';
// import passportService from './services/passport';
import RideController from './controllers/RideController';
import UserController from './controllers/UserController';
import { rawUserData } from './models/User';
import hasValidAPIToken from './server-configuration/hasValidAPIToken';

export default function(app) {
  // TODO only let the user with that ID find users (middleware);
  app.get('/', (req, res) => {
    res.status(200).send('Welcome to the Carvis API.');
  });

  UserController(app);
  RideController(app);
  // app.post('/signin', requireSignin, Authentication.signin);
  // app.post('/signup', Authentication.signup);

  app.get('/dev/users/raw', hasValidAPIToken, rawUserData);


}
