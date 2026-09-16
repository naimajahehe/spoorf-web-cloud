import { app } from './app';
import { env } from './config/env';
import { pingDatabase, disconnectDatabase } from './config/database';
import { getDefaultCryptoSigner } from './utils/cryptoSigner';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('🚀 [Server] Bootstrapping Spoorf Web Cloud Backend...');

  // 1. Ensure Asymmetric RSA Keys are ready
  try {
    const signer = getDefaultCryptoSigner();
    logger.info('🔑 [Crypto] RS256 Asymmetric Keypair initialized and verified.');
  } catch (err: any) {
    logger.error('❌ [Crypto] Failed to initialize cryptographic keys:', err);
    process.exit(1);
  }

  // 2. Verify Database Connection
  const isDbReady = await pingDatabase();
  if (!isDbReady) {
    logger.error('❌ [Database] Cannot connect to PostgreSQL database at boot.');
    process.exit(1);
  }
  logger.info('🐘 [Database] PostgreSQL connected and healthy.');

  // 3. Start HTTP Server
  const server = app.listen(env.PORT, () => {
    logger.info(`🌐 [HTTP] Spoorf Cloud API listening at http://localhost:${env.PORT}`);
    logger.info(`   - Health check: http://localhost:${env.PORT}/v1/health`);
    logger.info(`   - Auth API    : http://localhost:${env.PORT}/v1/auth/login`);
  });

  // 4. Graceful Shutdown Handlers
  const shutdown = async (signal: string) => {
    logger.warn(`🛑 [Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      logger.info('🔒 [HTTP] HTTP server stopped accepting connections.');
      await disconnectDatabase();
      logger.info('🐘 [Database] Database connections closed.');
      process.exit(0);
    });

    // Force exit after 10 seconds if hanging
    setTimeout(() => {
      logger.error('⚠️ [Server] Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrapping error:', err);
  process.exit(1);
});