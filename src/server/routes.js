import {getUserDashboardData, updateUserData, createUser,
        getAllUserData, findOrCreateUser } from './models/User';
import {getRidesForUser, addRide, updateRide, getAllRideData, deleteRide} from './models/Ride';

export default function(app) {
  // TODO only let the user with that ID find users (middleware);
  app.get('/users/:userid', getUserDashboardData);

  app.get('/dev/users', getAllUserData);

  app.post('/dev/users', createUser);

  app.post('/auth/users', findOrCreateUser);

  app.put('/users/update/:userid', updateUserData);

  app.get('/dev/rides', getAllRideData);

  app.get('/rides/user/:userid', getRidesForUser);

  app.put('/rides/:rideid', updateRide);

  app.post('/rides', addRide);

  app.delete('/rides/:rideid', deleteRide);

}
