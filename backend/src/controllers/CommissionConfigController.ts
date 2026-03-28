/**
 * @fileoverview CommissionConfigController - Admin endpoints for commission configuration
 * @description CRUD operations for commission rate configurations by business type
 *              Operaciones CRUD para configuraciones de tasas de comisión por tipo de negocio
 * @module controllers/CommissionConfigController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { CommissionConfig } from '../models';
import {
  BUSINESS_TYPES,
  COMMISSION_LEVELS,
  type BusinessType,
  type CommissionLevel,
} from '../types';
import type { ApiResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Get all commission configurations
 * Obtener todas las configuraciones de comisiones
 */
export async function getAllConfigs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const configs = await CommissionConfig.findAll({
      order: [
        ['businessType', 'ASC'],
        ['level', 'ASC'],
      ],
    });

    const response: ApiResponse<typeof configs> = {
      success: true,
      data: configs,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GET_CONFIGS_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Get commission config by ID
 * Obtener configuración por ID
 */
export async function getConfigById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const config = await CommissionConfig.findByPk(id);

    if (!config) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Commission configuration not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GET_CONFIG_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Create new commission configuration
 * Crear nueva configuración de comisión
 */
export async function createConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { businessType, customBusinessName, level, percentage, isActive } = req.body;

    // Validate businessType
    if (!businessType || !Object.values(BUSINESS_TYPES).includes(businessType)) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_BUSINESS_TYPE',
          message:
            'Invalid business type. Must be: suscripcion, producto, membresia, servicio, or otro',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate level
    if (!level || !Object.values(COMMISSION_LEVELS).includes(level)) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_LEVEL',
          message: 'Invalid level. Must be: direct, level_1, level_2, level_3, or level_4',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate percentage
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 1) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_PERCENTAGE',
          message: 'Percentage must be a number between 0 and 1',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if config already exists for this businessType + level
    const existing = await CommissionConfig.findOne({
      where: { businessType, level },
    });

    if (existing) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'CONFIG_EXISTS',
          message: `Configuration already exists for ${businessType} - ${level}. Use PUT to update.`,
        },
      };
      res.status(409).json(response);
      return;
    }

    // Create config
    const config = await CommissionConfig.create({
      businessType,
      customBusinessName: businessType === BUSINESS_TYPES.OTRO ? customBusinessName : null,
      level,
      percentage,
      isActive: isActive ?? true,
    });

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'CREATE_CONFIG_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Update commission configuration
 * Actualizar configuración de comisión
 */
export async function updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { customBusinessName, percentage, isActive } = req.body;

    const config = await CommissionConfig.findByPk(id);

    if (!config) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Commission configuration not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate percentage if provided
    if (percentage !== undefined) {
      if (typeof percentage !== 'number' || percentage < 0 || percentage > 1) {
        const response: ApiResponse<never> = {
          success: false,
          error: {
            code: 'INVALID_PERCENTAGE',
            message: 'Percentage must be a number between 0 and 1',
          },
        };
        res.status(400).json(response);
        return;
      }
      config.percentage = percentage;
    }

    // Update optional fields
    if (customBusinessName !== undefined) {
      config.customBusinessName = customBusinessName;
    }
    if (isActive !== undefined) {
      config.isActive = isActive;
    }

    await config.save();

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'UPDATE_CONFIG_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Delete commission configuration
 * Eliminar configuración de comisión
 */
export async function deleteConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const config = await CommissionConfig.findByPk(id);

    if (!config) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Commission configuration not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    await config.destroy();

    const response: ApiResponse<never> = {
      success: true,
      data: null,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'DELETE_CONFIG_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Get active commission rates for a specific business type
 * Obtener tasas de comisión activas para un tipo de negocio específico
 */
export async function getActiveRates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { businessType } = req.params;

    if (!businessType || !Object.values(BUSINESS_TYPES).includes(businessType)) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_BUSINESS_TYPE',
          message: 'Invalid business type',
        },
      };
      res.status(400).json(response);
      return;
    }

    const configs = await CommissionConfig.findAll({
      where: { businessType, isActive: true },
    });

    // Convert to rates object
    const rates: Record<string, number> = {};
    for (const config of configs) {
      rates[config.level] = config.percentage;
    }

    // Fill missing levels with defaults from COMMISSION_RATES
    const { COMMISSION_RATES } = await import('../types');
    for (const [key, value] of Object.entries(COMMISSION_RATES)) {
      if (rates[key] === undefined) {
        rates[key] = value;
      }
    }

    const response: ApiResponse<typeof rates> = {
      success: true,
      data: rates,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GET_RATES_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}
