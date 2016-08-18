import db from '../../db/db';

export const UserSchema = function (user) {
  user.increments('id')
    .primary();
  user.timestamp('created_at')
    .defaultTo(db.knex.fn.now());

  // carvis auth -- might be factored out.
  user.string('email', 255)
    .unique();
  user.string('password', 100);

  // the Amazon Alexa userId
  user.text('alexaUserId', 'longtext')
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
  user.text('lyftPaymentInfo', 'longtext');
  user.text('lyftToken', 'longtext');
  // location shortcut data returned from Lyft
  user.string('lyftHomeLat', 255);
  user.string('lyftHomeLng', 255);
  user.string('lyftHomeRoutableAddress', 255);
  user.string('lyftWorkLat', 255);
  user.string('lyftWorkLng', 255);
  user.string('lyftWorkRoutableAddress', 255);

  // data returned from uber specific functions
  // token used for uber request-ride
  user.text('uberToken', 'longtext');
  // data used for uber authentication
  user.string('uberEmail', 255);
  user.string('uberPassword', 255);
};

export const User = db.model('users', {
  secureFields: {
    password: process.env.USER_ENCRYPT,
    fields: ['lyftToken', 'lyftPaymentInfo', 'uberPassword', 'uberToken', 'password', 'alexaUserId']
  }
});
