let TWILIO_SID, TWILIO_TOKEN;

if (process.env.PROD) {
  TWILIO_SID = process.env.TWILIO_CREDENTIALS_OBJ_ACCOUNTSID;
  TWILIO_TOKEN = process.env.TWILIO_CREDENTIALS_OBJ_AUTHTOKEN;
} else {
  let twilioCreds = JSON.parse(process.env.TWILIO_CREDENTIALS_OBJ_JSON);
  TWILIO_SID = twilioCreds.accountSid;
  TWILIO_TOKEN = twilioCreds.authToken;
}
const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN);

// Twilio will only work with approved numbers on the free trial account.
// for now only Chris' number (see below) is approved.
// -- a test notice is included in all messages until we load $$$ to Twilio.

// Twilio SMS send to be invoked via a client side form, which upon click sends a POST request to our server on the '/message' path with a body of { number: targetPhoneNumber, message: intendedMessage }

// Twilio Functions
export const createMessage = (req, res) => {
  let message = req.body.message;
  // default number for testing.
  let number = req.body.number || "+14242179767";
  // in cases of international/invalid numbers Twilio will handle errors
  // we still want to know what the case was
  // and in case the +1 was ommitted we add it in.
  if (number.length < 12) {
    if (number.slice(0, 1) !== '+') {
      console.warn('US number without +1 prefix')
      number = '+1' + number;
    } else {
      console.info('international number', number);
    }
  } else {
    if (number.slice(0, 1) !== '+') {
      console.warn('invalid number', number);
    } else if (number.length === 12) {
      console.info('US number', number);
    } else {
      console.info('international number', number);
    }
  }

  client.messages.create({
    to: number,
    from: "+19495417437",
    body: message
  }, (err, message) => {
    // The HTTP request to Twilio will run asynchronously. This callback
    // function will be called when a response is received from Twilio
    // The "error" variable will contain error information, if any.
    // If the request was successful, this value will be "falsy"
    if (!err) {
      // The second argument to the callback will contain the information
      // sent back by Twilio for the request. In this case, it is the
      // information about the text messsage you just sent:
      res.json({ message: 'success!', SID: message.sid, created: message.dateCreated })
    } else {
      console.warn('Error in Twilio SMS send', err);
      res.json({ message: 'error! Twilio didn\'t work' });
    }
  });
}
