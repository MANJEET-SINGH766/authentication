const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err.message));
redisClient.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error(`Could not connect to Redis: ${error.message}`);
  }
};

const trackUserSession = async (userId, sessionId) => {
  try {
    await redisClient.sAdd(`user_sessions:${userId}`, sessionId);
  } catch (err) {
    console.error('Error tracking session in Redis:', err.message);
  }
};

const untrackUserSession = async (userId, sessionId) => {
  try {
    await redisClient.sRem(`user_sessions:${userId}`, sessionId);
  } catch (err) {
    console.error('Error untracking session in Redis:', err.message);
  }
};

const getUserSessions = async (userId) => {
  try {
    const sessionIds = await redisClient.sMembers(`user_sessions:${userId}`);
    const activeSessions = [];
    const expiredSessionIds = [];

    for (const sessId of sessionIds) {
      const sessDataJson = await redisClient.get(`sess:${sessId}`);
      if (sessDataJson) {
        const sessData = JSON.parse(sessDataJson);
        activeSessions.push({
          sessionId: sessId,
          userId: sessData.userId,
          ip: sessData.ip,
          userAgent: sessData.userAgent,
          createdAt: sessData.createdAt,
          cookie: sessData.cookie
        });
      } else {
        expiredSessionIds.push(sessId);
      }
    }

    // Clean up expired session IDs in the background
    if (expiredSessionIds.length > 0) {
      await redisClient.sRem(`user_sessions:${userId}`, expiredSessionIds);
    }

    return activeSessions;
  } catch (err) {
    console.error('Error fetching sessions from Redis:', err.message);
    return [];
  }
};

module.exports = {
  redisClient,
  connectRedis,
  trackUserSession,
  untrackUserSession,
  getUserSessions
};
