const User = require('../models/User');
const { trackUserSession, untrackUserSession, getUserSessions, redisClient } = require('../config/redis');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide an email and password' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user and establish session
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Establish session with metadata
    req.session.userId = user._id.toString();
    req.session.ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    req.session.userAgent = req.headers['user-agent'] || 'unknown';
    req.session.createdAt = new Date().toISOString();

    req.session.save(async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Session save failed' });
      }
      await trackUserSession(user._id.toString(), req.sessionID);
      res.json({
        message: 'Logged in successfully',
        user: {
          id: user._id,
          email: user.email
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user and destroy session
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  const userId = req.session.userId;
  const sessionId = req.sessionID;

  req.session.destroy(async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to destroy session during logout' });
    }
    if (userId && sessionId) {
      await untrackUserSession(userId.toString(), sessionId);
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
};

// @desc    Get current user details from session
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active sessions of current user
// @route   GET /api/auth/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const userId = req.session.userId;
    const sessions = await getUserSessions(userId.toString());
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke a specific active session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
const revokeSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.session.userId;

  try {
    const userSessionKey = `user_sessions:${userId}`;
    const isMember = await redisClient.sIsMember(userSessionKey, sessionId);
    if (!isMember) {
      return res.status(404).json({ message: 'Session not found or does not belong to user' });
    }

    await redisClient.del(`sess:${sessionId}`);
    await untrackUserSession(userId.toString(), sessionId);

    if (sessionId === req.sessionID) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to destroy current session' });
        }
        res.clearCookie('connect.sid');
        return res.json({ message: 'Current session revoked successfully' });
      });
    } else {
      res.json({ message: 'Session revoked successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getSessions,
  revokeSession
};
