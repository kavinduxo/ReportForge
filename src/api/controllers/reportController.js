// ReportForge - Report Controller
// Handles incoming report requests from IFS Connect

const { logger } = require('../../app');
const crystalReportsService = require('../../services/crystalReportsService');
const ifsUploadService = require('../../services/ifsUploadService');

/**
 * Main endpoint to receive report generation requests from IFS Connect
 * POST /api/reports
 */
exports.generateReport = async (req, res, next) => {
  const startTime = Date.now();
  let pdfPath = null;

  try {
    // Extract request payload
    const {
      traceId,
      reportKey,
      dataKey,
      layoutName,
      printJobKey,
      language,
      numberFormatting
    } = req.body;

    logger.info(`🎯 Report generation request received`, {
      traceId,
      reportKey,
      layoutName,
      printJobKey
    });

    // Validate required fields
    if (!traceId || !layoutName || !printJobKey) {
      logger.warn('⚠️ Missing required fields in request');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: traceId, layoutName, printJobKey'
      });
    }

    // Step 1: Generate report using Crystal Reports Server
    logger.info(`📊 Step 1: Generating Crystal Report`);
    pdfPath = await crystalReportsService.generateReport({
      layoutName,
      data: req.body, // Pass entire payload as data
      reportId: reportKey || traceId,
      traceId
    });

    // Step 2: Upload PDF to IFS Cloud
    logger.info(`📤 Step 2: Uploading PDF to IFS Cloud`);
    await ifsUploadService.uploadReport({
      pdfPath,
      correlationId: traceId,
      printJobId: printJobKey,
      resultKey: dataKey
    });

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    logger.info(`✅ Report generation completed successfully`, {
      traceId,
      layoutName,
      processingTime: `${processingTime}ms`
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Report generated and uploaded successfully',
      traceId,
      layoutName,
      processingTime
    });

  } catch (error) {
    logger.error(`❌ Report generation failed:`, {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Pass error to error handler middleware
    next(error);

  } finally {
    // Clean up temporary PDF file
    if (pdfPath) {
      try {
        crystalReportsService.cleanupTempFile(pdfPath);
      } catch (cleanupError) {
        logger.warn('⚠️ Cleanup error:', cleanupError);
      }
    }
  }
};

/**
 * Get service status
 * GET /api/reports/status
 */
exports.getStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      service: 'ReportForge',
      status: 'operational',
      crystalServer: process.env.CRYSTAL_SERVER_URL,
      ifsCloud: process.env.IFS_CLOUD_URL,
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
};