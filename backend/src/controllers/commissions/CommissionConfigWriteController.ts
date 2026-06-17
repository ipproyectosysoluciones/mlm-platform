/**
 * @fileoverview CommissionConfigWriteController - Write operations for commission configurations
 * @description POST/PUT/DELETE endpoints for commission configuration management
 *              Endpoints POST/PUT/DELETE para gestión de configuraciones de comisión
 * @module controllers/commissions/CommissionConfigWriteController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { CommissionConfig } from '../../models';
import { BUSINESS_TYPES } from '../../types';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Create new commission configuration
 * Crear nueva configuración de comisión
 */
export async function createConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { businessType, customBusinessName, level, percentage, isActive } = req.body;

    // Validate businessType
    if (!businessType || !(Object.values(BUSINESS_TYPES) as string[]).includes(businessType)) {
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

    // Validate level — must match 'direct' or 'level_N' pattern (N ≥ 1)
    // Validar nivel — debe coincidir con patrón 'direct' o 'level_N' (N ≥ 1)
    if (!level || !/^(direct|level_\d+)$/.test(level)) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_LEVEL',
          message: 'Invalid level. Must be "direct" or "level_N" (e.g. level_1, level_5, level_10)',
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
