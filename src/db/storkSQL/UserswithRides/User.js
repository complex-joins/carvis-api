import db from './db';
export const UserSchema = function (user) {
  user.increments('id')
    .primary();
  user.timestamp('created_at').defaultTo(db.knex.fn.now());

  // carvis auth -- might be factored out.
  user.string('email', 100)
    .unique();
  user.string('password', 100);

  // the Amazon Alexa userId
  user.string('alexaUserId', 100)
    .unique();

  // location shortcut data from our own web client
  // we offer users the ability to set these to the Lyft shortcuts,
  // in case we have those - or specify new shortcuts.
  user.string('carvisHomeLat', 255);
  user.string('carvisHomeLng', 255);
  user.string('carvisHomeRoutableAddress', 255);
  user.string('carvisWorkLat', 255);
  user.string('carvisWorkLng', 255);
  user.string('carvisWorkRoutableAddress', 255);

  // data returned from lyft specific functions
  user.string('firstName', 100);
  user.string('lastName', 100);
  user.string('picture', 200);
  user.string('lyftEmail', 100);
  // the phone number used for lyft authentication
  user.string('lyftPhoneNumber', 100);
  // data lyft uses for request-ride calls
  user.string('lyftPaymentInfo', 200);
  user.string('lyftToken', 200)
    .unique();
  // location shortcut data returned from Lyft
  user.string('lyftHomeLat', 255);
  user.string('lyftHomeLng', 255);
  user.string('lyftHomeRoutableAddress', 255);
  user.string('lyftWorkLat', 255);
  user.string('lyftWorkLng', 255);
  user.string('lyftWorkRoutableAddress', 255);

  // data returned from uber specific functions
  // token used for uber request-ride
  user.string('uberToken', 100)
    .unique();
  // data used for uber authentication
  user.string('uberEmail', 100);
  user.string('uberPassword', 100);

};

export const User = db.model('users', {
  secureFields: {
    password: '239823jf',
    fields: ['lyftToken', 'uberPassword', 'uberToken', 'password', 'alexaUserId']
  }
});

// User.create({
//   email: 'tes one',
//   password: 'hi',
//   uberPassword: 'please be protected'})
// .then((user) => console.log(user));
//
// User.findOne({email: 'tes one'})
// .then((user) => console.log(User.decryptModel(user)));


User.findAll()
.then((users) => console.log(User.decryptCollection(users)));
