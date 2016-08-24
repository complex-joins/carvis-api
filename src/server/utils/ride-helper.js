const fetch = require('node-fetch');

// exporting only for testing. TODO: change hardcoded to dynamic.
export const getLyftBearerToken = (cb) => {
  let url = 'http://localhost:8080/internal/lyftBearerToken'; // hardcoded.
  return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': process.env.CARVIS_API_KEY
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log('new lyftBearerToken', data);
      if (cb) {
        return cb(data);
      } else {
        return data;
      }
    })
    .catch(err => console.warn('error getting lyftBearerToken', err));
};

export const getEstimate = (requestType, start, dest, cb) => {
  let lyftToken = getLyftBearerToken();
  let uberToken = process.env.UBER_SERVER_TOKEN;
  let uberURL = 'https://api.uber.com/v1/';
  let lyftURL = 'https://api.lyft.com/v1/';

  let uberPath, lyftPath;

  if (requestType.includes('cheap')) {
    uberPath = 'estimates/price';
    lyftPath = 'cost';
  } else if (requestType.includes('fast')) {
    uberPath = 'estimates/time';
    lyftPath = 'eta';
  }

  let uberEndpoint = `${uberURL}${uberPath}?start_latitude=${start[0]}&start_longitude=${start[1]}&end_latitude=${dest[0]}&end_longitude=${dest[1]}`;
  let lyftEndpoint = `${lyftURL}${lyftPath}?lat=${start[0]}&lng=${start[1]}&start_lat=${start[0]}&start_lng=${start[1]}&end_lat=${dest[0]}&end_lng=${dest[1]}`;

  let lyftAuth = 'Bearer ' + lyftToken;
  let uberAuth = 'Token ' + uberToken;

  let firstResult = null;
  let winner = null;

  fetch(uberEndpoint, {
      method: 'GET',
      headers: {
        Authorization: uberAuth,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      let uberEstimate;

      if (uberPath === 'estimates/price') {
        if (!data.prices) {
          uberEstimate = -1;
        } else {
          let dollarsString = data.prices[0].estimate.slice(1);
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
      let lyftEstimate;

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

  const compare = (uberEstimate, lyftEstimate) => {
    let estimateType = requestType.includes('cheap') ? 'fare' : 'eta';
    let uberAsWinner = { vendor: 'Uber', estimate: uberEstimate, estimateType: estimateType };
    let lyftAsWinner = { vendor: 'Lyft', estimate: lyftEstimate, estimateType: estimateType };
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

export const addRide = (ride, userId, origin, destination, cb) => {
  let endpoint = process.env.PROD ? 'http://54.183.205.82/rides' : 'http://localhost:8080/rides';

  let body = {
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
          // TODO: add api key so that POST to /rides succeeds
          // but caution, that will actually try to request a ride - we should spoof that on dev
          // plus we'll need to wait for privateMethods to be available on prod (via an api)
      },
      body: JSON.stringify(body)
    })
    .then(res => {
      return res.json();
    })
    .then(data => {
      console.log('data inside POST to /rides:', data);
      cb(data);
    })
    .catch(err => {
      console.log('ERROR posting to /rides', err);
    });
};

export const formatAnswer = (winner, mode, originDescrip, destDescrip, staging) => {
  mode = mode.includes('cheap') ? 'cheapest' : 'fastest';
  let winnerEstimate, answer;

  // convert estimate to $ or minutes
  if (mode === 'fastest') {
    let minutes = Math.floor(winner.estimate / 60);
    winnerEstimate = minutes.toString() + ' minute';
    winnerEstimate += minutes > 1 ? 's' : '';
  } else {
    winner.estimate = (staging) ? winner.estimate * 2 : winner.estimate;
    let dollars = Math.floor(winner.estimate / 100);
    let cents = Math.floor(winner.estimate % 100);
    winnerEstimate = dollars.toString() + ' dollars';
    winnerEstimate += (cents) ? ' and ' + cents.toString() + ' cents' : '';
  }

  if (staging) {
    answer = `A taxi from ${originDescrip} to ${destDescrip} will cost an average of ${winnerEstimate}`;
  } else {
    answer = `The ${mode} ride to ${destDescrip} is from ${winner.vendor}, with an estimate of ${winnerEstimate}`;
  }
  return answer;
};
