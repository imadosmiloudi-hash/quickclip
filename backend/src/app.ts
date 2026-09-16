import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rootRouter } from './routes/root.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { foldersRouter } from './routes/folders.js';
import { contentRouter } from './routes/content.js';
import { mediaRouter } from './routes/media.js';
import { syncRouter } from './routes/sync.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.isTest ? 10_000 : config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(rootRouter);
  app.use(healthRouter);
  app.use('/auth', authRouter);
  app.use('/folders', foldersRouter);
  app.use('/content', contentRouter);
  app.use('/media', mediaRouter);
  app.use('/sync', syncRouter);

  app.use(errorHandler);
  return app;
}
