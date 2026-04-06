/**
 * @fileoverview Admin Property Routes - Admin property management endpoints
 * @description Routes for admin property CRUD operations (create, update, delete, list)
 * @module routes/admin-property.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/PropertyController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: admin-properties
 *     description: Admin property management / Gestión de propiedades (Admin)
 */

/**
 * @swagger
 * /admin/properties:
 *   get:
 *     summary: List all properties (admin) / Listar todas las propiedades (admin)
 *     description: Admin endpoint to list all properties including paused, sold, and rented.
 *                  Endpoint admin para listar todas las propiedades incluyendo pausadas, vendidas y alquiladas.
 *     tags: [admin-properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rental, sale, management]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *           example: "Medellín"
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
 *         name: bedrooms
 *         schema:
 *           type: integer
 *           minimum: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, rented, sold, paused]
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
 *         description: Property list / Lista de propiedades
 *       401:
 *         description: Unauthorized / No autorizado
 *       403:
 *         description: Forbidden - not an admin / Prohibido - no es admin
 */
router.get('/', getProperties);

/**
 * @swagger
 * /admin/properties:
 *   post:
 *     summary: Create property / Crear propiedad
 *     tags: [admin-properties]
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
 *               - price
 *               - address
 *               - city
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [rental, sale, management]
 *                 example: "rental"
 *               title:
 *                 type: string
 *                 example: "Apartamento en el Poblado"
 *               titleEn:
 *                 type: string
 *                 example: "Apartment in El Poblado"
 *               description:
 *                 type: string
 *               descriptionEn:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 1500000
 *               currency:
 *                 type: string
 *                 example: "COP"
 *               priceNegotiable:
 *                 type: boolean
 *               bedrooms:
 *                 type: integer
 *                 example: 2
 *               bathrooms:
 *                 type: integer
 *                 example: 1
 *               areaM2:
 *                 type: number
 *                 example: 65.5
 *               address:
 *                 type: string
 *                 example: "Cra 40 # 10-15"
 *               city:
 *                 type: string
 *                 example: "Medellín"
 *               country:
 *                 type: string
 *                 example: "Colombia"
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               amenities:
 *                 type: array
 *               images:
 *                 type: array
 *               status:
 *                 type: string
 *                 enum: [available, rented, sold, paused]
 *               vendorId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Property created / Propiedad creada
 *       400:
 *         description: Validation error / Error de validación
 *       401:
 *         description: Unauthorized / No autorizado
 *       403:
 *         description: Forbidden / Prohibido
 */
router.post('/', createProperty);

/**
 * @swagger
 * /admin/properties/{id}:
 *   put:
 *     summary: Update property / Actualizar propiedad
 *     tags: [admin-properties]
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
 *                 enum: [available, rented, sold, paused]
 *     responses:
 *       200:
 *         description: Property updated / Propiedad actualizada
 *       400:
 *         description: Validation error / Error de validación
 *       404:
 *         description: Property not found / Propiedad no encontrada
 */
router.put('/:id', updateProperty);

/**
 * @swagger
 * /admin/properties/{id}:
 *   delete:
 *     summary: Delete property (soft-delete) / Eliminar propiedad (borrado suave)
 *     tags: [admin-properties]
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
 *         description: Property deleted / Propiedad eliminada
 *       404:
 *         description: Property not found / Propiedad no encontrada
 */
router.delete('/:id', deleteProperty);

export default router;
