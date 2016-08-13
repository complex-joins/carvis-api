const axios = require('axios');
const url = 'http://54.183.205.82/rides';

axios.post(url, {
  "userId": 1,
    "rideStatus": "casa de SHEZ",
    "originLat": "32",
    "originLng": '234',
    "originRoutableAddress": "23",
    "destinationLat": '32',
    "destinationLng": '23'});
