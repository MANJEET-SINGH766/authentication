const protect = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authorized. No active session found.' });
  }
  next();
};

module.exports = { protect };
