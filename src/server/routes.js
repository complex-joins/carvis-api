import { getRidesForUser, addRide, updateRide, getAllRideData, deleteRide, shareRideETA } from './controllers/Ride';
import { getUserDashboardData, updateUserData, createUser, getAllUserData, findOrCreateUser, updateOrCreateUser, deleteUser, rawUserData } from './controllers/User';
import { getLyftToken, updateLyftToken } from './controllers/Internal';
import { createNewDeveloperKey } from './controllers/DeveloperAPI';

// import passport from 'passport';
// import passportService from './services/passport';
import Authentication from './controllers/authentication';
import hasValidAPIToken from './server-configuration/hasValidAPIToken';
import hasValidDevAPIToken from './server-configuration/hasValidDevAPIToken';
import { handleLaunch, AlexaGetEstimate } from './controllers/alexa';
import { lyftPhoneAuth, lyftPhoneCodeAuth, uberLogin, testKey, getEstimate, placesCall, addRideToDB, requestRide } from './controllers/helper';

export default function (app) {
  // TODO: only let the user with that ID find users (middleware);
  app.get('/', (req, res) => {
    res.status(200)
      .send('Welcome to the Carvis API.');
  });

  // ===== user routes ===== //
  app.get('/dev/users', hasValidAPIToken, getAllUserData);
  app.post('/dev/users', hasValidAPIToken, createUser);
  app.get('/dev/users/raw', hasValidAPIToken, rawUserData);
  app.post('/auth/users', hasValidAPIToken, findOrCreateUser);
  app.get('/users/:userid', hasValidAPIToken, getUserDashboardData);
  app.post('/users/updateOrCreate', hasValidAPIToken, updateOrCreateUser);
  app.put('/users/:userid', hasValidAPIToken, updateUserData);
  app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);

  // ===== rides routes ===== //
  app.put('/rides/:rideid', hasValidAPIToken, updateRide);
  app.post('/rides', hasValidAPIToken, addRide);
  app.delete('/rides/:rideid', hasValidAPIToken, deleteRide);
  app.post('/rides/shareETA/:userid', hasValidAPIToken, shareRideETA);
  app.post('/rides/cancelRide/:userid', hasValidAPIToken, shareRideETA);

  // ===== addRide, getEstimate and placesCall web routes ===== //

  // placesCall - web
  app.post('/web/places', hasValidAPIToken, placesCall);
  // getEstimate - web
  // this also invokes addRideToDB internally
  app.post('/web/estimate', hasValidAPIToken, getEstimate);
  // invoked after a getEstimate - adds a record to the DB
  // this should generally not be invoked directly
  app.post('/web/addRide', hasValidAPIToken, addRideToDB);
  // - on web invoked via a button, not in flow from addRide
  // this function actually requests a ride via the helperAPI
  app.post('/web/requestRide', hasValidAPIToken, requestRide);

  // ===== alexa routes ===== //
  app.post('/alexa/launch', handleLaunch);
  app.post('/alexa/estimate', AlexaGetEstimate);

  // ===== internal routes ===== //
  app.get('/internal/lyftBearerToken', hasValidAPIToken, getLyftToken);
  app.post('/internal/lyftBearerToken', hasValidAPIToken, updateLyftToken);

  // ===== carvis auth routes ===== //
  // app.post('/signin', requireSignin, Authentication.signin);
  // app.post('/signup', Authentication.signup);

  // ===== helper api through-routes ===== //
  app.post('/lyft/phoneauth', hasValidAPIToken, lyftPhoneAuth);
  app.post('/lyft/phoneCodeAuth', hasValidAPIToken, lyftPhoneCodeAuth);
  app.post('/uber/login', hasValidAPIToken, uberLogin);
  // other routes that have to go from web client -> helper api. ?

  // ===== developer api routes ===== //
  // external developer tokens
  app.get('/developer/createToken', hasValidAPIToken, createNewDeveloperKey);
  // route used for testing dev keys - will increment the usage and log count
  app.post('/developer/testMyKey', hasValidDevAPIToken, testKey);
  // routes that enable external devs to incorporate uber/lyft login into their apps (creates relevant records in our database)
  app.post('/developer/lyftPhoneAuth', hasValidDevAPIToken, lyftPhoneAuth);
  app.post('/developer/lyftPhoneCodeAuth', hasValidDevAPIToken, lyftPhoneCodeAuth);
  app.post('/developer/uberLogin', hasValidDevAPIToken, uberLogin);
  // placesCall - web
  app.post('/developer/places', hasValidDevAPIToken, placesCall);
  // getEstimate - web
  // this also invokes addRideToDB internally
  app.post('/developer/estimate', hasValidDevAPIToken, getEstimate);
  // invoked after a getEstimate - adds a record to the DB
  // this should generally not be invoked directly
  app.post('/developer/addRide', hasValidDevAPIToken, addRideToDB);
  // - on web invoked via a button, not in flow from addRide
  // this function actually requests a ride via the helperAPI
  app.post('/developer/requestRide', hasValidDevAPIToken, requestRide);

  // more routes
  // ===== ... the end ... ===== //
}
