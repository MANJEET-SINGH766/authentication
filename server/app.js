require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { redisClient, connectRedis } = require('./config/redis');
const connectDB = require('./config/db');

const app = express();

// Body Parser Middleware
app.use(express.json());

// Initialize MongoDB Database
connectDB();

// Initialize Redis Client
connectRedis();

// Initialize connect-redis store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:'
});

// Configure Session Middleware
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'fallback_secret_389274_key',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours (1 day)
      sameSite: 'lax'
    }
  })
);

// Mount Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Server Status Check
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    redisConnected: redisClient.isOpen,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
