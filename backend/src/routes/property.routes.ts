/**
 * @fileoverview Property Routes - Public property listing endpoints
 * @description Routes for browsing property listings without authentication
 * @module routes/property.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import { getProperties, getProperty } from '../controllers/PropertyController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: properties
 *     description: Property listings / Listados de propiedades
 */

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: List properties / Listar propiedades
 *     description: Public endpoint to browse available properties with optional filters.
 *                  Endpoint público para navegar propiedades disponibles con filtros opcionales.
 *     tags: [properties]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rental, sale, management]
 *         description: Filter by listing type / Filtrar por tipo de listado
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *           example: "Bogotá"
 *         description: Filter by city / Filtrar por ciudad
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 500000
 *         description: Minimum price / Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 2000000
 *         description: Maximum price / Precio máximo
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 3
 *         description: Number of bedrooms / Número de habitaciones
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, rented, sold, paused]
 *           default: available
 *         description: Listing status / Estado del listado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Property list with pagination / Lista de propiedades con paginación
 *       400:
 *         description: Validation error / Error de validación
 */
router.get('/', getProperties);

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Get property by ID / Obtener propiedad por ID
 *     description: Public endpoint to retrieve a single property's details.
 *                  Endpoint público para obtener los detalles de una sola propiedad.
 *     tags: [properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property UUID / UUID de la propiedad
 *     responses:
 *       200:
 *         description: Property details / Detalles de la propiedad
 *       400:
 *         description: Invalid UUID / UUID inválido
 *       404:
 *         description: Property not found / Propiedad no encontrada
 */
router.get('/:id', getProperty);

export default router;
