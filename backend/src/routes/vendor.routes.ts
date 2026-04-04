/**
 * @fileoverview Vendor Routes - Vendor management endpoints
 * @description Routes for vendor registration, profile, products, dashboard, and payouts
 * @module routes/vendor.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import {
  registerVendor,
  getVendorProfile,
  getVendorProducts,
  getVendorDashboard,
  requestPayout,
} from '../controllers/VendorController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: vendors
 *     description: Vendor management / Gestión de vendedores
 */

/**
 * @swagger
 * /vendors/register:
 *   post:
 *     summary: Register as vendor / Registrarse como vendedor
 *     tags: [vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - contactEmail
 *             properties:
 *               businessName:
 *                 type: string
 *                 example: "Mi Tienda Online"
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 example: "tienda@ejemplo.com"
 *               contactPhone:
 *                 type: string
 *                 example: "+1234567890"
 *               description:
 *                 type: string
 *                 example: "Tienda de productos electrónicos"
 *     responses:
 *       201:
 *         description: Vendor registered / Vendedor registrado
 *       400:
 *         description: Validation error or vendor exists / Error de validación o vendedor existe
 */
router.post('/register', registerVendor);

/**
 * @swagger
 * /vendors/me:
 *   get:
 *     summary: Get vendor profile / Obtener perfil del vendedor
 *     tags: [vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile / Perfil del vendedor
 *       404:
 *         description: Vendor not found / Vendedor no encontrado
 */
router.get('/me', getVendorProfile);

/**
 * @swagger
 * /vendors/me/products:
 *   get:
 *     summary: Get vendor products / Obtener productos del vendedor
 *     tags: [vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Vendor products list / Lista de productos del vendedor
 */
router.get('/me/products', getVendorProducts);

/**
 * @swagger
 * /vendors/me/dashboard:
 *   get:
 *     summary: Get vendor dashboard / Obtener panel del vendedor
 *     tags: [vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data / Datos del panel
 */
router.get('/me/dashboard', getVendorDashboard);

/**
 * @swagger
 * /vendors/me/payouts:
 *   post:
 *     summary: Request payout / Solicitar pago
 *     tags: [vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 100.00
 *               paymentMethod:
 *                 type: string
 *                 example: "bank_transfer"
 *     responses:
 *       201:
 *         description: Payout requested / Pago solicitado
 *       400:
 *         description: Invalid amount or insufficient balance / Monto inválido o saldo insuficiente
 */
router.post('/me/payouts', requestPayout);

export default router;
