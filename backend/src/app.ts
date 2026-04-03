import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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
import commissionConfigRoutes from './routes/commission-config.routes';
import paymentRoutes from './routes/payment.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for ngrok/reverse proxy support
app.set('trust proxy', 1);

// Morgan logging - shows HTTP requests in console
// En producción usa 'combined' (más detalle), desarrollo usa 'dev'
if (!isTest) {
  app.use(morgan(isProduction ? 'combined' : 'dev'));
}

// CORS configuration with origin validation
// Security: In production, only allow origins from config whitelist
// In development, allow all (intentional for local testing)
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allowed?: boolean) => void
  ) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      // In production, deny requests with no origin (except same-server requests)
      if (isProduction) {
        // Allow same-origin requests (no origin header)
        callback(null, true);
      } else {
        callback(null, true);
      }
      return;
    }

    // In production: validate against whitelist
    if (isProduction) {
      // Allow any subdomain of vercel.app
      if (origin.endsWith('.vercel.app') || config.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    } else {
      // Development: allow all (intentional)
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'CF-Access-Client-Id',
    'CF-Access-Client-Secret',
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours for preflight cache
};

app.use(cors(corsOptions));

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

// Global API rate limiter - 200 requests per minute for all API routes
// Rate limit global: 200 solicitudes por minuto para todas las rutas API
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 1000 : 200, // 200 req/min production, 1000 for tests
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Apply global rate limiter to all API routes
app.use('/api', globalLimiter);

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

// Rate limiting for 2FA verification (strict: 10 attempts per minute)
// Rate limiting para verificación 2FA (estricto: 10 intentos por minuto)
const twoFALimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 attempts per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many 2FA verification attempts. Please try again later.',
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
  app.use('/api/auth/2fa/verify', twoFALimiter);
  app.use('/api/auth/2fa/verify-setup', twoFALimiter);
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
app.use('/api/admin/commissions', commissionConfigRoutes);
app.use('/api/payment', paymentRoutes);

// Sentry debug route (only in non-production)
if (config.nodeEnv !== 'production') {
  app.get('/debug-sentry', () => {
    throw new Error('Sentry test error!');
  });
}

// Sentry Express error handler (must be after routes, before other error handlers)
// Disabled in test environment to prevent import hanging
if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
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
