import db from '../../db/db';

export const RideSchema = function (ride) {
  ride.increments('id')
    .primary();
  ride.timestamp('created_at')
    .defaultTo(db.knex.fn.now());
  ride.integer('userId'); // foreign key for the User table |-> carvis ID

  // default: 'estimate' - on booked: 'booked' - on cancel: 'cancelled'
  ride.string('rideStatus', 255);

  // the origin and destination of the ride - set before estimations
  ride.string('originLat', 255);
  ride.string('originLng', 255);
  ride.string('originRoutableAddress', 255);
  ride.string('destinationLat', 255);
  ride.string('destinationLng', 255);
  ride.string('destinationRoutableAddress', 255);

  // below is returned on the public estimate calls
  ride.string('winningVendorRideType', 255); // ex: 'pool', 'line', etc.
  ride.string('lyftEstimatedFare', 255); // dollars and cents
  ride.string('lyftEstimatedETA', 100); // minutes
  ride.string('uberEstimatedFare', 255);
  ride.string('uberEstimatedETA', 100);
  ride.string('winner', 255); // the vendor we book with - ex. 'Uber'
  ride.string('partySize', 1); // either 1 or 2. -- int ?

  // below is returned on the request-ride calls
  ride.string('eta', 255); // actual ETA of the specific booked car
  ride.string('vendorRideId', 255); // vendor string to reference cancellations
  ride.string('vendorRideToken', 255); // vendor string to reference cancellations -- UBER specific
  ride.string('tripDuration', 255); // duration of the ride origin to destination - returned by vendor on confirmation of request-ride
};

export const Ride = db.model('rides');
