const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config');
const { User } = require('../models');

/**
 * Authentication middleware
 * Verifies the JWT token in the Authorization header or cookie
 * Sets req.user with the decoded user information
 * 
 * In development mode, it allows requests without authentication
 * and sets a default user for testing purposes
 */
const auth = async (req, res, next) => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development' && process.env.AUTH_BYPASS === 'true') {
    // Set a default user for development
    req.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      name: 'Development User',
      role: 'owner',
      orgId: 'dev-org-id'
    };
    
    // Log that we're bypassing authentication
    console.log('Development mode: Authentication bypassed');
    
    return next();
  }
  
  try {
    let token;
    
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in header, check for token in cookies
    if (!token && req.cookies && req.cookies.access) {
      token = req.cookies.access;
    }
    
    if (!token) {
      return res.status(401).json({ 
        error: true, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Get user from database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        error: true, 
        message: 'User not found.' 
      });
    }
    
    // Set user in request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId
    };
    
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

/**
 * Role-based access control middleware
 * Checks if the user has the required role
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: true, 
        message: 'Access denied. Not authenticated.' 
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: true, 
        message: 'Access denied. Not authorized.' 
      });
    }
    
    next();
  };
};

module.exports = {
  auth,
  authorize
};
