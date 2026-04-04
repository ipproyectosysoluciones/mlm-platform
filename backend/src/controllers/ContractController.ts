/**
 * @fileoverview ContractController - User contract management endpoints
 * @description Handles user contract viewing and acceptance/declination
 * @module controllers/ContractController
 * @author MLM Development Team
 */

import { Request, Response } from 'express';
import { ContractService } from '../services/ContractService';
import { authenticate } from '../middleware/auth.middleware';
import type { ContractType } from '../types';

const contractService = new ContractService();

/**
 * @swagger
 * /api/contracts:
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
export async function getContracts(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const contracts = await contractService.getTemplates(userId);

    res.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
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
 * /api/contracts/{id}:
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

    console.error('Error fetching contract:', error);
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
 * /api/contracts/{id}/accept:
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
export async function acceptContract(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
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

    console.error('Error accepting contract:', error);
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
 * /api/contracts/{id}/decline:
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
export async function declineContract(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const decline = await contractService.declineContract(userId, id);

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

    console.error('Error declining contract:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error declining contract',
      },
    });
  }
}

// Apply auth middleware to all routes
export default [requireAuth, getContracts, getContract, acceptContract, declineContract];
