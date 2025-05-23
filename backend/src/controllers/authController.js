const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Import configuration
const { jwtConfig } = require('../config');

// Import models
const { User, Organisation } = require('../models');

/**
 * Register a new user and organization
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, orgName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create organization
    const organisation = await Organisation.create({
      name: orgName
    });
    
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'owner',
      orgId: organisation.id
    });
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Save refresh token
    await user.update({ refreshToken });
    
    // Set HTTP-only cookie with access token
    res.cookie('access', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId
        },
        organisation: {
          id: organisation.id,
          name: organisation.name
        },
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
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Organisation }]
    });
    
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
    await user.update({ refreshToken });
    
    // Set HTTP-only cookie with access token
    res.cookie('access', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId
        },
        organisation: user.Organisation ? {
          id: user.Organisation.id,
          name: user.Organisation.name
        } : null,
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
        organisation: null,
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
    
    const user = await User.findByPk(userId, {
      include: [{ model: Organisation }],
      attributes: { exclude: ['password', 'refreshToken', 'resetToken', 'resetTokenExpiry'] }
    });
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        organisation: user.Organisation ? {
          id: user.Organisation.id,
          name: user.Organisation.name
        } : null
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
    await User.update(
      { refreshToken: null },
      { where: { id: userId } }
    );
    
    // Clear access token cookie
    res.clearCookie('access');
    
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
      decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    } catch (error) {
      return res.status(401).json({
        error: true,
        message: 'Invalid refresh token'
      });
    }
    
    // Check if refresh token exists in database
    const user = await User.findOne({
      where: {
        id: decoded.id,
        refreshToken
      }
    });
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Save new refresh token
    await user.update({ refreshToken: tokens.refreshToken });
    
    // Set HTTP-only cookie with access token
    res.cookie('access', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.status(200).json({
      success: true,
      data: {
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
    
    const user = await User.findByPk(userId);
    
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
    await user.update({ password: hashedPassword });
    
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
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    // Save reset token
    await user.update({
      resetToken,
      resetTokenExpiry
    });
    
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
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [Op.gt]: new Date()
        }
      }
    });
    
    if (!user) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password and clear reset token
    await user.update({
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

/**
 * Invite a user to the organization
 * @route POST /api/auth/invite
 */
exports.inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    const orgId = req.user.orgId;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser && existingUser.orgId === orgId) {
      return res.status(400).json({
        error: true,
        message: 'User is already a member of this organization'
      });
    }
    
    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    // In a real application, send an email with the invite link
    // For now, just return the token in the response
    
    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully',
      // In a real app, don't include this in the response
      // This is just for demonstration
      data: {
        inviteToken,
        email,
        role,
        orgId
      }
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to invite user'
    });
  }
};

/**
 * Get all users in the organization
 * @route GET /api/auth/users
 */
exports.getOrganizationUsers = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    
    const users = await User.findAll({
      where: { orgId },
      attributes: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt']
    });
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting organization users:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get organization users'
    });
  }
};

/**
 * Update user role
 * @route PUT /api/auth/users/:id/role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const orgId = req.user.orgId;
    
    // Check if user exists and belongs to the organization
    const user = await User.findOne({
      where: {
        id,
        orgId
      }
    });
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Prevent changing the role of the owner
    if (user.role === 'owner') {
      return res.status(403).json({
        error: true,
        message: 'Cannot change the role of the organization owner'
      });
    }
    
    // Update role
    await user.update({ role });
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update user role'
    });
  }
};

/**
 * Remove user from organization
 * @route DELETE /api/auth/users/:id
 */
exports.removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.orgId;
    
    // Check if user exists and belongs to the organization
    const user = await User.findOne({
      where: {
        id,
        orgId
      }
    });
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Prevent removing the owner
    if (user.role === 'owner') {
      return res.status(403).json({
        error: true,
        message: 'Cannot remove the organization owner'
      });
    }
    
    // Delete user
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: 'User removed successfully'
    });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to remove user'
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
      name: user.name,
      role: user.role,
      orgId: user.orgId
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.accessTokenExpiry }
  );
  
  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      id: user.id
    },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshTokenExpiry }
  );
  
  return { accessToken, refreshToken };
};
