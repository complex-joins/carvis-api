import hasValidAPIToken from '../server-configuration/hasValidAPIToken';
import {getRidesForUser, addRide, updateRide, getAllRideData, deleteRide} from '../models/Ride';

export default function(app) {

  app.get('/dev/rides', hasValidAPIToken, getAllRideData);

  app.get('/rides/user/:userid', hasValidAPIToken, getRidesForUser);

  app.put('/rides/:rideid', hasValidAPIToken, updateRide);

  app.post('/rides', hasValidAPIToken, addRide);

  app.delete('/rides/:rideid', hasValidAPIToken, deleteRide);

}
