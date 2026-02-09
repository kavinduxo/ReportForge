// ReportForge - Report Routes

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

/**
 * POST /api/reports
 * Main endpoint to receive report generation requests from IFS Connect
 */
router.post('/', reportController.generateReport);

/**
 * GET /api/reports/status
 * Get service status
 */
router.get('/status', reportController.getStatus);

module.exports = router;