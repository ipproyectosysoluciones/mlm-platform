import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import adminRoutes from './routes/admin.routes';
import crmRoutes from './routes/crm.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration with origin validation
app.use(
  cors({
    origin: isProduction
      ? (origin, callback) => {
          // In production, validate origin against allowed list
          if (!origin || config.cors.allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
          }
        }
      : true, // In development, allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours for preflight cache
  })
);

// Security headers with Helmet
app.use(
  helmet({
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (!isTest) {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MLM API Documentation',
  })
);

// API Routes
app.use('/api', routes);
app.use('/api/admin', adminRoutes);
app.use('/api/crm', crmRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
