# 🚀 CRYSTALBRIDGE - COMPLETE SETUP GUIDE
## Step-by-Step Instructions - Every Command You Need

---

## ✅ STEP 1: SETUP YOUR MACHINE

### 1.1 Verify Node.js Installation

```bash
node --version
```
**Expected output:** `v18.x.x` or higher

If not installed:
- **Windows:** Download from nodejs.org
- **Linux:** `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **Mac:** `brew install node`

---

## ✅ STEP 2: CREATE PROJECT

### 2.1 Navigate to Your Projects Folder

```bash
cd ~/projects
# Or wherever you keep your projects
# Windows: cd C:\Projects
```

### 2.2 Download CrystalBridge Files

You have the crystalbridge folder with all files. Copy it to your projects directory.

**OR** if you need to create from scratch:

```bash
mkdir crystalbridge
cd crystalbridge
```

Then copy all the files I created into this directory.

---

## ✅ STEP 3: INSTALL DEPENDENCIES

### 3.1 Navigate to Project Directory

```bash
cd crystalbridge
```

### 3.2 Install All Node.js Packages

```bash
npm install
```

**This will install:**
- express (web framework)
- dotenv (environment variables)
- cors (cross-origin requests)
- helmet (security)
- winston (logging)
- morgan (request logging)
- axios (HTTP client)
- form-data (file uploads)
- nodemon (development auto-reload)

**Expected output:**
```
added 150+ packages in 15s
```

---

## ✅ STEP 4: CONFIGURE ENVIRONMENT

### 4.1 Create Your .env File

```bash
cp .env.example .env
```

**Windows:**
```cmd
copy .env.example .env
```

### 4.2 Edit .env File

```bash
nano .env
```

**OR** use any text editor:
- **Windows:** `notepad .env`
- **Mac:** `open -e .env`
- **VS Code:** `code .env`

### 4.3 Update These Critical Values:

```env
# 1. GENERATE A SECURE API KEY
API_KEY=CrystalBridge_2024_SecureKey_ChangeThis_XyZ123

# 2. YOUR CRYSTAL REPORTS SERVER
CRYSTAL_SERVER_URL=http://192.168.1.100:8080
CRYSTAL_USERNAME=Administrator
CRYSTAL_PASSWORD=YourCrystalPassword

# 3. YOUR IFS CLOUD INSTANCE  
IFS_CLOUD_URL=https://yourcompany.ifscloud.com

# 4. IFS IAM URL (ask your IFS admin for the realm name)
IFS_IAM_URL=https://yourcompany.ifscloud.com/auth/realms/ifscloud/protocol/openid-connect/token

# 5. IFS CLIENT SECRET (get from IFS admin)
IFS_CLIENT_SECRET=your-actual-client-secret-here

# 6. IFS SERVICE USER (get from IFS admin)
IFS_SERVICE_USER=svc_reports
IFS_SERVICE_PASSWORD=service-user-password-here
```

**Save and close** (Ctrl+X, then Y, then Enter in nano)

---

## ✅ STEP 5: CREATE REQUIRED DIRECTORIES

```bash
mkdir -p logs temp
```

**Verify directories exist:**
```bash
ls -la
```

You should see:
- logs/
- temp/
- src/
- node_modules/
- server.js
- package.json
- .env

---

## ✅ STEP 6: TEST THE SERVER

### 6.1 Start in Development Mode

```bash
npm run dev
```

**Expected output:**
```
🚀 CrystalBridge server running on http://0.0.0.0:3000
📊 Environment: development
💎 Crystal Reports Server: http://192.168.1.100:8080
🔗 IFS Cloud: https://yourcompany.ifscloud.com
```

### 6.2 Test Health Check (Open New Terminal)

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "CrystalBridge",
  "version": "1.0.0"
}
```

### 6.3 Test Detailed Health Check

```bash
curl http://localhost:3000/health/detailed
```

### 6.4 Test Authentication (Should Fail)

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 6.5 Test With Correct API Key

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer CrystalBridge_2024_SecureKey_ChangeThis_XyZ123" \
  -H "Content-Type: application/json" \
  -d '{
    "traceId": "test-123",
    "layoutName": "test.irg",
    "printJobKey": 12345,
    "dataKey": 67890
  }'
```

**Note:** This will fail at Crystal Reports generation (expected), but authentication should pass.

---

## ✅ STEP 7: CONFIGURE IFS CLOUD

### 7.1 Login to IFS Cloud

Navigate to your IFS Cloud instance in a browser.

### 7.2 Navigate to External Reports Gateway Settings

**Path:** 
```
Solution Manager → Reporting → Operational Reporting → External Reports Gateway Settings
```

### 7.3 Configure Gateway

**Settings to enter:**

| Field | Value |
|-------|-------|
| **Report Endpoint URL** | `http://your-server-ip:3000/api/reports` |
| **API Key** | Same as in your .env file |
| **Enable Gateway** | ✅ Yes |
| **Timeout** | 60 seconds |

**Replace `your-server-ip` with:**
- If same machine: `localhost` or `127.0.0.1`
- If different machine: actual IP address (e.g., `192.168.1.50`)

### 7.4 Save Configuration

Click **Save** in IFS Cloud.

---

## ✅ STEP 8: CREATE YOUR FIRST .IRG LAYOUT

### 8.1 In IFS Cloud, Create a New Report Layout

1. Go to your operational report (e.g., Customer Invoice)
2. Create new layout
3. **Name:** `invoice.irg`
4. **Type:** External Reports Gateway
5. Save

### 8.2 Map to Crystal Report

Edit `src/services/crystalReportsService.js`:

Find the `mapLayoutToReport` function and add:

```javascript
mapLayoutToReport(layoutName) {
  const baseName = layoutName.replace('.irg', '');
  
  const mapping = {
    'invoice': 'CustomerInvoice.rpt',
    'purchase_order': 'PurchaseOrder.rpt',
    // Add more mappings for your 40 reports
  };

  return mapping[baseName.toLowerCase()] || `${baseName}.rpt`;
}
```

**Save the file.**

### 8.3 Restart Server

```bash
# Press Ctrl+C in the terminal running npm run dev
# Then start again:
npm run dev
```

---

## ✅ STEP 9: TEST END-TO-END

### 9.1 Generate a Report from IFS Cloud

1. In IFS Cloud, navigate to your report
2. Select the `.irg` layout you created
3. Click **Print**

### 9.2 Watch CrystalBridge Logs

In your terminal running CrystalBridge, you should see:

```
📨 Incoming request: POST /api/reports
🎯 Report generation request received
📊 Step 1: Generating Crystal Report
📤 Step 2: Uploading PDF to IFS Cloud
✅ Report generation completed successfully
```

### 9.3 Check IFS Cloud

The PDF should appear in IFS Cloud for download.

---

## ✅ STEP 10: TROUBLESHOOTING COMMANDS

### If Crystal Reports Server Connection Fails:

```bash
# Test connectivity
curl http://your-crystal-server:8080

# Check Crystal Server logs
# (location depends on your Crystal installation)
```

### If IFS Cloud Upload Fails:

```bash
# Test IFS Cloud connectivity
curl https://yourcompany.ifscloud.com

# Check if IAM URL is correct
curl -X POST https://yourcompany.ifscloud.com/auth/realms/ifscloud/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=fnd-client" \
  -d "client_secret=your-secret" \
  -d "username=service_user" \
  -d "password=service-password"
```

### Enable Debug Logging:

Edit `.env`:
```env
LOG_LEVEL=debug
```

Restart server:
```bash
npm run dev
```

### View Logs:

```bash
# Live tail of all logs
tail -f logs/combined.log

# Live tail of errors only
tail -f logs/error.log

# View last 50 lines
tail -n 50 logs/combined.log
```

---

## ✅ STEP 11: PRODUCTION DEPLOYMENT

### 11.1 Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 11.2 Start with PM2

```bash
pm2 start server.js --name crystalbridge
```

### 11.3 View Status

```bash
pm2 status
```

### 11.4 View Logs

```bash
pm2 logs crystalbridge
```

### 11.5 Save Configuration

```bash
pm2 save
```

### 11.6 Setup Auto-Start on Boot

```bash
pm2 startup
```

**Follow the instructions it prints.**

### 11.7 Monitor

```bash
pm2 monit
```

---

## ✅ STEP 12: ADDING YOUR 40 REPORTS

### 12.1 Create a Mapping File

Create `config/report-mappings.json`:

```json
{
  "customer_invoice": "Reports/Finance/CustomerInvoice.rpt",
  "purchase_order": "Reports/Purchasing/PurchaseOrder.rpt",
  "delivery_note": "Reports/Logistics/DeliveryNote.rpt",
  "sales_quote": "Reports/Sales/Quote.rpt"
}
```

**Add all 40 of your reports here.**

### 12.2 Update crystalReportsService.js

```javascript
const mappings = require('../../config/report-mappings.json');

mapLayoutToReport(layoutName) {
  const baseName = layoutName.replace('.irg', '');
  return mappings[baseName.toLowerCase()] || `${baseName}.rpt`;
}
```

### 12.3 Create .irg Layouts in IFS Cloud

For each of your 40 reports:
1. Create `.irg` layout
2. Name matches key in `report-mappings.json`
3. Test individually

---

## 📞 QUICK REFERENCE

### Start Server:
```bash
npm run dev          # Development (auto-reload)
npm start            # Production
pm2 start server.js  # Production with PM2
```

### Stop Server:
```bash
Ctrl+C              # If running with npm
pm2 stop crystalbridge  # If using PM2
```

### View Logs:
```bash
tail -f logs/combined.log
pm2 logs crystalbridge  # If using PM2
```

### Health Check:
```bash
curl http://localhost:3000/health
```

### Restart After Changes:
```bash
Ctrl+C → npm run dev     # Development
pm2 restart crystalbridge  # Production
```

---

## 🎯 YOU'RE DONE!

Your CrystalBridge middleware is now running and ready to connect IFS Cloud with Crystal Reports Server!

**Next steps:**
1. Add all 40 report mappings
2. Test each report
3. Deploy to production with PM2
4. Monitor logs
5. Set up backup/monitoring

---

**Need help?** Check logs in `logs/` directory or enable debug mode.
