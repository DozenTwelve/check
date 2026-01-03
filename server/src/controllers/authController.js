const { pool } = require('../config/db');

exports.getMe = (req, res) => {
  res.json(req.user);
};
