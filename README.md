[![Build Status](https://travis-ci.org/complex-joins/carvis-api.svg?branch=master)](https://travis-ci.org/complex-joins/carvis-api) [![bitHound Overall Score](https://www.bithound.io/github/complex-joins/carvis-api/badges/score.svg)](https://www.bithound.io/github/complex-joins/carvis-api) [![bitHound Dependencies](https://www.bithound.io/github/complex-joins/carvis-api/badges/dependencies.svg)](https://www.bithound.io/github/complex-joins/carvis-api/master/dependencies/npm)

# carvis-api

With CARVIS you can order the cheapest or fastest car available, from your Amazon Alexa device and our web client.
For example, you can say: `CARVIS, find me the cheapest ride to Hack Reactor`.

##Team

Built by `@alexcstark`, `@cpruijsen`, `@daredia`, `@JasonArkens17` as our final project `@hackreactor` .

##Stack:0 Built using Node, Express, Passport, [StorkSQL](https://www.npmjs.com/package/storkSQL)

##Deployment:0 Docker, AWS EC2, Build tools: NPM scripting, Webpack, ESlint. Testing: TravisCI, Mocha, Chai.

##APIs:
Uber, Lyft, Google Places, Twilio.

###Installing Dependencies

1. From within the root directory `npm install`
2. Internal => Run `npm run setup`. Others => You need to make a decision on where your secret config files will live and how to go about updating them. See the `npm run setup` script in the `package.json` for a good refrence.

To run locally - make sure you have Redis installed on your machine.
You can find the latest installs at https://redis.io

Once installed, run `npm start` from a first tab, `redis-server` from a second tab, and optionally `redis-cli` from a third tab.

This runs the npm build script, sets up the local server and local redis cache for development.

##Usage

* `build:server`: Transpile everything in src/server to dist/server (for supporting es6 syntax)
* `build:db`: Same as above but for the DB
* `build:redis`: Same as above but for the Redis cache and helpers
* `build`: Combines server, DB and Redis build into one statement
* `reset:db`: Deletes any exsisting tables and replaces with new tables specified in the schema
* `setup`: Download and copy secret config file (for internal use only, you must impliment yourself)
* `docker:deploy`: Builds and pushes docker image to Docker Hub
* `test`: Runs Mocha tests
* `start`: Builds and starts server on localhost or ENV.port

### Routes

All routes require the appropriate API token.

  User routes:
  `app.get('/users/:userid', hasValidAPIToken, getUserDashboardData);`

  `app.get('/dev/users', hasValidAPIToken, getAllUserData);`

  `app.post('/dev/users', hasValidAPIToken, createUser);`

  `app.post('/auth/users', hasValidAPIToken, findOrCreateUser);`

  `app.post('/users/updateOrCreate', hasValidAPIToken, updateOrCreateUser);`

  `app.put('/users/:userid', hasValidAPIToken, updateUserData);`

  `app.delete('/dev/users/:userid', hasValidAPIToken, deleteUser);`

  `app.get('/dev/users/raw', hasValidAPIToken, rawUserData);`

  Ride routes:
  `app.get('/dev/rides', hasValidAPIToken, getAllRideData);`

  `app.get('/rides/user/:userid', hasValidAPIToken, getRidesForUser);`

  `app.put('/rides/:rideid', hasValidAPIToken, updateRide);`

  `app.post('/rides', hasValidAPIToken, addRide);`

  `app.delete('/rides/:rideid', hasValidAPIToken, deleteRide);`

  `app.post('/rides/shareETA/:userid', hasValidAPIToken, shareRideETA);`

  `app.post('/rides/cancelRide/:userid', hasValidAPIToken, shareRideETA);`

  Alexa routes:
  `app.post('/alexa/launch', alexa.handleLaunch);`

  `app.post('/alexa/estimate', alexa.getEstimate);`

  Internal routes:
  - refresh or obtain the lyft Bearer Token for public API access
  `app.get('/internal/lyftBearerToken', hasValidAPIToken, getLyftToken);`

  `app.post('/internal/lyftBearerToken', hasValidAPIToken, updateLyftToken);`

  - create a new developer key - for external API access
  `app.get('/developer/createToken', hasValidAPIToken, createNewDeveloperKey);`

### Public Developer API:
    - routes to be posted here.

##Moving Forward

From here you will need to link to the [Carvis-web](https://github.com/complex-joins/carvis). Also this repo does not include any of the Alexa skill side of the project. For Alexa skill go [here](https://github.com/complex-joins/alexa-poc)


##Possible future changes.
The Complex-Joins team will be working towards making this api service a usable endpoint for those wishing to use its functionality. Stay tuned for future updates!


Contributing

See CONTRIBUTING.md for contribution guidelines.
