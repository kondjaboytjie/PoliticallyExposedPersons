const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next(); // Proceed without user if not authenticated

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(); // Token invalid
    req.user = user; // user: { id, email }
    next();
  });
}

module.exports = authenticateToken;
