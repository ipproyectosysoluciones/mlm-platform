/**
 * @fileoverview ContractService - Contract template and acceptance management
 * @description Handles contract template CRUD, user acceptance tracking, and version management
 *             for legal compliance in MLM platform.
 * @module services/ContractService
 * @author MLM Development Team
 */

import { ContractTemplate, AffiliateContract } from '../models';
import { AppError } from '../middleware/error.middleware';
import { generateUUID } from '../utils/codeGenerator';
import type {
  ContractTemplateAttributes,
  AffiliateContractAttributes,
  ContractType,
  ContractStatus,
} from '../types';
import { sequelize } from '../config/database';
import type { Request } from 'express';

export interface CreateTemplateData {
  type: ContractType;
  version: string;
  title: string;
  content: string;
  effectiveFrom: Date;
}

export interface UpdateTemplateData {
  title?: string;
  content?: string;
  effectiveFrom?: Date;
}

export interface AcceptContractData {
  userId: string;
  templateId: string;
  ipAddress: string;
  userAgent?: string;
}

export interface UserContractInfo {
  id: string;
  type: ContractType;
  version: string;
  title: string;
  content: string;
  effectiveFrom: Date;
  status: ContractStatus | null;
  signedAt: Date | null;
  contentHash: string;
}

/**
 * ContractService - Manages contract templates and user acceptances
 * ContractService - Gestiona templates de contratos y aceptaciones de usuarios
 */
export class ContractService {
  /**
   * Create a new contract template
   * Creates a NEW version, marks previous version for same type as effectiveTo=NOW
   *
   * Crear un nuevo template de contrato
   * Crea una NUEVA versión, marca la versión anterior del mismo tipo como effectiveTo=NOW
   *
   * @param {Object} data - Template creation data / Datos de creación del template
   * @returns {Promise<ContractTemplate>} Created template / Template creado
   *
   * @example
   * const template = await contractService.createTemplate({
   *   type: 'AFFILIATE_AGREEMENT',
   *   version: '1.0.0',
   *   title: 'Affiliate Agreement',
   *   content: '<h1>Affiliate Agreement</h1>...',
   *   effectiveFrom: new Date()
   * });
   */
  async createTemplate(data: CreateTemplateData): Promise<ContractTemplateAttributes> {
    const contentHash = ContractTemplate.computeContentHash(data.content);

    // In a transaction, mark previous active version as ineffective
    const template = await sequelize.transaction(async (transaction) => {
      // Find and update previous active version for this type
      const previousVersion = await ContractTemplate.findOne({
        where: {
          type: data.type,
          isActive: true,
        },
        transaction,
      });

      if (previousVersion) {
        await previousVersion.update(
          {
            effectiveTo: new Date(),
            isActive: false,
          },
          { transaction }
        );
      }

      // Create new template version
      const newTemplate = await ContractTemplate.create(
        {
          id: generateUUID(),
          type: data.type,
          version: data.version,
          title: data.title,
          content: data.content,
          contentHash,
          effectiveFrom: data.effectiveFrom,
          effectiveTo: null,
          isActive: true,
        },
        { transaction }
      );

      return newTemplate;
    });

    return template;
  }

  /**
   * Get all active templates, optionally with user's acceptance status
   * Obtener todos los templates activos, opcionalmente con estado de aceptación del usuario
   *
   * @param {string} [userId] - User ID to get acceptance status / ID de usuario para estado de aceptación
   * @returns {Promise<UserContractInfo[]>} Active templates with user status / Templates activos con estado del usuario
   */
  async getTemplates(userId?: string): Promise<UserContractInfo[]> {
    const templates = await ContractTemplate.findAll({
      where: { isActive: true },
      order: [
        ['type', 'ASC'],
        ['effective_from', 'DESC'],
      ],
    });

    // Get latest version per type
    const latestByType = new Map<ContractType, ContractTemplateAttributes>();
    for (const template of templates) {
      const existing = latestByType.get(template.type);
      if (!existing || template.effectiveFrom > existing.effectiveFrom) {
        latestByType.set(template.type, template);
      }
    }

    // Get user acceptances if userId provided
    const userAcceptances: Map<string, AffiliateContractAttributes> = new Map();
    if (userId) {
      const acceptances = await AffiliateContract.findAll({
        where: { userId },
      });
      for (const acc of acceptances) {
        userAcceptances.set(acc.templateId, acc);
      }
    }

    // Build response with status
    const result: UserContractInfo[] = [];
    for (const [, template] of latestByType) {
      const acceptance = userAcceptances.get(template.id);
      result.push({
        id: template.id,
        type: template.type,
        version: template.version,
        title: template.title,
        content: template.content,
        effectiveFrom: template.effectiveFrom,
        status: acceptance?.status || null,
        signedAt: acceptance?.signedAt || null,
        contentHash: template.contentHash,
      });
    }

    return result;
  }

  /**
   * Get a specific template by ID
   * Obtener un template específico por ID
   *
   * @param {string} id - Template ID / ID del template
   * @returns {Promise<ContractTemplate>} Template / Template
   * @throws {AppError} 404 if template not found / Si el template no se encuentra
   */
  async getTemplate(id: string): Promise<ContractTemplateAttributes> {
    const template = await ContractTemplate.findByPk(id);

    if (!template) {
      throw new AppError(404, 'CONTRACT_NOT_FOUND', 'Contract template not found');
    }

    return template;
  }

  /**
   * Update a template by creating a NEW version
   * Does NOT modify existing template, creates new version instead
   *
   * Actualizar un template creando una NUEVA versión
   * NO modifica el template existente, crea una nueva versión
   *
   * @param {string} id - Original template ID / ID del template original
   * @param {Object} data - Update data / Datos de actualización
   * @returns {Promise<ContractTemplate>} New template version / Nueva versión del template
   * @throws {AppError} 404 if template not found / Si el template no se encuentra
   */
  async updateTemplate(id: string, data: UpdateTemplateData): Promise<ContractTemplateAttributes> {
    const originalTemplate = await ContractTemplate.findByPk(id);

    if (!originalTemplate) {
      throw new AppError(404, 'CONTRACT_NOT_FOUND', 'Contract template not found');
    }

    // Parse version and increment
    const versionParts = originalTemplate.version.split('.');
    const major = parseInt(versionParts[0]) || 1;
    const minor = parseInt(versionParts[1]) || 0;
    const patch = parseInt(versionParts[2]) || 0;
    const newVersion = `${major}.${minor}.${patch + 1}`;

    // Create new version with updated data
    const newContent = data.content ?? originalTemplate.content;

    const newTemplate = await this.createTemplate({
      type: originalTemplate.type,
      version: newVersion,
      title: data.title ?? originalTemplate.title,
      content: newContent,
      effectiveFrom: data.effectiveFrom ?? new Date(),
    });

    return newTemplate;
  }

  /**
   * Accept a contract
   * Creates AffiliateContract with status=ACCEPTED, saves IP, userAgent, contentHash
   *
   * Aceptar un contrato
   * Crea AffiliateContract con status=ACCEPTED, guarda IP, userAgent, contentHash
   *
   * @param {string} userId - User ID / ID del usuario
   * @param {string} templateId - Template ID / ID del template
   * @param {Object} req - Express request for IP and userAgent / Request de Express para IP y userAgent
   * @returns {Promise<AffiliateContract>} Acceptance record / Registro de aceptación
   * @throws {AppError} 400 if contract already accepted / Si el contrato ya fue aceptado
   */
  async acceptContract(
    userId: string,
    templateId: string,
    req: Request
  ): Promise<AffiliateContractAttributes> {
    // Get template to compute hash at acceptance time
    const template = await this.getTemplate(templateId);

    // Check if user already accepted this specific contract version
    const existing = await AffiliateContract.findOne({
      where: {
        userId,
        templateId,
      },
    });

    if (existing && existing.status === 'ACCEPTED') {
      throw new AppError(
        400,
        'CONTRACT_ALREADY_ACCEPTED',
        'You have already accepted this contract'
      );
    }

    // Hash the content AS-IS at acceptance time
    const contentHashAtAcceptance = ContractTemplate.computeContentHash(template.content);

    // Get IP address (handle proxies)
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '0.0.0.0';

    // Get user agent
    const userAgent = req.headers['user-agent'] || null;

    // Create/update acceptance record
    let acceptance: AffiliateContract;

    if (existing) {
      // Update existing record
      await existing.update({
        status: 'ACCEPTED',
        signedAt: new Date(),
        ipAddress,
        userAgent,
        contentHash: contentHashAtAcceptance,
      });
      acceptance = existing;
    } else {
      // Create new record
      acceptance = await AffiliateContract.create({
        id: generateUUID(),
        userId,
        templateId,
        status: 'ACCEPTED',
        signedAt: new Date(),
        ipAddress,
        userAgent,
        contentHash: contentHashAtAcceptance,
      });
    }

    return acceptance;
  }

  /**
   * Decline a contract
   * Creates AffiliateContract with status=DECLINED
   *
   * Rechazar un contrato
   * Crea AffiliateContract con status=DECLINED
   *
   * @param {string} userId - User ID / ID del usuario
   * @param {string} templateId - Template ID / ID del template
   * @param {Object} req - Express request for IP and userAgent / Request de Express para IP y userAgent
   * @returns {Promise<AffiliateContract>} Declination record / Registro de rechazo
   */
  async declineContract(
    userId: string,
    templateId: string,
    req: Request
  ): Promise<AffiliateContractAttributes> {
    // Validate template exists
    await this.getTemplate(templateId);

    // Check existing record
    const existing = await AffiliateContract.findOne({
      where: {
        userId,
        templateId,
      },
    });

    // Get IP and userAgent
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '0.0.0.0';
    const userAgent = req.headers['user-agent'] || null;
    const template = await this.getTemplate(templateId);
    const contentHash = ContractTemplate.computeContentHash(template.content);

    if (existing) {
      // Update existing record
      await existing.update({
        status: 'DECLINED',
        ipAddress,
        userAgent,
        contentHash,
      });
      return existing;
    }

    // Create new record
    const decline = await AffiliateContract.create({
      id: generateUUID(),
      userId,
      templateId,
      status: 'DECLINED',
      ipAddress,
      userAgent,
      contentHash,
    });

    return decline;
  }

  /**
   * Revoke a user's contract acceptance for a specific template
   * Revocar la aceptación de contrato de un usuario para un template específico
   *
   * @param {string} userId - User ID whose contract to revoke / ID del usuario cuyo contrato se revoca
   * @param {string} adminId - Admin user performing revocation / ID del admin que revoca
   * @param {string} templateId - Template ID to revoke / ID del template a revocar
   * @returns {Promise<AffiliateContract>} Updated record / Registro actualizado
   * @throws {AppError} 404 if no accepted contract found / Si no se encuentra contrato aceptado
   */
  async revokeContract(
    userId: string,
    adminId: string,
    templateId: string
  ): Promise<AffiliateContractAttributes> {
    const acceptance = await AffiliateContract.findOne({
      where: {
        userId,
        templateId,
        status: 'ACCEPTED',
      },
    });

    if (!acceptance) {
      throw new AppError(404, 'CONTRACT_NOT_ACCEPTED', 'No accepted contract found for this user');
    }

    await acceptance.update({
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy: adminId,
    });

    return acceptance;
  }

  /**
   * Get all contracts for a user with acceptance status
   * Obtener todos los contratos de un usuario con estado de aceptación
   *
   * @param {string} userId - User ID / ID del usuario
   * @returns {Promise<UserContractInfo[]>} User's contracts with status / Contratos del usuario con estado
   */
  async getUserContracts(userId: string): Promise<UserContractInfo[]> {
    const templates = await ContractTemplate.findAll({
      where: { isActive: true },
      order: [
        ['type', 'ASC'],
        ['effective_from', 'DESC'],
      ],
    });

    // Get latest version per type
    const latestByType = new Map<ContractType, ContractTemplateAttributes>();
    for (const template of templates) {
      const existing = latestByType.get(template.type);
      if (!existing || template.effectiveFrom > existing.effectiveFrom) {
        latestByType.set(template.type, template);
      }
    }

    // Get all user acceptances
    const acceptances = await AffiliateContract.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
    });

    // Build response
    const result: UserContractInfo[] = [];
    for (const [, template] of latestByType) {
      // Get user's latest acceptance for this template
      const latestAcceptance = acceptances.find((a) => a.templateId === template.id);

      result.push({
        id: template.id,
        type: template.type,
        version: template.version,
        title: template.title,
        content: template.content,
        effectiveFrom: template.effectiveFrom,
        status: latestAcceptance?.status || null,
        signedAt: latestAcceptance?.signedAt || null,
        contentHash: template.contentHash,
      });
    }

    return result;
  }

  /**
   * Check if user has accepted all required contracts
   * Verificar si el usuario ha aceptado todos los contratos requeridos
   *
   * @param {string} userId - User ID / ID del usuario
   * @param {ContractType[]} requiredTypes - Required contract types / Tipos de contrato requeridos
   * @returns {Promise<boolean>} True if all required contracts accepted / True si todos los contratos requeridos están aceptados
   */
  async hasAcceptedRequiredContracts(
    userId: string,
    requiredTypes: ContractType[]
  ): Promise<boolean> {
    const templates = await this.getTemplates(userId);

    for (const type of requiredTypes) {
      const template = templates.find((t) => t.type === type);
      if (!template || template.status !== 'ACCEPTED') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get pending contracts that user needs to accept
   * Obtener contratos pendientes que el usuario necesita aceptar
   *
   * @param {string} userId - User ID / ID del usuario
   * @returns {Promise<UserContractInfo[]>} Pending contracts / Contratos pendientes
   */
  async getPendingContracts(userId: string): Promise<UserContractInfo[]> {
    const userContracts = await this.getUserContracts(userId);
    return userContracts.filter(
      (c) => c.status === null || c.status === 'DECLINED' || c.status === 'REVOKED'
    );
  }
}
