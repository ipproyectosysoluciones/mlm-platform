/**
 * Feature guard middleware — returns 503 when a feature flag is disabled.
 * Middleware de feature guard — retorna 503 cuando un feature flag está deshabilitado.
 *
 * @module middleware/featureGuard
 */
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Creates a middleware that returns 503 if a feature is disabled.
 * Crea un middleware que retorna 503 si una funcionalidad está deshabilitada.
 *
 * @param featureName - Key from config.features to check / Clave de config.features a verificar
 * @returns Express middleware / Middleware de Express
 *
 * @example
 * // English: Guard wallet routes
 * router.use('/wallet', featureGuard('cryptoWallet'), walletRoutes);
 *
 * // Español: Proteger rutas de wallet
 * router.use('/wallet', featureGuard('cryptoWallet'), walletRoutes);
 */
export function featureGuard(featureName: keyof typeof config.features) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!config.features[featureName]) {
      res.status(503).json({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: `The ${featureName} feature is temporarily disabled`,
        },
      });
      return;
    }
    next();
  };
}
