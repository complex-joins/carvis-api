import express from 'express';
import { PORT, configureServer } from '../src/server/server-configuration/config';
import routes from '../src/server/routes';
if (!process.env.PROD) {
  require('dotenv').config();
  console.log('hi');
}
const app = express();
// Sessions, passport, auth middleware
configureServer(app);
// Set up routes
routes(app);

export default app;
