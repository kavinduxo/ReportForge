# CrystalBridge 💎

Middleware for IFS External Reports Gateway with Crystal Reports Server

## Overview

CrystalBridge acts as a bridge between IFS Cloud External Reports Gateway and your Crystal Reports Server. It receives report generation requests from IFS Connect, generates PDFs using Crystal Reports Server, and uploads them back to IFS Cloud.

## Architecture

```
IFS Cloud → IFS Connect → CrystalBridge → Crystal Reports Server
                              ↓
                         PDF Generated
                              ↓
                    Upload to IFS Cloud → Security Scan → File Storage
```

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Crystal Reports Server running
- ✅ IFS Cloud 25R1+ with External Reports Gateway configured
- ✅ Network access between CrystalBridge and both Crystal Server & IFS Cloud

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Critical settings to update in .env:**

```env
# Change this to a secure random string
API_KEY=your-secret-api-key-CHANGE-THIS

# Your Crystal Reports Server
CRYSTAL_SERVER_URL=http://your-crystal-server:8080
CRYSTAL_USERNAME=admin
CRYSTAL_PASSWORD=your-password

# Your IFS Cloud instance
IFS_CLOUD_URL=https://your-ifs-instance.com
IFS_IAM_URL=https://your-ifs-instance.com/auth/realms/your-realm/protocol/openid-connect/token
IFS_CLIENT_SECRET=your-client-secret
IFS_SERVICE_PASSWORD=your-service-password
```

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
🚀 CrystalBridge server running on http://0.0.0.0:3000
📊 Environment: development
💎 Crystal Reports Server: http://your-crystal-server:8080
🔗 IFS Cloud: https://your-ifs-instance.com
```

### 4. Test the Server

**Check health:**
```bash
curl http://localhost:3000/health
```

**Test with authentication:**
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "traceId": "test-123",
    "layoutName": "invoice.irg",
    "printJobKey": 12345,
    "dataKey": 67890
  }'
```

## Project Structure

```
crystalbridge/
├── server.js                      # Entry point
├── src/
│   ├── app.js                     # Express app setup
│   ├── api/
│   │   ├── controllers/
│   │   │   └── reportController.js   # Report request handler
│   │   ├── middleware/
│   │   │   ├── auth.js               # API key authentication
│   │   │   └── errorHandler.js       # Error handling
│   │   └── routes/
│   │       ├── reports.js            # Report routes
│   │       └── health.js             # Health check routes
│   └── services/
│       ├── crystalReportsService.js  # Crystal Reports integration
│       └── ifsUploadService.js       # IFS Cloud upload
├── logs/                          # Log files
├── temp/                          # Temporary PDF files
├── .env                           # Your configuration (create from .env.example)
├── .env.example                   # Configuration template
├── package.json                   # Dependencies
└── README.md                      # This file
```

## Configuration

### Crystal Reports Server Setup

1. **Ensure Crystal Reports Server is accessible**
   ```bash
   curl http://your-crystal-server:8080
   ```

2. **Test report generation manually** to verify your .rpt files work

3. **Update Crystal Server URL in .env**

### IFS Cloud Setup

#### Step 1: Configure External Reports Gateway in IFS Cloud

1. Navigate to: **Solution Manager → Reporting → Operational Reporting → External Reports Gateway Settings**

2. Configure:
   - **Report Endpoint URL:** `http://your-crystalbridge-server:3000/api/reports`
   - **API Key:** The same value you set in `API_KEY` in .env
   - **Enable Gateway:** Yes

#### Step 2: Create .irg Layout Files

1. In IFS Cloud, create layout files with `.irg` extension
2. Map them to your Crystal Reports in `crystalReportsService.js`

Example mapping in `src/services/crystalReportsService.js`:
```javascript
mapLayoutToReport(layoutName) {
  const mapping = {
    'customer_invoice': 'CustomerInvoice.rpt',
    'purchase_order': 'PurchaseOrder.rpt',
    'delivery_note': 'DeliveryNote.rpt'
  };
  return mapping[baseName.toLowerCase()] || `${baseName}.rpt`;
}
```

#### Step 3: Get IFS Cloud Credentials

You need:
- **Client ID** (usually: `fnd-client`)
- **Client Secret** (get from IFS Admin)
- **Service User** credentials
- **Realm name** for IAM URL

## API Endpoints

### POST /api/reports
Receives report generation requests from IFS Connect

**Request (from IFS Connect):**
```json
{
  "traceId": "unique-correlation-id",
  "reportKey": "CUSTOMER_INVOICE_REP",
  "dataKey": 12345,
  "layoutName": "invoice.irg",
  "printJobKey": 67890,
  "language": "en",
  "numberFormatting": "en-US"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated and uploaded successfully",
  "traceId": "unique-correlation-id",
  "layoutName": "invoice.irg",
  "processingTime": 2340
}
```

### GET /health
Health check endpoint

### GET /health/detailed
Detailed health check with dependency status

### GET /api/reports/status
Service status information

## Customization

### Mapping IFS Layouts to Crystal Reports

Edit `src/services/crystalReportsService.js`:

```javascript
mapLayoutToReport(layoutName) {
  const mapping = {
    // IFS layout name: Crystal .rpt file
    'invoice': 'CustomerInvoice.rpt',
    'po': 'PurchaseOrder.rpt'
  };
  return mapping[baseName] || `${baseName}.rpt`;
}
```

### Extracting Report Parameters

Edit `src/services/crystalReportsService.js`:

```javascript
extractParameters(data) {
  const parameters = {};
  
  // Add your custom parameter extraction
  if (data.invoiceNumber) parameters.InvoiceNo = data.invoiceNumber;
  if (data.customerCode) parameters.CustomerCode = data.customerCode;
  
  return parameters;
}
```

## Logging

Logs are written to:
- **Console** (colored, formatted)
- **logs/error.log** (errors only)
- **logs/combined.log** (all logs)

Log levels: `error`, `warn`, `info`, `debug`

Set log level in .env:
```env
LOG_LEVEL=info  # Change to 'debug' for verbose logging
```

## Troubleshooting

### Issue: "Authentication required"
- Check that `Authorization: Bearer YOUR_API_KEY` header is sent
- Verify API_KEY in .env matches what's configured in IFS

### Issue: "Failed to authenticate with IFS Cloud"
- Check IFS_IAM_URL is correct
- Verify IFS_CLIENT_SECRET and service user credentials
- Test IAM endpoint manually

### Issue: "Crystal Reports generation failed"
- Verify Crystal Reports Server is accessible
- Check Crystal Server credentials
- Test .rpt file exists at specified path
- Review Crystal Server logs

### Issue: "Failed to upload PDF to IFS Cloud"
- Check IFS_CLOUD_URL is correct
- Verify network connectivity to IFS Cloud
- Check IFS Cloud logs for upload errors
- Ensure FndTempLobs projection is accessible

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name crystalbridge

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t crystalbridge .
docker run -d -p 3000:3000 --env-file .env crystalbridge
```

## Security Checklist

- [ ] Change default API_KEY to a strong random value
- [ ] Use HTTPS in production (configure reverse proxy)
- [ ] Restrict network access (firewall rules)
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Use environment variables for all secrets
- [ ] Enable IFS Cloud IP whitelisting if available
- [ ] Monitor logs for suspicious activity

## Monitoring

Monitor these metrics:
- Request count and success rate
- Average processing time
- Error rate
- Crystal Server response time
- IFS Cloud upload success rate

Logs include:
- Every incoming request
- Report generation start/completion
- Upload start/completion
- All errors with full stack traces

## Support

For issues:
1. Check logs in `logs/` directory
2. Review IFS Cloud External Reports Gateway logs
3. Check Crystal Reports Server logs
4. Enable debug logging: `LOG_LEVEL=debug`

## License

MIT

---

**Built for IFS Cloud 25R1+ External Reports Gateway**
