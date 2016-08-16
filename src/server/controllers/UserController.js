import {getUserDashboardData, updateUserData, createUser,
        getAllUserData, findOrCreateUser, updateOrCreateUser, deleteUser } from '../models/User';
import hasValidAPIToken from '../server-configuration/hasValidAPIToken';

export default function(app) {
  app.get('/users/:userid', hasValidAPIToken, getUserDashboardData);

  app.get('/dev/users', hasValidAPIToken, getAllUserData);

  app.post('/dev/users', hasValidAPIToken, createUser);

  app.post('/auth/users', hasValidAPIToken, findOrCreateUser);

  app.post('/users/updateOrCreate', hasValidAPIToken, updateOrCreateUser);

  app.put('/users/:userid', hasValidAPIToken, updateUserData);

  app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);
}
