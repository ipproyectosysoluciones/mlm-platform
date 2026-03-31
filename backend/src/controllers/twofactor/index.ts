/**
 * @fileoverview TwoFactor sub-controllers barrel export
 * @description Barrel export for twofactor sub-controllers
 * @module controllers/twofactor
 *
 * @example
 * // English: Import from sub-controllers
 * import { get2FAStatus, setup2FA, verifySetup, verify2FA, disable2FA } from '../controllers/twofactor';
 *
 * // Español: Importar desde sub-controladores
 * import { get2FAStatus, setup2FA, verifySetup, verify2FA, disable2FA } from '../controllers/twofactor';
 */

// Status controller
export { get2FAStatus } from './TwoFactorStatusController';

// Setup controller
export { setup2FA, getPendingSetups } from './TwoFactorSetupController';

// Verification controller
export {
  verifySetup,
  verify2FA,
  verifySetupValidation,
  verify2FAValidation,
} from './TwoFactorVerificationController';

// Disable controller
export { disable2FA, disable2FAValidation } from './TwoFactorDisableController';
