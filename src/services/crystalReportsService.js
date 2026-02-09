// ReportForge - Crystal Reports Service
// Handles integration with Crystal Reports Server

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { logger } = require('../app');

class CrystalReportsService {
  constructor() {
    this.serverUrl = process.env.CRYSTAL_SERVER_URL;
    this.reportsPath = process.env.CRYSTAL_REPORTS_PATH;
    this.username = process.env.CRYSTAL_USERNAME;
    this.password = process.env.CRYSTAL_PASSWORD;
    this.tempDir = process.env.TEMP_DIR || './temp';
  }

  /**
   * Generate a report using Crystal Reports Server
   * @param {Object} params - Report generation parameters
   * @param {string} params.layoutName - The .irg layout name from IFS
   * @param {Object} params.data - Report data/parameters
   * @param {string} params.reportId - Unique report identifier
   * @returns {Promise<string>} - Path to generated PDF file
   */
  async generateReport({ layoutName, data, reportId, traceId }) {
    try {
      logger.info(`📊 Generating Crystal Report`, {
        layoutName,
        reportId,
        traceId
      });

      // Map .irg layout name to Crystal .rpt file
      const crystalReportName = this.mapLayoutToReport(layoutName);
      
      logger.info(`🔄 Mapped layout ${layoutName} to Crystal report: ${crystalReportName}`);

      // Build Crystal Reports Server URL
      const reportUrl = `${this.serverUrl}${this.reportsPath}/${crystalReportName}`;

      // Extract parameters from data
      const parameters = this.extractParameters(data);

      logger.info(`📋 Report parameters:`, parameters);

      // Call Crystal Reports Server
      // Note: This is a generic example - adjust based on your Crystal Reports Server API
      const response = await axios({
        method: 'GET', // or POST depending on your Crystal Server setup
        url: reportUrl,
        auth: {
          username: this.username,
          password: this.password
        },
        params: {
          ...parameters,
          output: 'pdf' // Request PDF output
        },
        responseType: 'arraybuffer', // Important for binary PDF data
        timeout: 60000, // 60 second timeout
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Save PDF to temp directory
      const filename = `${reportId}_${Date.now()}.pdf`;
      const filepath = path.join(this.tempDir, filename);

      fs.writeFileSync(filepath, response.data);

      const fileSize = fs.statSync(filepath).size;
      logger.info(`✅ Crystal Report generated successfully`, {
        filepath,
        fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
        traceId
      });

      return filepath;

    } catch (error) {
      logger.error(`❌ Error generating Crystal Report:`, {
        layoutName,
        reportId,
        error: error.message,
        stack: error.stack,
        traceId
      });
      
      throw new Error(`Crystal Reports generation failed: ${error.message}`);
    }
  }

  /**
   * Map IFS .irg layout name to Crystal .rpt file
   * Add your custom mapping logic here
   */
  mapLayoutToReport(layoutName) {
    // Remove .irg extension if present
    const baseName = layoutName.replace('.irg', '');

    // Add your custom mapping logic here
    // For now, we assume 1:1 mapping with .rpt extension
    // Example custom mapping:
    const mapping = {
      'invoice': 'CustomerInvoice.rpt',
      'purchase_order': 'PurchaseOrder.rpt',
      'delivery_note': 'DeliveryNote.rpt'
    };

    return mapping[baseName.toLowerCase()] || `${baseName}.rpt`;
  }

  /**
   * Extract parameters from IFS data payload
   * Customize based on your Crystal Reports parameter requirements
   */
  extractParameters(data) {
    const parameters = {};

    // Extract common IFS parameters
    if (data.invoiceNumber) parameters.InvoiceNumber = data.invoiceNumber;
    if (data.orderNumber) parameters.OrderNumber = data.orderNumber;
    if (data.customerNumber) parameters.CustomerNumber = data.customerNumber;
    if (data.fromDate) parameters.FromDate = data.fromDate;
    if (data.toDate) parameters.ToDate = data.toDate;

    // Add any additional custom parameter extraction logic here
    // Example: if (data.customField) parameters.CustomParam = data.customField;

    return parameters;
  }

  /**
   * Clean up temporary PDF file
   */
  cleanupTempFile(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info(`🧹 Cleaned up temp file: ${filepath}`);
      }
    } catch (error) {
      logger.warn(`⚠️ Failed to cleanup temp file: ${filepath}`, error);
    }
  }
}

module.exports = new CrystalReportsService();