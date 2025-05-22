const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Import services
const userService = require('../services/userService');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await userService.createUser({
      email,
      password: hashedPassword,
      name
    });
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Save refresh token
    await userService.saveRefreshToken(user.id, refreshToken);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to register user'
    });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials'
      });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Save refresh token
    await userService.saveRefreshToken(user.id, refreshToken);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to login'
    });
  }
};

/**
 * Google OAuth login
 * @route POST /api/auth/google
 */
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    // This would be implemented with Google OAuth verification
    // For now, return a mock response
    res.status(200).json({
      success: true,
      message: 'Google login not implemented yet',
      data: {
        user: null,
        accessToken: null,
        refreshToken: null
      }
    });
  } catch (error) {
    console.error('Error with Google login:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to login with Google'
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get user'
    });
  }
};

/**
 * Logout a user
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Clear refresh token
    await userService.clearRefreshToken(userId);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to logout'
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        error: true,
        message: 'Invalid refresh token'
      });
    }
    
    // Check if refresh token exists in database
    const user = await userService.getUserByRefreshToken(refreshToken);
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Save new refresh token
    await userService.saveRefreshToken(user.id, tokens.refreshToken);
    
    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to refresh token'
    });
  }
};

/**
 * Change password
 * @route PUT /api/auth/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: true,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await userService.updateUser(userId, { password: hashedPassword });
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to change password'
    });
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Save reset token
    await userService.saveResetToken(user.id, resetToken, resetTokenExpiry);
    
    // In a real application, send an email with the reset link
    // For now, just return the token in the response
    
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      // In a real app, don't include this in the response
      // This is just for demonstration
      data: {
        resetToken
      }
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to process password reset request'
    });
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Find user with valid reset token
    const user = await userService.getUserByResetToken(token);
    
    if (!user || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password and clear reset token
    await userService.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to reset password'
    });
  }
};

// Helper functions

/**
 * Generate JWT tokens
 * @param {Object} user - User object
 * @returns {Object} - Access and refresh tokens
 */
const generateTokens = (user) => {
  // Generate access token
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      id: user.id
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};
