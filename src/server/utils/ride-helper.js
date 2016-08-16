var _ = require('lodash');
var fetch = require('node-fetch');
fetch.Promise = require('bluebird');
var placesCall = require('./place-helper'); // invoked as placesCall();

if (!process.env.PROD) {
  // TODO: update lyftToken dynamically - see config.js
  var lyftToken = require('../../../../carvis/carvis-web/secret/config')
    .LYFT_BEARER_TOKEN;
  var uberToken = require('../../../../carvis/carvis-web/secret/config')
    .UBER_SERVER_TOKEN;
} else {
  var lyftToken = process.env.LYFT_BEARER_TOKEN;
  var uberToken = process.env.UBER_SERVER_TOKEN;
}

var getEstimate = function (requestType, start, dest, cb) {
  var uberURL = 'https://api.uber.com/v1/';
  var lyftURL = 'https://api.lyft.com/v1/';

  var uberPath, lyftPath;

  if (requestType.includes('cheap')) {
    uberPath = 'estimates/price';
    lyftPath = 'cost';
  } else if (requestType.includes('fast')) {
    uberPath = 'estimates/time';
    lyftPath = 'eta';
  }

  var uberEndpoint = '${uberURL}${uberPath}?start_latitude=${start0}&start_longitude=${start1}&end_latitude=${dest0}&end_longitude=${dest1}';
  var lyftEndpoint = '${lyftURL}${lyftPath}?lat=${start0}&lng=${start1}&start_lat=${start0}&start_lng=${start1}&end_lat=${dest0}&end_lng=${dest1}';

  uberEndpoint = _.template(uberEndpoint)({
    uberURL: uberURL,
    uberPath: uberPath,
    start0: start[0],
    start1: start[1],
    dest0: dest[0],
    dest1: dest[1]
  });

  lyftEndpoint = _.template(lyftEndpoint)({
    lyftURL: lyftURL,
    lyftPath: lyftPath,
    start0: start[0],
    start1: start[1],
    dest0: dest[0],
    dest1: dest[1]
  });

  var lyftAuth = 'Bearer ' + lyftToken;
  var uberAuth = 'Token ' + uberToken;

  var firstResult = null;
  var winner = null;

  fetch(uberEndpoint, {
    method: 'GET',
    headers: {
      Authorization: uberAuth,
      'Content-Type': 'application/json'
    }
  })
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    var uberEstimate;

    if (uberPath === 'estimates/price') {
      if (!data.prices) {
        uberEstimate = -1;
      } else {
        var dollarsString = data.prices[0].estimate.slice(1);
        // TODO: make car type dynamic. right now hardcoded to POOL by using data.prices[0]
        uberEstimate = parseFloat(dollarsString) * 100;
      }
    } else if (uberPath === 'estimates/time') {
      // TODO: always make calls to BOTH time and price and return both to alexa as details
      // esp since uber will still give a time estimate even when there's no valid fare
      // (ex: destination = 'gardendale')
      uberEstimate = data.times[0].estimate;
    }

    if (firstResult) {
      winner = compare(uberEstimate, firstResult);
      console.log('Winner:', winner);
      cb(winner);
    } else {
      firstResult = uberEstimate;
    }
    console.log('Uber Pool estimate:', uberEstimate);
  })
  .catch(function (err) {
    console.log('error in uber fetch', err);
  });

  fetch(lyftEndpoint, {
    method: 'GET',
    headers: {
      Authorization: lyftAuth,
      'Content-Type': 'application/json'
    }
  })
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    var lyftEstimate;

    if (lyftPath === 'cost') {
      if (!data.cost_estimates || !data.cost_estimates[0].estimated_cost_cents_max) {
        lyftEstimate = -1;
      } else {
        lyftEstimate = parseFloat(data.cost_estimates[0].estimated_cost_cents_max);
      }
    } else if (lyftPath === 'eta') {
      // TODO: make calls to BOTH time and price and return both to alexa as details
      // esp since lyft will still give a time estimate even when there's no valid fare
      // (ex: destination = 'gardendale')
      if (!data.eta_estimates || !data.eta_estimates[0].eta_seconds) {
        lyftEstimate = -1;
      } else {
        lyftEstimate = data.eta_estimates[0].eta_seconds;
      }
    }
    if (firstResult) {
      winner = compare(firstResult, lyftEstimate);
      console.log('Winner:', winner);
      cb(winner);
    } else {
      firstResult = lyftEstimate;
    }
    console.log('Lyft Line estimate:', lyftEstimate);
  })
  .catch(function (err) {
    console.log('error in lyft fetch', err);
  });

  var compare = function (uberEstimate, lyftEstimate) {
    var estimateType = requestType.includes('cheap') ? 'fare' : 'eta';
    var uberAsWinner = { vendor: 'Uber', estimate: uberEstimate, estimateType: estimateType };
    var lyftAsWinner = { vendor: 'Lyft', estimate: lyftEstimate, estimateType: estimateType };
    if (uberEstimate < 0 && lyftEstimate > 0) {
      return lyftAsWinner;
    } else if (lyftEstimate < 0 && uberEstimate > 0) {
      return uberAsWinner;
    } else if (uberEstimate < 0 && lyftEstimate < 0) {
      return null;
    }

    return uberEstimate < lyftEstimate ? uberAsWinner : lyftAsWinner;
    // TODO: what if prices/times are equal? check times/prices as well
    // if that is also equal, return one randomly
  };
};

var addRide = function(ride, userId, origin, destination, cb) {
  var endpoint = process.env.PROD ? 'http://54.183.205.82/rides' : 'http://localhost:8080/rides';

  var body = {
    userId: 3, // TODO: make this dynamic and not hardcoded once alexa auth is implemented
    rideStatus: 'estimate',
    originLat: origin.coords[0],
    originLng: origin.coords[1],
    originRoutableAddress: origin.descrip,
    destinationLat: destination.coords[0],
    destinationLng: destination.coords[1],
    destinationRoutableAddress: destination.descrip,
    winningVendorRideType: null, // TODO: populate correctly
    winner: ride.vendor
  };

  if (ride.vendor === 'Uber') {
    if (ride.estimateType === 'fare') {
      body.uberEstimatedFare = ride.estimate;
    } else {
      body.uberEstimatedETA = ride.estimate;
    }
  } else {
    if (ride.estimateType === 'fare') {
      body.lyftEstimatedFare = ride.estimate;
    } else {
      body.lyftEstimatedETA = ride.estimate;
    }
  }

  // make post request to /rides endpoint with ride
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    console.log('data inside POST to /rides:', data);
    cb(data);
  })
  .catch(function (err) {
    console.log('ERROR posting to /rides', err);
  });
};

var formatAnswer = function (winner, mode, originDescrip, destDescrip, staging) {
  mode = mode.includes('cheap') ? 'cheapest' : 'fastest';
  var winnerEstimate, answer;

  if (!winner) {
    answer = 'There are no rides available to ${destDescrip}. Please try again.';
    return _.template(answer)({
      destDescrip: destDescrip
    });
  }

  // convert estimate to $ or minutes
  if (mode === 'fastest') {
    var minutes = Math.floor(winner.estimate / 60);
    winnerEstimate = minutes.toString() + ' minute';
    winnerEstimate += minutes > 1 ? 's' : '';
  } else {
    winner.estimate = (staging) ? winner.estimate * 2 : winner.estimate;
    var dollars = Math.floor(winner.estimate / 100);
    var cents = Math.floor(winner.estimate % 100);
    winnerEstimate = dollars.toString() + ' dollars';
    winnerEstimate += (cents) ? ' and ' + cents.toString() + ' cents' : '';
  }

  if (staging) {
    answer = 'A taxi from ${originDescrip} to ${destDescrip} will cost an average of ${winnerEstimate}';
  } else {
    answer = 'The ${mode} ride to ${destDescrip} is from ${winnerVendor}, with an estimate of ${winnerEstimate}';
  }

  return _.template(answer)({
    mode: mode,
    originDescrip: originDescrip,
    destDescrip: destDescrip,
    winnerVendor: winner.vendor,
    winnerEstimate: winnerEstimate
  });
};

module.exports = {
  placesCall: placesCall,
  getEstimate: getEstimate,
  addRide: addRide,
  formatAnswer: formatAnswer
};