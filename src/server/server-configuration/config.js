import express from 'express';
import path from 'path';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';

export const PORT = process.env.PORT || 8080; // note: different from carvis-web

export const configureServer = function (app) {
  app.use(express.static(path.join(__dirname, '/../../client')));
  app.use(express.static(path.join(__dirname, '/../../../node_modules')));
  app.use(cookieParser());
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
  }));
  app.use(morgan('dev'));
};
