import {VALID_API_TOKENS} from '../../../secret/config';

export default function(req, res, next) {
  console.log('checking validity');
  if (VALID_API_TOKENS.indexOf(req.headers.authorization) >= 0) {
    next();
    console.log('this is valid!');
  } else {
    res.json({message: 'invalid API key'});
    console.log('this is not valid!');
  }
}
