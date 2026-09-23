import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'node:crypto';
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import downloadRoutes from './routes/downloadRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { ForbiddenError, NotFoundError } from './errors/AppError';
import { pingDatabase } from './config/database';
import { env } from './config/env';

export function createApp(): express.Application {
  const app = express();

  // Behind a reverse proxy, req.ip (used for rate limiting and session IP) must come
  // from the trusted proxy hop, not from a client-supplied X-Forwarded-For header.
  app.set('trust proxy', env.TRUST_PROXY);

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS (Strict Origin Policy)
  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, desktop clients)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new ForbiddenError(`Origin ${origin} tidak diizinkan oleh kebijakan CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
    })
  );

  // 3. Request Correlation & Context Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incomingReqId = req.headers['x-request-id'] as string;
    const requestId = incomingReqId || crypto.randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // 4. Body Parsers (Payload Limiting)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Health Check Endpoints
  const healthHandler = async (_req: Request, res: Response) => {
    const isDbConnected = await pingDatabase();
    const status = isDbConnected ? 'healthy' : 'degraded';
    res.status(isDbConnected ? 200 : 503).json({
      status,
      service: 'spoorf-web-cloud',
      version: '0.0.3',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected',
    });
  };

  app.get('/health', healthHandler);
  app.get('/v1/health', healthHandler);

  // 6. API Routing
  app.use('/v1/auth', authRoutes);
  app.use('/api/v1/auth', authRoutes); // Alias for flexible client routing
  app.use('/v1/sessions', sessionRoutes);
  app.use('/api/v1/sessions', sessionRoutes);
  app.use('/v1/download', downloadRoutes);
  app.use('/api/v1/download', downloadRoutes);

  // 7. 404 Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Rute tidak ditemukan: ${req.method} ${req.originalUrl}`));
  });

  // 8. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();