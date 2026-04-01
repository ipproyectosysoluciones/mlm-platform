/**
 * @fileoverview TwoFactor Controllers - Barrel export for 2FA controllers
 * @description Re-exports all TwoFactor controller functions
 * @module controllers/twoFactor
 */
export { get2FAStatus, setup2FA, verifySetup, setup2FAValidation } from './enable.controller';

export {
  verify2FA,
  disable2FA,
  verify2FAValidation,
  disable2FAValidation,
} from './verify.controller';
