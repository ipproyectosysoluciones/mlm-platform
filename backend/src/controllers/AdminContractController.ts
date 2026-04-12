/**
 * @fileoverview AdminContractController - Admin contract management endpoints
 * @description Handles admin CRUD operations for contract templates
 * @module controllers/AdminContractController
 * @author MLM Development Team
 */

import { Response } from 'express';
import {
  ContractService,
  CreateTemplateData,
  UpdateTemplateData,
} from '../services/ContractService';
import { requireAdmin, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { hasStatusCode, getErrorMessage } from '../utils/HttpError.js';

const contractService = new ContractService();

/**
 * @swagger
 * /admin/contracts:
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
/**
 * @description Get all contract templates including inactive ones (admin only)
 * @description_es Obtiene todas las plantillas de contrato incluyendo las inactivas (solo admin)
 * @param {AuthenticatedRequest} req - Authenticated admin request / Request autenticado de admin
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON list of all templates / Lista JSON de todas las plantillas
 */
export async function getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const contracts = await contractService.getTemplates();

    res.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching templates');
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
 * /admin/contracts:
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
/**
 * @description Create a new contract template with versioning support
 * @description_es Crea una nueva plantilla de contrato con soporte de versionado
 * @param {AuthenticatedRequest} req - Authenticated admin request with body `{type, version, title, content, effectiveFrom}` / Request autenticado de admin con body `{type, version, title, content, effectiveFrom}`
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON created template / Plantilla creada en JSON
 */
export async function createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    logger.error({ err: error }, 'Error creating template');
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
 * /admin/contracts/{id}:
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
/**
 * @description Update a contract template by creating a new version (immutable history)
 * @description_es Actualiza una plantilla creando una nueva versión (historial inmutable)
 * @param {AuthenticatedRequest} req - Authenticated admin request with `id` param and optional body `{title, content, effectiveFrom}` / Request autenticado con parámetro `id` y body opcional
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON new template version / Nueva versión de plantilla en JSON
 */
export async function updateTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
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
  } catch (error: unknown) {
    if (hasStatusCode(error) && error.statusCode === 404) {
      res.status(404).json({
        success: false,
        error: {
          code: error.code || error.name,
          message: error.message,
        },
      });
      return;
    }

    logger.error({ err: error }, 'Error updating template');
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
 * /admin/contracts/users/{userId}:
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
/**
 * @description Get all contract acceptances for a specific user (admin view)
 * @description_es Obtiene todos los contratos aceptados/rechazados de un usuario específico (vista admin)
 * @param {AuthenticatedRequest} req - Authenticated admin request with `userId` param / Request autenticado con parámetro `userId`
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON list of user contracts / Lista JSON de contratos del usuario
 */
export async function getUserContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const contracts = await contractService.getUserContracts(userId);

    res.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user contracts');
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
 * /admin/contracts/{id}/revoke/{userId}:
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
/**
 * @description Revoke a user's contract acceptance (admin action with audit trail)
 * @description_es Revoca la aceptación de contrato de un usuario (acción admin con registro de auditoría)
 * @param {AuthenticatedRequest} req - Authenticated admin request with `id` (templateId) and `userId` params / Request autenticado con parámetros `id` (templateId) y `userId`
 * @param {Response} res - Express response / Respuesta de Express
 * @returns {Promise<void>} JSON revocation result / Resultado de revocación en JSON
 */
export async function revokeUserContract(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id: templateId, userId } = req.params;
    const adminId = req.user!.id;

    const result = await contractService.revokeContract(userId, adminId, templateId);

    res.json({
      success: true,
      message: 'Contract revoked successfully',
      data: result,
    });
  } catch (error: unknown) {
    if (hasStatusCode(error) && error.statusCode === 404) {
      res.status(404).json({
        success: false,
        error: {
          code: error.code || error.name,
          message: error.message,
        },
      });
      return;
    }

    logger.error({ err: error }, 'Error revoking contract');
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
