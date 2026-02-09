// ReportForge - Health Check Routes

const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'ReportForge',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/detailed
 * Detailed health check including dependencies
 */
router.get('/detailed', async (req, res) => {
  const health = {
    success: true,
    status: 'healthy',
    service: 'ReportForge',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      crystalServer: 'unknown',
      ifsCloud: 'unknown',
      disk: 'healthy'
    }
  };

  try {
    // Check Crystal Reports Server
    try {
      const crystalUrl = process.env.CRYSTAL_SERVER_URL;
      await axios.get(crystalUrl, { timeout: 5000 });
      health.checks.crystalServer = 'healthy';
    } catch (error) {
      health.checks.crystalServer = 'unhealthy';
      health.status = 'degraded';
    }

    // Check IFS Cloud connectivity
    try {
      const ifsUrl = process.env.IFS_CLOUD_URL;
      await axios.get(ifsUrl, { timeout: 5000 });
      health.checks.ifsCloud = 'healthy';
    } catch (error) {
      health.checks.ifsCloud = 'unhealthy';
      health.status = 'degraded';
    }

    res.json(health);
  } catch (error) {
    health.success = false;
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503).json(health);
  }
});

module.exports = router;