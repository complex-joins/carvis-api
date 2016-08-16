import {getRidesForUser, addRide, updateRide, getAllRideData, deleteRide} from '../models/Ride';
import {getUserDashboardData, updateUserData, createUser,
        getAllUserData, findOrCreateUser, updateOrCreateUser, deleteUser } from '../models/User';
// import passport from 'passport';
// import passportService from './services/passport';
import { rawUserData } from './models/User';
import Authentication from './controllers/authentication';
import hasValidAPIToken from './server-configuration/hasValidAPIToken';
import alexa from './controllers/alexa';

export default function(app) {
  // TODO only let the user with that ID find users (middleware);
  app.get('/', (req, res) => {
    res.status(200).send('Welcome to the Carvis API.');
  });

  app.get('/users/:userid', getUserDashboardData);

  app.get('/dev/users', hasValidAPIToken, getAllUserData);

  app.post('/dev/users', hasValidAPIToken, createUser);

  app.post('/auth/users', findOrCreateUser);

  app.post('/users/updateOrCreate', updateOrCreateUser);

  app.put('/users/update/:userid', updateUserData);

  app.delete('/dev/users/:userid', deleteUser);

  app.get('/dev/rides', getAllRideData);

  app.get('/rides/user/:userid', getRidesForUser);

  app.put('/rides/:rideid', updateRide);

  app.post('/rides', addRide);

  app.delete('/rides/:rideid', deleteRide);

  app.post('/alexa', alexa.handleIntent);

  // app.post('/signin', requireSignin, Authentication.signin);
  // app.post('/signup', Authentication.signup);

  app.get('/dev/users/raw', hasValidAPIToken, rawUserData);


}
