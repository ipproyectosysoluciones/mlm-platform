/**
 * @fileoverview CommissionConfigReadController - Read operations for commission configurations
 * @description GET endpoints for commission rates by business type
 *              Endpoints GET para tasas de comisión por tipo de negocio
 * @module controllers/commissions/CommissionConfigReadController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { CommissionConfig } from '../../models';
import { BUSINESS_TYPES, type BusinessType } from '../../types';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

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
 * Get active commission rates for a specific business type
 * Obtener tasas de comisión activas para un tipo de negocio específico
 */
export async function getActiveRates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { businessType } = req.params;

    if (!businessType || !(Object.values(BUSINESS_TYPES) as string[]).includes(businessType)) {
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
    const { COMMISSION_RATES } = await import('../../types');
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
