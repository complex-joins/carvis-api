const twilioCredentials = JSON.parse(process.env.TWILIO_CREDENTIALS_OBJ_JSON);
const TWILIO_SID = twilioCredentials.accountSid;
const TWILIO_TOKEN = twilioCredentials.authToken;
const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN);

// NOTE: Twilio will only work with approved numbers on the free trial account, for now Chris' number is approved.
// -- a test notice is included in all messages until we load $$$ to Twilio.

// Twilio SMS send to be invoked via a client side form, which upon click sends a POST request to our server on the '/message' path with a body of { number: targetPhoneNumber, message: intendedMessage }

// Twilio Functions
export const createMessage = (number, message) => {
  client.messages.create({
    to: "+14242179767", // TODO: number
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
      console.log('Success! The SID for this SMS message is:', message.sid);
      console.log('Message sent on:', message.dateCreated);
    } else {
      console.log('Error in Twilio SMS send', err);
    }
  });
}
