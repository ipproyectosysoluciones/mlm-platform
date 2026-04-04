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
import { requireAdmin, authenticate } from '../middleware/auth.middleware';

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
router.get('/', authenticate, requireAdmin, getTemplates);

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
router.post('/', authenticate, requireAdmin, createTemplate);

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
router.put('/:id', authenticate, requireAdmin, updateTemplate);
router.get('/users/:userId', authenticate, requireAdmin, getUserContracts);
router.post('/:id/revoke/:userId', authenticate, requireAdmin, revokeUserContract);

export default router;
