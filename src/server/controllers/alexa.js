var _ = require('lodash');
import { Ride } from '../models/Ride';
import { User } from '../models/User';
var rideHelper = require('../utils/ride-helper');

var fakeoutMode = JSON.parse(process.env.FAKEOUT) || false; // when true, CARVIS will tell you about taxi fares, not uber and lyft estimates
var config = {};

if (fakeoutMode) {
  config.prompt = 'With CARVIS you can find the average taxi fare from an airport to your hotel, and vice versa. For example, you can ask, CARVIS, how much is a taxi from Marriot San Francisco to SFO airport?';
  config.reprompt = 'Tell me where you want to be picked up, and where you want to go';
  config.helpSpeech = config.prompt;
} else {
  config.prompt = 'With CARVIS you can order the cheapest or fastest car available. For example, you can say, CARVIS, find me the cheapest ride to Hack Reactor';
  config.reprompt = 'Tell me to book the cheapest or fastest car, and where you want to go';
  config.helpSpeech = 'CARVIS finds you the cheapest and/or fastest ride to your destination. ';
  config.helpSpeech += 'To begin, tell me to book the cheapest or fastest car, and where you want to go';
}

exports.handleLaunch = function(req, res) {
  //call to the DB with alexaID
  User.find({alexaID: req.params.alexaID})
  .then((user) => user.length === 0 ? res.json({}) : User.decryptModel(user[0]))
  .catch((err) => res.status(400).json(err))
  .then((data) => {
    config.userID = data.userID
    return config;
  })
  .then((data) => {res.json(data);})

  // return res.status(422).send({ error: 'You must provide email and password'});
};

exports.getEstimate = function(req, res) {
  var slots = req.body.data.request.intent.slots;
  console.log('slots:', slots);

  var userId = req.body.userId; // the unique alexa session userId. that said, its the *carvis userId* i should be storing in the session and passing to carvis api endpoints
  var mode = (fakeoutMode) ? 'cheapest' : slots.MODE.value; // cheapest or fastest

  // find the ORIGIN slot that is populated in this request, if any
  var originArray = _.filter(slots, function (slotValue, slotKey) {
    return (slotValue.value && slotValue.value.length > 0 && slotKey.includes('ORIGIN'));
  });
  var origin = (originArray.length) ? { query: originArray[0].value } : null;
  console.log('Alexa thinks my origin is', origin);

  // find the DESTINATION slot that is populated in this request
  var destinationSlots = _.filter(slots, function (slotValue, slotKey) {
    return (slotValue.value && slotValue.value.length > 0 && slotKey.includes('DESTINATION'));
  });
  var destination = (destinationSlots.length)
    ? { query: destinationSlots[0].value }
    : null;
  console.log('Alexa thinks my destination is', destination);

  var prompt, reprompt;

  if ( !mode || !destination || (fakeoutMode && !origin) ) {
    prompt = 'I didn\'t catch that. Please try again';
    reprompt = config.reprompt;
    res.json({ prompt: prompt, reprompt: reprompt });
  } else {
    if (origin) {
      // get origin.descrip and origin.coords for origin that was passed in
      rideHelper.placesCall(origin.query, function (descrip, coords) {
        origin.descrip = descrip;
        origin.coords = coords;
        if (destination.descrip) {
          // make getEstimate call since destination.descrip async call resolved first
          rideHelper.getEstimate(mode, origin.coords, destination.coords, function (winner) {
            prompt = rideHelper.formatAnswer(winner, mode, origin.descrip, destination.descrip, fakeoutMode);
            if (fakeoutMode) { // no need to post ride to the db
              res.json({ prompt: prompt });
            } else {
              rideHelper.addRide(winner, userId, origin, destination, function() {
                // TODO: update alexa response based on ride status (i.e., once we know it has been ordered)
                res.json({ prompt: prompt });
              });
            }
          });
        }
      });
    } else {
      // set origin properties to default values
      // TODO: get origin from User table once alexa auth is implemented
      origin = {
        descrip: 'Casa de Shez',
        coords: [37.7773563, -122.3968629] // Shez's house
      };
    }

    rideHelper.placesCall(destination.query, function (descrip, coords) {
      destination.descrip = descrip;
      destination.coords = coords;
      if (origin.descrip) {
        // make getEstimate call since originDescrip async call resolved first
        rideHelper.getEstimate(mode, origin.coords, destination.coords, function (winner) {
          prompt = rideHelper.formatAnswer(winner, mode, origin.descrip, destination.descrip, fakeoutMode);
          if (fakeoutMode) { // no need to post ride to the db
            res.json({ prompt: prompt });
          } else {
            rideHelper.addRide(winner, userId, origin, destination, function() {
              // TODO: update alexa response based on ride status (i.e., once we know it has been ordered)
              res.json({ prompt: prompt });
            });
          }
        });
      }
    }, origin.coords);
  }
};
