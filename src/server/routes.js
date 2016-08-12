import {getUserDashboardData, updateUserData, createUser, getAllUserData} from './models/User';
import {getRidesForUser, addRide, deleteRide} from './models/Ride';

export default function(app) {
  // TODO only let the user with that ID find users (middleware);
  app.get('/users/:userid', getUserDashboardData);

  app.get('/dev/users', getAllUserData);

  app.post('/dev/users', createUser);

  app.post('/users/update/:userid', updateUserData);

  // get all rides for a particular user
  app.get('/rides/:userid', getRidesForUser);

  // post a new ride to the db
  app.post('/rides', addRide);

  app.post('/rides/delete/:rideid', deleteRide);

}
