/**
 * @fileoverview Admin Property Routes - Admin property management endpoints
 * @description Routes for admin property CRUD operations (create, update, delete, list).
 *              Rate-limited to 60 req/min (production) to prevent abuse on authorized endpoints.
 *              Protected by JWT authentication and admin role verification.
 *              Rutas CRUD de propiedades para admin. Rate limit de 60 req/min en producción.
 *              Protegidas por autenticación JWT y verificación de rol admin.
 * @module routes/admin-property.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import { adminLimiter } from '../middleware/rateLimit.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
} from '../controllers/PropertyController.js';
import { uploadImages } from '../middleware/upload.js';

const router = Router();

router.use(adminLimiter);

/**
 * Enforce JWT authentication and admin role for all routes in this router.
 * Any request without a valid token or without the 'admin' role will receive
 * a 401 (Unauthorized) or 403 (Forbidden) response before reaching any handler.
 *
 * Aplica autenticación JWT y rol admin a todas las rutas de este router.
 * Cualquier request sin token válido o sin rol 'admin' recibe 401 o 403
 * antes de llegar a cualquier handler.
 */
router.use(authenticate);
router.use(requireAdmin);

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
router.get('/', ...getProperties);

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
router.post('/', ...createProperty);

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
router.put('/:id', ...updateProperty);

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

// Image upload routes / Rutas de subida de imágenes

/**
 * @swagger
 * /admin/properties/{id}/images:
 *   post:
 *     summary: Upload property images / Subir imágenes de propiedad
 *     description: Upload one or more images for a property. Requires admin role.
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
 *         description: Property ID / ID de la propiedad
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded / Imágenes subidas
 *       400:
 *         description: Invalid files or limit exceeded / Archivos inválidos o límite excedido
 *       401:
 *         description: Unauthorized / No autorizado
 *       403:
 *         description: Forbidden — admin required / Prohibido — se requiere admin
 *       404:
 *         description: Property not found / Propiedad no encontrada
 *       500:
 *         description: Internal error / Error interno
 */
router.post('/:id/images', uploadImages, uploadPropertyImages);

/**
 * @swagger
 * /admin/properties/{id}/images/{imageIndex}:
 *   delete:
 *     summary: Delete property image / Eliminar imagen de propiedad
 *     description: Delete a specific image from a property by index. Requires admin role.
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
 *         description: Property ID / ID de la propiedad
 *       - in: path
 *         name: imageIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image index / Índice de la imagen
 *     responses:
 *       200:
 *         description: Image deleted / Imagen eliminada
 *       400:
 *         description: Invalid index / Índice inválido
 *       401:
 *         description: Unauthorized / No autorizado
 *       403:
 *         description: Forbidden — admin required / Prohibido — se requiere admin
 *       404:
 *         description: Property or image not found / Propiedad o imagen no encontrada
 *       500:
 *         description: Internal error / Error interno
 */
router.delete('/:id/images/:imageIndex', deletePropertyImage);

export default router;
