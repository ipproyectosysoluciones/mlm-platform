/**
 * Authentication & Authorization Middleware
 * Middleware de Autenticación y Autorización
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config/env';

// ============================================
// TYPES
// ============================================

export type UserRole = 'admin' | 'user';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  referralCode: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    referralCode: string;
  };
  userId?: string;
}

// ============================================
// JWT HELPERS
// ============================================

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token requerido',
        },
      });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token inválido o expirado',
        },
      });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      referralCode: decoded.referralCode,
    };
    req.userId = decoded.userId;

    next();
  } catch (e) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error de autenticación',
      },
    });
  }
}

// Backward compatibility
export const authenticateToken = authenticate;

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) return next();

  const decoded = verifyToken(token);
  if (decoded) {
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      referralCode: decoded.referralCode,
    };
    req.userId = decoded.userId;
  }

  next();
}

// ============================================
// AUTHORIZATION MIDDLEWARE
// ============================================

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
      return;
    }

    next();
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  return requireRole('admin')(req, res, next);
}

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  return requireRole('user')(req, res, next);
}

// ============================================
// RESOURCE ACCESS CONTROL
// ============================================

export function restrictToOwnResource(resourceField: 'userId' | 'sponsorId' = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceOwnerId = req.params[resourceField];
    const currentUserId = req.user.id;

    if (resourceOwnerId && resourceOwnerId !== currentUserId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
      return;
    }

    next();
  };
}

export function canAccessResource(
  requester: { id: string; role: UserRole },
  resourceOwnerId: string,
  resourceSponsorId?: string | null
): boolean {
  if (requester.role === 'admin') return true;
  if (requester.id === resourceOwnerId) return true;
  if (resourceSponsorId && requester.id === resourceSponsorId) return true;
  return false;
}

// ============================================
// AUDIT LOGGING
// ============================================

export interface AuditLogEntry {
  userId: string;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  ipAddress?: string;
  success: boolean;
  timestamp: Date;
}

export async function logAccess(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUDIT]', JSON.stringify(fullEntry));
  }
}

export function auditAdminAccess(action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send.bind(res);

    res.send = function (body) {
      logAccess({
        userId: req.user?.id || 'unknown',
        userRole: req.user?.role || 'user',
        action,
        resource: req.originalUrl,
        resourceId: req.params.id || req.params.userId,
        method: req.method,
        ipAddress: req.ip,
        success: res.statusCode < 400,
      });

      return originalSend(body);
    };

    next();
  };
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const key = req.user?.id || req.ip || 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes',
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());

    next();
  };
}
