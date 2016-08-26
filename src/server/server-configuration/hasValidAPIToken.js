const API_KEY = process.env.CARVIS_API_KEY;
export default function(req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'] || null;
  console.log('MASTER API KEY', API_KEY, 'LOCAL TOKEN', token);

  if (API_KEY === token) {
    next();
  } else {
    res.json({message: 'invalid API key'});
  }
}
