import redisSetKey from './../../redis/redisHelperFunctions';

export const updateLyftToken = (req, res) => {
  let token = req.body.token;

  // TODO: Redis [and DB] insert of Bearer token.
};
