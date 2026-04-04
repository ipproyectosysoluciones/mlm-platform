/**
 * @fileoverview AdminContractController - Admin contract management endpoints
 * @description Handles admin CRUD operations for contract templates
 * @module controllers/AdminContractController
 * @author MLM Development Team
 */

import { Request, Response } from 'express';
import {
  ContractService,
  CreateTemplateData,
  UpdateTemplateData,
} from '../services/ContractService';
import { requireAdmin } from '../middleware/auth.middleware';
import type { ContractType } from '../types';

const contractService = new ContractService();

/**
 * @swagger
 * /api/admin/contracts:
 *   get:
 *     summary: Get all contract templates
 *     description: Returns all contract templates (admin)
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all contract templates
 */
export async function getTemplates(req: Request, res: Response): Promise<void> {
  try {
    const contracts = await contractService.getTemplates();

    res.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching templates',
      },
    });
  }
}

/**
 * @swagger
 * /api/admin/contracts:
 *   post:
 *     summary: Create a new contract template
 *     description: Creates a new contract template (creates new version)
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
 *         description: Contract template created
 */
export async function createTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { type, version, title, content, effectiveFrom } = req.body;

    const data: CreateTemplateData = {
      type,
      version,
      title,
      content,
      effectiveFrom: new Date(effectiveFrom),
    };

    const template = await contractService.createTemplate(data);

    res.status(201).json({
      success: true,
      message: 'Contract template created',
      data: template,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating template',
      },
    });
  }
}

/**
 * @swagger
 * /api/admin/contracts/{id}:
 *   put:
 *     summary: Update a contract template
 *     description: Updates a template by creating a NEW version (does not modify existing)
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract template ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               effectiveFrom:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: New contract version created
 */
export async function updateTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, content, effectiveFrom } = req.body;

    const data: UpdateTemplateData = {
      title,
      content,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
    };

    const template = await contractService.updateTemplate(id, data);

    res.json({
      success: true,
      message: 'New contract version created',
      data: template,
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

    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating template',
      },
    });
  }
}

/**
 * @swagger
 * /api/admin/contracts/users/{userId}:
 *   get:
 *     summary: Get all contract acceptances for a user
 *     description: Returns all contracts with acceptance status for a specific user
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User's contract acceptances
 */
export async function getUserContracts(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const contracts = await contractService.getUserContracts(userId);

    res.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('Error fetching user contracts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching user contracts',
      },
    });
  }
}

/**
 * @swagger
 * /api/admin/contracts/{id}/revoke/{userId}:
 *   post:
 *     summary: Revoke a user's contract acceptance
 *     description: Revokes a user's accepted contract
 *     tags: [admin/contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract template ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Contract revoked successfully
 */
export async function revokeUserContract(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.userId;

    const result = await contractService.revokeContract(userId, adminId);

    res.json({
      success: true,
      message: 'Contract revoked successfully',
      data: result,
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

    console.error('Error revoking contract:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error revoking contract',
      },
    });
  }
}

// Apply admin middleware to all routes
export default [
  requireAdmin,
  getTemplates,
  createTemplate,
  updateTemplate,
  getUserContracts,
  revokeUserContract,
];
