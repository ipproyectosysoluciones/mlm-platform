/**
 * @fileoverview ContractController - User contract management endpoints
 * @description Handles user contract viewing and acceptance/declination
 * @module controllers/ContractController
 * @author MLM Development Team
 */

import { Request, Response } from 'express';
import { ContractService } from '../services/ContractService';
import { type AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const contractService = new ContractService();

/**
 * @swagger
 * /contracts:
 *   get:
 *     summary: Get all active contracts with user's acceptance status
 *     description: Returns all active contract templates with the user's acceptance status
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contracts with user status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 */
/**
 * @description Get all active contracts with the user's acceptance status
 * @description_es Obtiene todos los contratos activos con el estado de aceptación del usuario
 * @param {AuthenticatedRequest} req - Authenticated Express request / Request autenticado de Express
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON list of contracts / Lista JSON de contratos
 */
export async function getContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const contracts = await contractService.getTemplates(userId);

    res.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching contracts');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching contracts',
      },
    });
  }
}

/**
 * @swagger
 * /contracts/{id}:
 *   get:
 *     summary: Get a specific contract template
 *     description: Returns a contract template by ID
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract template ID
 *     responses:
 *       200:
 *         description: Contract template details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 */
/**
 * @description Get a specific contract template by ID
 * @description_es Obtiene una plantilla de contrato específica por ID
 * @param {Request} req - Express request with `id` param / Request de Express con parámetro `id`
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON contract template / Plantilla de contrato en JSON
 */
export async function getContract(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const contract = await contractService.getTemplate(id);

    res.json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      res.status(404).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    logger.error({ err: error }, 'Error fetching contract');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching contract',
      },
    });
  }
}

/**
 * @swagger
 * /contracts/{id}/accept:
 *   post:
 *     summary: Accept a contract
 *     description: Accepts a contract, recording IP, userAgent, and content hash
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract template ID
 *     responses:
 *       200:
 *         description: Contract accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Contract already accepted
 */
/**
 * @description Accept a contract, recording IP, userAgent, and content hash for legal compliance
 * @description_es Acepta un contrato registrando IP, userAgent y hash del contenido para cumplimiento legal
 * @param {AuthenticatedRequest} req - Authenticated Express request with `id` param / Request autenticado con parámetro `id`
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON acceptance record / Registro de aceptación en JSON
 */
export async function acceptContract(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const acceptance = await contractService.acceptContract(userId, id, req);

    res.json({
      success: true,
      message: 'Contract accepted successfully',
      data: acceptance,
    });
  } catch (error: any) {
    if (error.statusCode === 400) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    if (error.statusCode === 404) {
      res.status(404).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    logger.error({ err: error }, 'Error accepting contract');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error accepting contract',
      },
    });
  }
}

/**
 * @swagger
 * /contracts/{id}/decline:
 *   post:
 *     summary: Decline a contract
 *     description: Declines a contract
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract template ID
 *     responses:
 *       200:
 *         description: Contract declined successfully
 */
/**
 * @description Decline a contract, recording the user's decision
 * @description_es Rechaza un contrato registrando la decisión del usuario
 * @param {AuthenticatedRequest} req - Authenticated Express request with `id` param / Request autenticado con parámetro `id`
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON declination record / Registro de rechazo en JSON
 */
export async function declineContract(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const decline = await contractService.declineContract(userId, id, req);

    res.json({
      success: true,
      message: 'Contract declined',
      data: decline,
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      res.status(404).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    logger.error({ err: error }, 'Error declining contract');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error declining contract',
      },
    });
  }
}

// Apply auth middleware to all routes (authenticate is applied per-route in contract.routes.ts)
