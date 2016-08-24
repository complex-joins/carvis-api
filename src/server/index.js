import express from 'express';
import { PORT, configureServer } from './server-configuration/config';
import routes from './routes';
if (!process.env.PROD) {
  require('dotenv').config();
}

const app = express();
// Sessions, passport, auth middleware
configureServer(app);
// Set up routes
routes(app);

app.listen(PORT, () => console.log('========CARVIS API======= \nlistening on port', PORT));
