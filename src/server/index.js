import express from 'express';
import { PORT, configureServer } from './server-configuration/config';
import routes from './routes';
require('dotenv').config();
console.log(process.env);
const app = express();
// Sessions, passport, auth middleware
configureServer(app);
// Set up routes
routes(app);

app.listen(PORT, () => console.log('========CARVIS API======= \nlistening on port', PORT));
