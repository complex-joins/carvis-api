import express from 'express';
import { PORT, configureServer } from '../src/server/server-configuration/config';
import routes from '../src/server/routes';

const app = express();
// Sessions, passport, auth middleware
configureServer(app);
// Set up routes
routes(app);

export default app;
