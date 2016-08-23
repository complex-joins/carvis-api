import { getRidesForUser, addRide, updateRide, getAllRideData, deleteRide, shareRideETA } from './controllers/Ride';
import {
  getUserDashboardData, updateUserData, createUser,
  getAllUserData, findOrCreateUser, updateOrCreateUser,
  deleteUser, rawUserData
} from './controllers/User';

// import passport from 'passport';
// import passportService from './services/passport';
import Authentication from './controllers/authentication';
import hasValidAPIToken from './server-configuration/hasValidAPIToken';
import alexa from './controllers/alexa';

export default function (app) {
  // TODO only let the user with that ID find users (middleware);
  app.get('/', (req, res) => {
    res.status(200)
      .send('Welcome to the Carvis API.');
  });

  app.get('/users/:userid', hasValidAPIToken, getUserDashboardData);

  app.get('/dev/users', hasValidAPIToken, getAllUserData);

  app.post('/dev/users', hasValidAPIToken, createUser);

  app.post('/auth/users', hasValidAPIToken, findOrCreateUser);

  app.post('/users/updateOrCreate', hasValidAPIToken, updateOrCreateUser);

  app.put('/users/:userid', hasValidAPIToken, updateUserData);

  app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);

  app.put('/rides/:rideid', hasValidAPIToken, updateRide);

  app.post('/rides', hasValidAPIToken, addRide);

  app.delete('/rides/:rideid', hasValidAPIToken, deleteRide);

  app.post('/rides/shareETA/:rideid', hasValidAPIToken, shareRideETA);

  app.post('/rides/cancelRide/:rideid', hasValidAPIToken, shareRideETA);

  app.post('/alexa/launch', alexa.handleLaunch);

  app.post('/alexa/estimate', alexa.getEstimate);

  app.post('/alexa/cancelRide', alexa.cancelRide);


  // app.post('/signin', requireSignin, Authentication.signin);
  // app.post('/signup', Authentication.signup);

  app.get('/dev/users/raw', hasValidAPIToken, rawUserData);


}
