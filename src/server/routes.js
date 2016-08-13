import {getUserDashboardData, updateUserData, createUser,
        getAllUserData, findOrCreateUser, updateOrCreateUser } from './models/User';
import {getRidesForUser, addRide, updateRide, getAllRideData, deleteRide} from './models/Ride';
import passport from 'passport';
import passportService from './services/passport';
import Authentication from './controllers/authentication';

export default function(app) {
  // TODO only let the user with that ID find users (middleware);
  app.get('/users/:userid', getUserDashboardData);

  app.get('/dev/users', getAllUserData);

  app.post('/dev/users', createUser);

  app.post('/auth/users', findOrCreateUser);

  app.post('/users/updateOrCreate', updateOrCreateUser);

  app.put('/users/update/:userid', updateUserData);

  app.get('/dev/rides', getAllRideData);

  app.get('/rides/user/:userid', getRidesForUser);

  app.put('/rides/:rideid', updateRide);

  app.post('/rides', addRide);

  app.delete('/rides/:rideid', deleteRide);

  // app.post('/signin', requireSignin, Authentication.signin);
  // app.post('/signup', Authentication.signup);

}
