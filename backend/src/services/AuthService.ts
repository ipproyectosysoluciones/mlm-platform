/**
 * @fileoverview AuthService - Authentication utilities
 * @description Password hashing, JWT token generation and verification
 *               Utilidades de autenticación: hash de passwords, generación y verificación de tokens JWT
 * @module services/AuthService
 */

import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import type { JwtPayload, UserAttributes } from '../types';

/**
 * @constant {number} SALT_ROUNDS
 * @description Number of salt rounds for bcrypt hashing / Número de rounds de salt para bcrypt
 */
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * Genera el hash de una contraseña usando bcrypt
 * @param {string} password - Plain text password / Contraseña en texto plano
 * @returns {Promise<string>} Hashed password / Contraseña hasheada
 * @example
 * const hash = await hashPassword('myPassword123');
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * Verifica una contraseña contra un hash
 * @param {string} password - Plain text password / Contraseña en texto plano
 * @param {string} hash - Bcrypt hash / Hash de bcrypt
 * @returns {Promise<boolean>} True if password matches / True si la contraseña coincide
 * @example
 * const isValid = await verifyPassword('myPassword123', '$2b$10$hash...');
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * Genera un token JWT para un usuario
 * @param {UserAttributes} user - User object / Objeto de usuario
 * @returns {string} JWT token / Token JWT
 * @example
 * const token = generateToken({ id: '123', email: 'user@example.com' });
 */
export function generateToken(user: UserAttributes): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: (user as any).role || 'user',
  };
  
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '7d',
  } as SignOptions);
}

/**
 * Verify and decode a JWT token
 * Verifica y decodifica un token JWT
 * @param {string} token - JWT token to verify / Token JWT a verificar
 * @returns {JwtPayload} Decoded payload / Payload decodificado
 * @throws {Error} If token is invalid or expired / Si el token es inválido o expirado
 * @example
 * const payload = verifyToken('eyJhbGciOiJIUzI1NiJ9...');
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * Extract token from Authorization header
 * Extrae el token del header de Authorization
 * @param {string | undefined} authHeader - Authorization header value / Valor del header
 * @returns {string | null} Token without 'Bearer ' prefix or null / Token sin prefijo 'Bearer ' o null
 * @example
 * const token = extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiJ9...');
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
