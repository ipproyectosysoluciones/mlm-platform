/**
 * @fileoverview TwoFactorController - Two-Factor Authentication controller
 * @description Endpoints for 2FA setup, verification, and management
 *             Endpoints para configuración 2FA, verificación y gestión
 * @module controllers/TwoFactorController
 * @author MLM Development Team
 *
 * @example
 * // English: Import 2FA controller functions
 * import { setup2FA, verifySetup, verify2FA, disable2FA, get2FAStatus } from '../controllers/TwoFactorController.js';
 *
 * // Español: Importar funciones del controlador 2FA
 * import { setup2FA, verifySetup, verify2FA, disable2FA, get2FAStatus } from '../controllers/TwoFactorController.js';
 */

// Re-export from sub-controllers for backward compatibility
export { get2FAStatus } from './twofactor/TwoFactorStatusController.js';
export { setup2FA } from './twofactor/TwoFactorSetupController.js';
export {
  verifySetup,
  verify2FA,
  verifySetupValidation,
  verify2FAValidation,
} from './twofactor/TwoFactorVerificationController.js';
export { disable2FA, disable2FAValidation } from './twofactor/TwoFactorDisableController.js';
