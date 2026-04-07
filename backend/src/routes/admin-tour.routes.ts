/**
 * @fileoverview Admin Tour Routes - Admin tourism package management endpoints
 * @description Routes for admin tour package CRUD operations (create, update, delete, list).
 *              Rutas para operaciones CRUD de paquetes turísticos del admin (crear, actualizar, eliminar, listar).
 * @module routes/admin-tour.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import {
  getTourPackages,
  getTourPackage,
  createTourPackage,
  updateTourPackage,
  deleteTourPackage,
} from '../controllers/TourPackageController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: admin-tours
 *     description: Admin tourism package management / Gestión de paquetes turísticos (Admin)
 */

/**
 * @swagger
 * /admin/tours:
 *   get:
 *     summary: List all tour packages (admin) / Listar todos los paquetes turísticos (admin)
 *     description: Admin endpoint to list all tour packages including inactive and draft.
 *                  Endpoint admin para listar todos los paquetes turísticos incluyendo inactivos y borradores.
 *     tags: [admin-tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [adventure, cultural, relaxation, gastronomic, ecotourism, luxury]
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *           example: "Cartagena, Colombia"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: "Colombia"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *       - in: query
 *         name: durationDays
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *         description: Tour package list / Lista de paquetes turísticos
 *       401:
 *         description: Unauthorized / No autorizado
 *       403:
 *         description: Forbidden - not an admin / Prohibido - no es admin
 */
router.get('/', getTourPackages);

/**
 * @swagger
 * /admin/tours/{id}:
 *   get:
 *     summary: Get tour package by ID (admin) / Obtener paquete turístico por ID (admin)
 *     tags: [admin-tours]
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
 *         description: Tour package details / Detalles del paquete turístico
 *       404:
 *         description: Not found / No encontrado
 */
router.get('/:id', getTourPackage);

/**
 * @swagger
 * /admin/tours:
 *   post:
 *     summary: Create tour package / Crear paquete turístico
 *     tags: [admin-tours]
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
 *               - title
 *               - destination
 *               - durationDays
 *               - price
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [adventure, cultural, relaxation, gastronomic, ecotourism, luxury]
 *                 example: "adventure"
 *               title:
 *                 type: string
 *                 example: "Trekking en el Cocuy"
 *               titleEn:
 *                 type: string
 *                 example: "Trekking in Cocuy"
 *               description:
 *                 type: string
 *               descriptionEn:
 *                 type: string
 *               destination:
 *                 type: string
 *                 example: "Sierra Nevada del Cocuy, Colombia"
 *               country:
 *                 type: string
 *                 example: "Colombia"
 *               durationDays:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 850
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               priceIncludes:
 *                 type: array
 *               priceExcludes:
 *                 type: array
 *               images:
 *                 type: array
 *               maxCapacity:
 *                 type: integer
 *                 example: 12
 *               minGroupSize:
 *                 type: integer
 *                 example: 2
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *               vendorId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Tour package created / Paquete turístico creado
 *       400:
 *         description: Validation error / Error de validación
 *       401:
 *         description: Unauthorized / No autorizado
 *       403:
 *         description: Forbidden / Prohibido
 */
router.post('/', createTourPackage);

/**
 * @swagger
 * /admin/tours/{id}:
 *   put:
 *     summary: Update tour package / Actualizar paquete turístico
 *     tags: [admin-tours]
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
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *     responses:
 *       200:
 *         description: Tour package updated / Paquete turístico actualizado
 *       400:
 *         description: Validation error / Error de validación
 *       404:
 *         description: Tour package not found / Paquete turístico no encontrado
 */
router.put('/:id', updateTourPackage);

/**
 * @swagger
 * /admin/tours/{id}:
 *   delete:
 *     summary: Delete tour package (soft-delete) / Eliminar paquete turístico (borrado suave)
 *     tags: [admin-tours]
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
 *       204:
 *         description: Tour package deleted / Paquete turístico eliminado
 *       404:
 *         description: Tour package not found / Paquete turístico no encontrado
 */
router.delete('/:id', deleteTourPackage);

export default router;
