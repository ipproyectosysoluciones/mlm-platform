/**
 * @fileoverview Admin Contract Routes - Admin contract management endpoints
 * @description Admin routes for CRUD operations on contract templates
 * @module routes/admin-contract.routes
 * @author MLM Development Team
 */

import { Router } from 'express';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  getUserContracts,
  revokeUserContract,
} from '../controllers/AdminContractController';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /admin/contracts:
 *   get:
 *     summary: Get all contract templates
 *     description: Get all contract templates (admin)
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all templates
 */
router.get('/', requireAdmin, getTemplates);

/**
 * @swagger
 * /admin/contracts:
 *   post:
 *     summary: Create contract template
 *     description: Create a new contract template version
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - version
 *               - title
 *               - content
 *               - effectiveFrom
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [AFFILIATE_AGREEMENT, COMPENSATION_PLAN, PRIVACY_POLICY, TERMS_OF_SERVICE]
 *               version:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               effectiveFrom:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Template created
 */
router.post('/', requireAdmin, createTemplate);

/**
 * @swagger
 * /admin/contracts/{id}:
 *   put:
 *     summary: Update contract template
 *     description: Update a template by creating a new version
 *     tags: [admin/contracts]
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
 *         description: New version created
 */
router.put('/:id', requireAdmin, updateTemplate);

/**
 * @swagger
 * /admin/contracts/users/{userId}:
 *   get:
 *     summary: Get user's contracts
 *     description: Get all contract acceptances for a user
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User contracts
 */
router.get('/users/:userId', requireAdmin, getUserContracts);

/**
 * @swagger
 * /admin/contracts/{id}/revoke/{userId}:
 *   post:
 *     summary: Revoke user's contract
 *     description: Revoke a user's contract acceptance
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract revoked
 */
router.post('/:id/revoke/:userId', requireAdmin, revokeUserContract);

export default router;
