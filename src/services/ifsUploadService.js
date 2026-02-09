// ReportForge - IFS Cloud Upload Service
// Handles uploading generated PDFs back to IFS Cloud

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { logger } = require('../app');

class IFSUploadService {
  constructor() {
    this.ifsCloudUrl = process.env.IFS_CLOUD_URL;
    this.iamUrl = process.env.IFS_IAM_URL;
    this.clientId = process.env.IFS_CLIENT_ID;
    this.clientSecret = process.env.IFS_CLIENT_SECRET;
    this.serviceUser = process.env.IFS_SERVICE_USER;
    this.servicePassword = process.env.IFS_SERVICE_PASSWORD;
    this.uploadBase = process.env.IFS_UPLOAD_BASE;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token from IFS IAM
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      logger.debug('🔑 Using cached access token');
      return this.accessToken;
    }

    try {
      logger.info('🔑 Fetching new access token from IFS IAM');

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('username', this.serviceUser);
      params.append('password', this.servicePassword);

      const response = await axios.post(this.iamUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 90% of actual expiry to avoid edge cases
      this.tokenExpiry = Date.now() + (response.data.expires_in * 900);

      logger.info('✅ Access token obtained successfully');
      return this.accessToken;

    } catch (error) {
      logger.error('❌ Failed to get access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with IFS Cloud');
    }
  }

  /**
   * Upload PDF to IFS Cloud via External Reports Gateway
   * @param {Object} params - Upload parameters
   */
  async uploadReport({ pdfPath, correlationId, printJobId, resultKey }) {
    try {
      logger.info(`📤 Starting PDF upload to IFS Cloud`, {
        correlationId,
        printJobId,
        resultKey
      });

      // Step 1: Get access token
      const token = await this.getAccessToken();

      // Step 2: Create temp lob entry
      logger.info('📝 Step 1: Creating FndTempLobs entry');
      const lobId = await this.createTempLob(token);

      // Step 3: Upload PDF data
      logger.info(`📤 Step 2: Uploading PDF data to lob ${lobId}`);
      await this.uploadPdfData(token, lobId, pdfPath);

      // Step 4: Call Upload action
      logger.info('🎯 Step 3: Calling Upload action');
      await this.callUploadAction(token, {
        printJobId,
        correlationId,
        resultKey,
        pdfTempLobId: lobId
      });

      logger.info(`✅ PDF uploaded successfully to IFS Cloud`, {
        correlationId,
        lobId
      });

      return { success: true, lobId };

    } catch (error) {
      logger.error(`❌ Failed to upload PDF to IFS Cloud:`, {
        correlationId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Step 1: Create FndTempLobs entry
   */
  async createTempLob(token) {
    const url = `${this.ifsCloudUrl}${this.uploadBase}/FndTempLobs`;

    const response = await axios.post(url, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Extract LobId from OData-EntityId header
    const entityId = response.headers['odata-entityid'];
    const lobId = entityId.match(/LobId='([^']+)'/)[1];

    logger.info(`✅ Created temp lob: ${lobId}`);
    return lobId;
  }

  /**
   * Step 2: Upload PDF binary data
   */
  async uploadPdfData(token, lobId, pdfPath) {
    const url = `${this.ifsCloudUrl}${this.uploadBase}/FndTempLobs(LobId='${lobId}')/BlobData`;

    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);

    await axios.put(url, pdfBuffer, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    logger.info(`✅ Uploaded PDF data (${pdfBuffer.length} bytes)`);
  }

  /**
   * Step 3: Call Upload action with metadata
   */
  async callUploadAction(token, { printJobId, correlationId, resultKey, pdfTempLobId }) {
    const url = `${this.ifsCloudUrl}${this.uploadBase}/Upload`;

    const payload = {
      PrintJobId: printJobId,
      CorrelationId: correlationId,
      ResultKey: resultKey,
      PdfTempLobId: pdfTempLobId
    };

    await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info(`✅ Upload action completed successfully`);
  }
}

module.exports = new IFSUploadService();