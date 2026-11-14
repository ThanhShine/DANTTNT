import 'dotenv/config';
import app from './app';
import { config } from './config';
import { testConnection } from './config/database';
import fs from 'fs';
import path from 'path';

const startServer = async () => {
  // Kiểm tra kết nối database
  await testConnection();

  // Tạo thư mục uploads nếu chưa có
  const uploadDir = path.join(process.cwd(), config.upload.dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory');
  }

  // Khởi động server
  const server = app.listen(config.port, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     SALES AI BACKEND — SERVER STARTED            ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Port:        ${config.port}                              ║`);
    console.log(`║  Mode:        ${config.env.padEnd(14)}                    ║`);
    console.log(`║  API Base:    http://localhost:${config.port}/api          ║`);
    console.log(`║  Health:      http://localhost:${config.port}/health       ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
