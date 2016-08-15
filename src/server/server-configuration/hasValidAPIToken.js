const API_KEY = process.env.CARVIS_API_KEY ? process.env.CARVIS_API_KEY : require('../../../secret/config').CARVIS_API_KEY;

export default function(req, res, next) {
  console.log('checking validity');
  const token = req.body.token || req.query.token || req.headers['x-access-token'] || null;
  if (API_KEY.indexOf(token) >= 0) {
    next();
    console.log('this is valid!');
  } else {
    res.json({message: 'invalid API key'});
    console.log('this is not valid!');
  }
}
