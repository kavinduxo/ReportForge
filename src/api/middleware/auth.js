// ReportForge - Authentication Middleware

const { logger } = require('../../app');

/**
 * Authenticate incoming requests using API Key
 * IFS Connect will send: Authorization: Bearer YOUR_API_KEY
 */
exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('🔒 Authentication failed: No authorization header', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    // Validate against configured API key
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      logger.error('🔒 API_KEY not configured in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    if (token !== validApiKey) {
      logger.warn('🔒 Authentication failed: Invalid API key', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication credentials'
      });
    }

    // Authentication successful
    logger.debug('✅ Authentication successful');
    next();

  } catch (error) {
    logger.error('🔒 Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};