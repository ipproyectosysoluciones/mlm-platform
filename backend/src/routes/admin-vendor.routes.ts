/**
 * @fileoverview Admin Vendor Routes - Admin vendor management endpoints
 * @description Routes for admin vendor management: list, approve, reject, suspend
 * @module routes/admin-vendor.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import {
  listVendors,
  getVendor,
  approveVendor,
  rejectVendor,
  suspendVendor,
  updateCommissionRate,
} from '../controllers/AdminVendorController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: admin-vendors
 *     description: Admin vendor management / Gestión de vendedores (Admin)
 */

/**
 * @swagger
 * /admin/vendors:
 *   get:
 *     summary: List vendors / Listar vendedores
 *     tags: [admin-vendors]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, suspended, rejected]
 *     responses:
 *       200:
 *         description: Vendor list / Lista de vendedores
 */
router.get('/', listVendors);

/**
 * @swagger
 * /admin/vendors/{id}:
 *   get:
 *     summary: Get vendor by ID / Obtener vendedor por ID
 *     tags: [admin-vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vendor details / Detalles del vendedor
 *       404:
 *         description: Vendor not found / Vendedor no encontrado
 */
router.get('/:id', getVendor);

/**
 * @swagger
 * /admin/vendors/{id}/approve:
 *   post:
 *     summary: Approve vendor / Aprobar vendedor
 *     tags: [admin-vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vendor approved / Vendedor aprobado
 *       400:
 *         description: Invalid status / Estado inválido
 */
router.post('/:id/approve', approveVendor);

/**
 * @swagger
 * /admin/vendors/{id}/reject:
 *   post:
 *     summary: Reject vendor / Rechazar vendedor
 *     tags: [admin-vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Documentos incompletos"
 *     responses:
 *       200:
 *         description: Vendor rejected / Vendedor rechazado
 */
router.post('/:id/reject', rejectVendor);

/**
 * @swagger
 * /admin/vendors/{id}/suspend:
 *   post:
 *     summary: Suspend vendor / Suspender vendedor
 *     tags: [admin-vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Incumplimiento de políticas"
 *     responses:
 *       200:
 *         description: Vendor suspended / Vendedor suspendido
 */
router.post('/:id/suspend', suspendVendor);

/**
 * @swagger
 * /admin/vendors/{id}/commission-rate:
 *   patch:
 *     summary: Update vendor commission rate / Actualizar tasa de comisión
 *     tags: [admin-vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commissionRate
 *             properties:
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.75
 *     responses:
 *       200:
 *         description: Commission rate updated / Tasa de comisión actualizada
 */
router.patch('/:id/commission-rate', updateCommissionRate);

export default router;
