/**
 * @fileoverview VendorService - Vendor management for multi-vendor marketplace
 * @description Service for vendor registration, approval, dashboard, and payout management
 * @module services/VendorService
 * @author MLM Development Team
 *
 * @example
 * // English: Register as vendor
 * const vendor = await vendorService.register(userId, { businessName, contactEmail });
 *
 * // Español: Registrarse como vendedor
 * const vendor = await vendorService.register(idUsuario, { businessName, contactEmail });
 */
import { sequelize } from '../config/database';
import { Vendor, VendorPayout, Product, VendorOrder } from '../models';
import { AppError } from '../middleware/error.middleware';
import { Op } from 'sequelize';
import type {
  VendorAttributes,
  VendorCreationAttributes,
  VendorPayoutCreationAttributes,
} from '../types';

export class VendorService {
  /**
   * Register a new vendor
   * Registrar un nuevo vendedor
   *
   * @param userId - User UUID
   * @param data - Vendor registration data
   * @returns Created vendor
   */
  async register(
    userId: string,
    data: {
      businessName: string;
      contactEmail: string;
      contactPhone?: string;
      description?: string;
      address?: Record<string, unknown>;
    }
  ): Promise<Vendor> {
    // Check if user already has a vendor profile
    const existing = await Vendor.findOne({ where: { userId } });
    if (existing) {
      throw new AppError(400, 'VENDOR_EXISTS', 'User already has a vendor profile');
    }

    // Generate slug from business name
    const slug = this.generateSlug(data.businessName);

    // Check slug uniqueness
    const slugExists = await Vendor.findOne({ where: { slug } });
    if (slugExists) {
      throw new AppError(400, 'SLUG_EXISTS', 'Business name slug already exists');
    }

    // Create vendor
    const vendor = await Vendor.create({
      userId,
      businessName: data.businessName,
      slug,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      description: data.description || null,
      address: data.address || null,
      status: 'pending',
      commissionRate: 0.7, // Default 70%
    });

    return vendor;
  }

  /**
   * Approve a vendor
   * Aprobar un vendedor
   *
   * @param vendorId - Vendor UUID
   * @param adminId - Admin UUID who approved
   * @returns Updated vendor
   */
  async approve(vendorId: string, adminId: string): Promise<Vendor> {
    const vendor = await this.getById(vendorId);

    if (vendor.status !== 'pending') {
      throw new AppError(400, 'INVALID_STATUS', 'Only pending vendors can be approved');
    }

    vendor.status = 'approved';
    vendor.approvedAt = new Date();
    vendor.approvedBy = adminId;
    await vendor.save();

    return vendor;
  }

  /**
   * Reject a vendor
   * Rechazar un vendedor
   *
   * @param vendorId - Vendor UUID
   * @param reason - Rejection reason
   * @returns Updated vendor
   */
  async reject(vendorId: string, reason: string): Promise<Vendor> {
    const vendor = await this.getById(vendorId);

    if (vendor.status !== 'pending') {
      throw new AppError(400, 'INVALID_STATUS', 'Only pending vendors can be rejected');
    }

    vendor.status = 'rejected';
    vendor.metadata = {
      ...((vendor.metadata as Record<string, unknown>) || {}),
      rejectionReason: reason,
    };
    await vendor.save();

    return vendor;
  }

  /**
   * Suspend a vendor
   * Suspender un vendedor
   *
   * @param vendorId - Vendor UUID
   * @param reason - Suspension reason
   * @returns Updated vendor
   */
  async suspend(vendorId: string, reason: string): Promise<Vendor> {
    const vendor = await this.getById(vendorId);

    if (vendor.status !== 'approved') {
      throw new AppError(400, 'INVALID_STATUS', 'Only approved vendors can be suspended');
    }

    vendor.status = 'suspended';
    vendor.metadata = {
      ...((vendor.metadata as Record<string, unknown>) || {}),
      suspensionReason: reason,
    };
    await vendor.save();

    return vendor;
  }

  /**
   * Get vendor by user ID
   * Obtener vendedor por ID de usuario
   *
   * @param userId - User UUID
   * @returns Vendor or null
   */
  async getByUserId(userId: string): Promise<Vendor | null> {
    return Vendor.findOne({ where: { userId } });
  }

  /**
   * Get vendor by ID
   * Obtener vendedor por ID
   *
   * @param vendorId - Vendor UUID
   * @returns Vendor
   */
  async getById(vendorId: string): Promise<Vendor> {
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor not found');
    }
    return vendor;
  }

  /**
   * List vendors with pagination and filters
   * Listar vendedores con paginación y filtros
   */
  async list(options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ rows: Vendor[]; count: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }

    return Vendor.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get vendor dashboard data
   * Obtener datos del panel del vendedor
   *
   * @param vendorId - Vendor UUID
   * @returns Dashboard data
   */
  async getDashboard(vendorId: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    pendingPayouts: number;
    productCount: number;
    recentSales: Array<{
      orderId: string;
      amount: number;
      status: string;
      createdAt: Date;
    }>;
  }> {
    // Get vendor's orders
    const vendorOrders = await VendorOrder.findAll({
      where: { vendorId, status: 'completed' },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    // Calculate totals
    const totalRevenue = vendorOrders.reduce((sum, order) => sum + Number(order.vendorAmount), 0);
    const totalSales = vendorOrders.length;

    // Get pending payouts
    const pendingPayouts = await VendorPayout.sum('amount', {
      where: { vendorId, status: 'pending' },
    });

    // Get product count
    const productCount = await Product.count({
      where: { vendorId },
    });

    // Get recent sales
    const recentSales = vendorOrders.map((order) => ({
      orderId: order.orderId,
      amount: Number(order.vendorAmount),
      status: order.status,
      createdAt: order.createdAt,
    }));

    return {
      totalSales,
      totalRevenue,
      pendingPayouts: pendingPayouts || 0,
      productCount,
      recentSales,
    };
  }

  /**
   * Request a payout
   * Solicitar un pago
   *
   * @param vendorId - Vendor UUID
   * @param amount - Payout amount
   * @param paymentMethod - Payment method
   * @returns Created payout
   */
  async requestPayout(
    vendorId: string,
    amount: number,
    paymentMethod?: string
  ): Promise<VendorPayout> {
    const vendor = await this.getById(vendorId);

    if (vendor.status !== 'approved') {
      throw new AppError(400, 'INVALID_STATUS', 'Only approved vendors can request payouts');
    }

    // Get vendor's completed orders total
    const completedOrders = await VendorOrder.findAll({
      where: { vendorId, status: 'completed' },
    });

    const totalEarnings = completedOrders.reduce(
      (sum, order) => sum + Number(order.vendorAmount),
      0
    );

    // Get already paid payouts
    const paidPayouts = await VendorPayout.sum('amount', {
      where: { vendorId, status: { [Op.in]: ['completed', 'processing'] } },
    });

    const availableBalance = totalEarnings - (paidPayouts || 0);

    if (amount > availableBalance) {
      throw new AppError(400, 'INSUFFICIENT_BALANCE', 'Payout amount exceeds available balance');
    }

    // Calculate period (last 30 days by default)
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Create payout request
    const payout = await VendorPayout.create({
      vendorId,
      amount,
      currency: 'USD',
      status: 'pending',
      paymentMethod: paymentMethod || null,
      periodStart,
      periodEnd,
      requestedAt: new Date(),
    });

    return payout;
  }

  /**
   * Generate a URL-safe slug from business name
   * Generar slug URL-safe desde nombre de negocio
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 255);
  }
}

export const vendorService = new VendorService();
