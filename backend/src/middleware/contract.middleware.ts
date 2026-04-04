/**
 * @fileoverview Contract Middleware - Contract acceptance verification
 * @description Middleware to verify user has accepted required contracts before accessing gated routes
 * @module middleware/contract
 * @author MLM Development Team
 */

import { Request, Response, NextFunction } from 'express';
import { ContractService } from '../services/ContractService';
import type { ContractType } from '../types';

const contractService = new ContractService();

/**
 * Require that user has accepted all specified contracts
 * Requiere que el usuario haya aceptado todos los contratos especificados
 *
 * @param {ContractType[]} contractTypes - Array of required contract types
 * @returns {Function} Express middleware function
 *
 * @example
 * // English: Require affiliate and compensation plan acceptance
 * router.get('/api/commissions', requireAuth, requireContractAccepted(['AFFILIATE_AGREEMENT', 'COMPENSATION_PLAN']), getCommissions);
 *
 * // Español: Requerir aceptación de acuerdo de afiliado y plan de compensación
 * router.get('/api/commissions', requireAuth, requireContractAccepted(['AFFILIATE_AGREEMENT', 'COMPENSATION_PLAN']), getCommissions);
 */
export function requireContractAccepted(contractTypes: ContractType[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Check if user has accepted all required contracts
      const hasAccepted = await contractService.hasAcceptedRequiredContracts(userId, contractTypes);

      if (!hasAccepted) {
        // Get pending contracts for response
        const pendingContracts = await contractService.getPendingContracts(userId);
        const pending = pendingContracts
          .filter((c) => contractTypes.includes(c.type))
          .map((c) => ({
            type: c.type,
            title: c.title,
            version: c.version,
          }));

        res.status(403).json({
          success: false,
          error: {
            code: 'CONTRACT_REQUIRED',
            message: 'You must accept the required contracts',
            pending,
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error in requireContractAccepted middleware:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error verifying contract acceptance',
        },
      });
    }
  };
}
