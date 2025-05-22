const { validationResult } = require('express-validator');

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 * Returns 400 with error messages if validation fails
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};
