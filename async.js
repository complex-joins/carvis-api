exports.handleLaunch = function(req, res) {
  //call to the DB with alexaID
  User.find({alexaID: req.params.alexaID})
  .then((user) => user.length === 0 ? res.json({}) : User.decryptModel(user[0]))
  .catch((err) => res.status(400).json(err))
  .then((data) => {
    config.userID = data.userID
    return config;
  })
  .then((data) => {res.json(data);})

  // return res.status(422).send({ error: 'You must provide email and password'});
};
