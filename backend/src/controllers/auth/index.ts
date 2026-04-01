/**
 * @fileoverview Auth Controllers - Barrel export for authentication controllers
 * @description Re-exports all authentication controller functions
 * @module controllers/auth
 *
 * @example
 * import { register, login, me, registerValidation, loginValidation } from '../controllers/auth';
 */
export { register, registerValidation } from './register.controller';
export { login, loginValidation } from './login.controller';
export { me } from './profile.controller';
