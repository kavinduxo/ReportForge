// ReportForge - Server Entry Point
// Middleware for IFS External Reports Gateway with Crystal Reports

require('dotenv').config();
import { app, logger } from './src/app';

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 ReportForge server running on http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`💎 Crystal Reports Server: ${process.env.CRYSTAL_SERVER_URL}`);
  logger.info(`🔗 IFS Cloud: ${process.env.IFS_CLOUD_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('⚠️ SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('⚠️ SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;
