const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import controllers
const authController = require('../controllers/authController');

// Import middleware
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Routes
// POST /api/auth/register - Register a new user
router.post('/register', 
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('name').isString(),
  body('orgName').isString(),
  validate,
  authController.register
);

// POST /api/auth/login - Login a user
router.post('/login', 
  body('email').isEmail(),
  body('password').isString(),
  validate,
  authController.login
);

// POST /api/auth/google - Google OAuth login
router.post('/google', 
  body('token').isString(),
  validate,
  authController.googleLogin
);

// GET /api/auth/me - Get current user
router.get('/me', auth, authController.getCurrentUser);

// POST /api/auth/logout - Logout a user
router.post('/logout', auth, authController.logout);

// POST /api/auth/refresh-token - Refresh access token
router.post('/refresh-token', 
  body('refreshToken').isString(),
  validate,
  authController.refreshToken
);

// PUT /api/auth/password - Change password
router.put('/password', 
  auth,
  body('currentPassword').isString(),
  body('newPassword').isLength({ min: 8 }),
  validate,
  authController.changePassword
);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', 
  body('email').isEmail(),
  validate,
  authController.forgotPassword
);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', 
  body('token').isString(),
  body('password').isLength({ min: 8 }),
  validate,
  authController.resetPassword
);

// POST /api/auth/invite - Invite a user to the organization (owner/admin only)
router.post('/invite',
  auth,
  authorize(['owner', 'admin']),
  body('email').isEmail(),
  body('role').isIn(['admin', 'editor', 'viewer']),
  validate,
  authController.inviteUser
);

// GET /api/auth/users - Get all users in the organization (owner/admin only)
router.get('/users',
  auth,
  authorize(['owner', 'admin']),
  authController.getOrganizationUsers
);

// PUT /api/auth/users/:id/role - Update user role (owner only)
router.put('/users/:id/role',
  auth,
  authorize(['owner']),
  body('role').isIn(['admin', 'editor', 'viewer']),
  validate,
  authController.updateUserRole
);

// DELETE /api/auth/users/:id - Remove user from organization (owner only)
router.delete('/users/:id',
  auth,
  authorize(['owner']),
  authController.removeUser
);

module.exports = router;
