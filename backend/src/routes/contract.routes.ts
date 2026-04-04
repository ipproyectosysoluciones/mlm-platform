/**
 * @fileoverview Contract Routes - User contract endpoints
 * @description User routes for viewing and accepting/declining contracts
 * @module routes/contract.routes
 * @author MLM Development Team
 */

import { Router } from 'express';
import {
  getContracts,
  getContract,
  acceptContract,
  declineContract,
} from '../controllers/ContractController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /contracts:
 *   get:
 *     summary: Get all active contracts
 *     description: Get all active contract templates with user's acceptance status
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contracts
 */
router.get('/', authenticate, getContracts);

/**
 * @swagger
 * /contracts/{id}:
 *   get:
 *     summary: Get specific contract
 *     description: Get a contract template by ID
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract details
 */
router.get('/:id', authenticate, getContract);

/**
 * @swagger
 * /contracts/{id}/accept:
 *   post:
 *     summary: Accept a contract
 *     description: Accept a contract, recording acceptance metadata
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract accepted
 */
router.post('/:id/accept', authenticate, acceptContract);

/**
 * @swagger
 * /contracts/{id}/decline:
 *   post:
 *     summary: Decline a contract
 *     description: Decline a contract
 *     tags: [contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract declined
 */
router.post('/:id/decline', authenticate, declineContract);

export default router;
