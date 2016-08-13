var staging = false;
var config = {};

if (staging) {
  config.prompt = 'With CARVIS you can find the average taxi fare from an airport to your hotel, and vice versa. For example, you can ask, CARVIS, how much is a taxi from Marriot San Francisco to SFO airport?';
  config.reprompt = 'Tell me where you want to be picked up, and where you want to go';
  config.helpSpeech = config.prompt;
  config.utterances = ['How much is a {car|ride|taxi} from {ORIGIN} to {DESTINATION}'];

  config.slots = {
    'ORIGIN': 'DESTINATION',
    'ORIGIN_ONE': 'DESTINATION_ONE',
    'DESTINATION': 'DESTINATION',
    'DESTINATION_ONE': 'DESTINATION_ONE',
  };
} else {
  config.prompt = 'With CARVIS you can order the cheapest or fastest car available. For example, you can say, CARVIS, find me the cheapest ride to Hack Reactor';
  config.reprompt = 'Tell me to book the cheapest or fastest car, and where you want to go';
  config.helpSpeech = 'CARVIS finds you the cheapest and/or fastest ride to your destination. ';
  config.helpSpeech += 'To begin, tell me to book the cheapest or fastest car, and where you want to go';
  config.utterances = ['{Find|Get|Order|Call|Book} {a|one|the|me the|me a} {MODE} {car|ride} to {DESTINATION}'];

  config.slots = {
    'MODE': 'MODE',
    'DESTINATION': 'DESTINATION',
    'DESTINATION_ONE': 'DESTINATION_ONE',
  };
}

exports.handleLaunch = function(req, res) {
  res.json(config);

  // const email = req.body.email;

  // if (!email || !password) {
  //   return res.status(422).send({ error: 'You must provide email and password'});
  // }

  // res.json({ token: tokenForUser(user) });
};
