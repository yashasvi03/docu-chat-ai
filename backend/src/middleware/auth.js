const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies the JWT token in the Authorization header
 * Sets req.user with the decoded user information
 * 
 * In development mode, it allows requests without authentication
 * and sets a default user for testing purposes
 */
module.exports = (req, res, next) => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    // Set a default user for development
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      name: 'Development User'
    };
    
    // Log that we're bypassing authentication
    console.log('Development mode: Authentication bypassed');
    
    return next();
  }
  
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: true, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: true, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user in request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: true, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      error: true, 
      message: 'Invalid token.' 
    });
  }
};
