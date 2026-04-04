/**
 * @fileoverview ShippingAddressController - HTTP controller for shipping addresses
 * @description Express controller for shipping address CRUD operations.
 *             Controlador Express para operaciones CRUD de direcciones de envío.
 * @module controllers/ShippingAddressController
 * @author MLM Development Team
 */
import { Request, Response, NextFunction } from 'express';
import {
  ShippingAddressService,
  CreateAddressData,
  UpdateAddressData,
} from '../services/ShippingAddressService';
import { ApiResponse } from '../types';

const shippingAddressService = new ShippingAddressService();

/**
 * Create a new shipping address
 * POST /api/addresses
 */
export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const data: CreateAddressData = {
      label: req.body.label,
      recipientName: req.body.recipientName,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
      phone: req.body.phone,
      isDefault: req.body.isDefault,
      instructions: req.body.instructions,
    };

    const address = await shippingAddressService.create(userId, data);

    const response: ApiResponse<typeof address> = {
      success: true,
      data: address,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all shipping addresses for the authenticated user
 * GET /api/addresses
 */
export async function getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const addresses = await shippingAddressService.findAllByUser(userId);

    const response: ApiResponse<typeof addresses> = {
      success: true,
      data: addresses,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific shipping address by ID
 * GET /api/addresses/:id
 */
export async function getAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const address = await shippingAddressService.findById(id, userId);

    const response: ApiResponse<typeof address> = {
      success: true,
      data: address,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a shipping address
 * PUT /api/addresses/:id
 */
export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const data: UpdateAddressData = {
      label: req.body.label,
      recipientName: req.body.recipientName,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
      phone: req.body.phone,
      isDefault: req.body.isDefault,
      instructions: req.body.instructions,
    };

    const address = await shippingAddressService.update(id, userId, data);

    const response: ApiResponse<typeof address> = {
      success: true,
      data: address,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a shipping address
 * DELETE /api/addresses/:id
 */
export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await shippingAddressService.delete(id, userId);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Set an address as default
 * PUT /api/addresses/:id/default
 */
export async function setDefaultAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const address = await shippingAddressService.setDefault(id, userId);

    const response: ApiResponse<typeof address> = {
      success: true,
      data: address,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}
