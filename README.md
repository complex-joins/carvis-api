[![Build Status](https://travis-ci.org/complex-joins/carvis-api.svg?branch=master)](https://travis-ci.org/complex-joins/carvis-api)
# carvis-api
Pithy project description

##Team

Built by `@alexcstark`, `@cpruijsen`, `@daredia`, `@JasonArkens17` as our final project `@hackreactor` .

##Stack:
Built using Node, Express, Passport, [StorkSQL](https://www.npmjs.com/package/storkSQL)

##Deployment:
Docker, AWS EC2, Build tools: NPM scripting, Webpack, ESlint. Testing: TravisCI, Mocha, Chai.

##APIs:
Uber, Lyft, Google Places, Twilio.

###Installing Dependencies

1. From within the root directory `npm install`
2. Internal => Run `npm run setup`. Others => You need to make a decision on where your secret config files will live and how to go about updating them. See the `npm run setup` script in the `package.json` for a good refrence.

##Usage

`build:server`: Transpile everything in src/server to dist/server (for supporting es6 syntax) 
`build:db`: Same as above but for the DB
`build`: Combines server and DB build into one statement 
`reset:db`: Deletes any exsisting tables and replaces with new tables specified in the schema 
`setup`: Download and copy secret config file (for internal use only, you must impliment yourself)
`docker:deploy`: Builds and pushes docker image to Docker Hub
`test`: Runs Mocha tests
`start`: Builds and starts server on localhost or ENV.port

##Moving Forward

From here you will need to link to the [Carvis-web](https://github.com/complex-joins/carvis). Also this repo does not include any of the Alexa skill side of the project. For Alexa skill go [here](https://github.com/complex-joins/alexa-poc)


##Possible future changes.
The Complex-Joins team will be working towards making this api service a usable endpoint for those wishing to use its functionality. Stay tuned for future updates!


Contributing

See CONTRIBUTING.md for contribution guidelines.
