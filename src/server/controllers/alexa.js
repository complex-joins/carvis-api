const _ = require('lodash'); // used for _.filter
import { formatAnswer, getEstimate, addRide } from '../utils/ride-helper';
import { placesCall } from './../utils/place-helper';

const fakeoutMode = JSON.parse(process.env.FAKEOUT) || false; // when true, CARVIS will tell you about taxi fares, not uber and lyft estimates
const config = {};

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

export const handleLaunch = (req, res) => {
  res.json(config);
  // return res.status(422).send({ error: 'You must provide email and password'});
};

export const AlexaGetEstimate = (req, res) => {
  let slots = req.body.data.request.intent.slots;
  console.log('slots:', slots);

  let userId = req.body.userId; // the unique alexa session userId. that said, its the *carvis userId* i should be storing in the session and passing to carvis api endpoints
  let mode = (fakeoutMode) ? 'cheapest' : slots.MODE.value; // cheapest or fastest

  // find the ORIGIN slot that is populated in this request, if any
  let originArray = _.filter(slots, (slotValue, slotKey) => {
    return (slotValue.value && slotValue.value.length > 0 && slotKey.includes('ORIGIN'));
  });
  let origin = (originArray.length) ? { query: originArray[0].value } : null;
  console.log('Alexa thinks the origin passed in is', origin);

  // find the DESTINATION slot that is populated in this request
  let destinationSlots = _.filter(slots, (slotValue, slotKey) => {
    return (slotValue.value && slotValue.value.length > 0 && slotKey.includes('DESTINATION'));
  });
  let destination = (destinationSlots.length) ? { query: destinationSlots[0].value } :
    null;
  console.log('Alexa thinks my destination is', destination);

  let prompt, reprompt;

  if (!mode || !destination || (fakeoutMode && !origin)) {
    prompt = 'I didn\'t catch that. Please try again';
    reprompt = config.reprompt;
    res.json({ prompt: prompt, reprompt: reprompt });
  } else {
    if (origin) {
      // get origin.descrip and origin.coords for origin that was passed in
      placesCall(origin.query, (descrip, coords) => {
        // if descrip is empty, alexa will reply appropriately
        if (!descrip) {
          res.json({ prompt: `I wasn\'t able to find the location, ${origin.query}. Please try again` });
          return;
        }

        origin.descrip = descrip;
        origin.coords = coords;
        if (destination.descrip) {
          // make getEstimate call since destination.descrip async call resolved first
          getEstimate(mode, origin.coords, destination.coords, winner => {
            if (!winner) {
              res.json({ prompt: `There are no rides available from ${origin.descrip} to ${destination.descrip}. Please try again.` });
              return;
            }

            prompt = formatAnswer(winner, mode, origin.descrip, destination.descrip, fakeoutMode);
            if (fakeoutMode) { // no need to post ride to the db
              res.json({ prompt: prompt });
            } else {
              addRide(winner, userId, origin, destination, () => {
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

    // destination.query is a string, such as 'hack reactor'
    // the callback expects descrip and coordinates
    // descrip - unsure - string
    // origin.coords -- home location [lat, lng]

    placesCall(destination.query, (descrip, coords) => {
      // if descrip is empty, alexa will reply appropriately
      if (!descrip) {
        res.json({ prompt: `I wasn\'t able to find the location, ${destination.query}. Please try again` });
        return;
      }

      destination.descrip = descrip;
      destination.coords = coords;
      if (origin.descrip) {
        // make getEstimate call since originDescrip async call resolved first
        getEstimate(mode, origin.coords, destination.coords, winner => {
          if (!winner) {
            res.json({ prompt: `There are no rides available from ${origin.descrip} to ${destination.descrip}. Please try again.` });
            return;
          }

          prompt = formatAnswer(winner, mode, origin.descrip, destination.descrip, fakeoutMode);
          if (fakeoutMode) { // no need to post ride to the db
            res.json({ prompt: prompt });
          } else {
            addRide(winner, userId, origin, destination, () => {
              // TODO: update alexa response based on ride status (i.e., once we know it has been ordered)
              res.json({ prompt: prompt });
            });
          }
        });
      }
    }, origin.coords);
  }
};
