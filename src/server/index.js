import express from 'express';
import { PORT, configureServer } from './server-configuration/config';
import routes from './routes';

const app = express();
// Sessions, passport, auth middleware
configureServer(app);
// Set up routes
routes(app);

app.listen(PORT, () => console.log('listening on port', PORT));
