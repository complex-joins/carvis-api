import { getRidesForUser, addRide, updateRide, getAllRideData, deleteRide, shareRideETA } from './controllers/Ride';
import { getUserDashboardData, updateUserData, createUser, getAllUserData, findOrCreateUser, updateOrCreateUser, deleteUser, rawUserData } from './controllers/User';
import { getLyftToken, updateLyftToken } from './controllers/Internal';
import { createNewDeveloperKey } from './controllers/DeveloperAPI';

// import passport from 'passport';
// import passportService from './services/passport';
// import Authentication from './controllers/authentication';
import hasValidAPIToken from './server-configuration/hasValidAPIToken';
import hasValidDevAPIToken from './server-configuration/hasValidDevAPIToken';
import { handleLaunch, AlexaGetEstimate, cancelRide } from './controllers/alexa';

export default function (app) {
  // TODO only let the user with that ID find users (middleware);
  app.get('/', (req, res) => {
    res.status(200)
      .send('Welcome to the Carvis API.');
  });

  app.get('/dev/users', hasValidAPIToken, getAllUserData);

  app.post('/dev/users', hasValidAPIToken, createUser);

  app.get('/dev/users/raw', hasValidAPIToken, rawUserData);

  app.post('/auth/users', hasValidAPIToken, findOrCreateUser);

  app.get('/users/:userid', hasValidAPIToken, getUserDashboardData);

  app.post('/users/updateOrCreate', hasValidAPIToken, updateOrCreateUser);

  app.put('/users/:userid', hasValidAPIToken, updateUserData);

  app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);

  app.put('/rides/:rideid', hasValidAPIToken, updateRide);

  app.post('/rides', hasValidAPIToken, addRide);

  app.delete('/rides/:rideid', hasValidAPIToken, deleteRide);

  app.post('/rides/shareETA/:userid', hasValidAPIToken, shareRideETA);

  app.post('/rides/cancelRide/:userid', hasValidAPIToken, shareRideETA);
  //
  app.post('/alexa/launch', handleLaunch);

  app.post('/alexa/estimate', AlexaGetEstimate);

  app.post('/alexa/cancelRide', cancelRide);


  // app.post('/signin', requireSignin, Authentication.signin);
  // app.post('/signup', Authentication.signup);
  app.get('/internal/lyftBearerToken', hasValidAPIToken, getLyftToken);

  app.post('/internal/lyftBearerToken', hasValidAPIToken, updateLyftToken);

  // app.post('/signin', requireSignin, Authentication.signin);
  // app.post('/signup', Authentication.signup);

  app.get('/developer/createToken', hasValidAPIToken, createNewDeveloperKey);
  // app.post('developer/lyftPhoneAuth', hasValidDevAPIToken, /*phoneAuth*/ );
  // app.post('developer/lyftPhoneCodeAuth', hasValidDevAPIToken, /*phoneAuth*/ );
  // : add dev routes for popular methods
}
