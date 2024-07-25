module.exports.authenticate = (req, res, next) => {
    // Example authentication logic
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  };
  