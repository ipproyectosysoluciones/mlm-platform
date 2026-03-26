import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import * as Sentry from '@sentry/node';
import { config } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import adminRoutes from './routes/admin.routes';
import crmRoutes from './routes/crm.routes';
import publicRoutes from './routes/public.routes';
import landingRoutes from './routes/landing.routes';
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
// Rate limit de 50 para desarrollo y testing, 5 para producción
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 50,
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

// Rate limiting for order creation (5 orders per minute per user)
// Rate limit para creación de pedidos (5 pedidos por minuto por usuario)
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 orders per minute per user
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many orders created. Please try again later. Maximum 5 orders per minute.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
});

if (!isTest) {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/orders', orderLimiter);
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
app.use('/api/public', publicRoutes);
app.use('/api', landingRoutes);

// Sentry debug route (only in non-production)
if (config.nodeEnv !== 'production') {
  app.get('/debug-sentry', () => {
    throw new Error('Sentry test error!');
  });
}

// Sentry Express error handler (must be after routes, before other error handlers)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Debug: Show all routes
app.get('/debug/routes', (req, res) => {
  const routes: string[] = [];
  app._router?.stack?.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(
        `${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`
      );
    } else if (middleware.name === 'router') {
      middleware.handle?.stack?.forEach((handler: any) => {
        if (handler.route) {
          routes.push(
            `${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`
          );
        }
      });
    }
  });
  res.json({ routes });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
