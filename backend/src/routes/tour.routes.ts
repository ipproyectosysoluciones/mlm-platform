/**
 * @fileoverview Tour Routes - Public tourism package listing endpoints
 * @description Routes for browsing tourism packages without authentication.
 *              Rutas para navegar paquetes turísticos sin autenticación.
 * @module routes/tour.routes
 * @author MLM Development Team
 */
import { Router } from 'express';
import { getTourPackages, getTourPackage } from '../controllers/TourPackageController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: tours
 *     description: Tourism package listings / Listados de paquetes turísticos
 */

/**
 * @swagger
 * /tours:
 *   get:
 *     summary: List tour packages / Listar paquetes turísticos
 *     description: Public endpoint to browse available tour packages with optional filters.
 *                  Endpoint público para navegar paquetes turísticos disponibles con filtros opcionales.
 *     tags: [tours]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [adventure, cultural, relaxation, gastronomic, ecotourism, luxury]
 *         description: Filter by tour type / Filtrar por tipo de tour
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *           example: "Cartagena, Colombia"
 *         description: Filter by destination / Filtrar por destino
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: "Colombia"
 *         description: Filter by country / Filtrar por país
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *           default: active
 *         description: Listing status / Estado del listado
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 500
 *         description: Minimum price / Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 3000
 *         description: Maximum price / Precio máximo
 *       - in: query
 *         name: durationDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 7
 *         description: Duration in days / Duración en días
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
 *         description: Tour package list with pagination / Lista de paquetes turísticos con paginación
 *       400:
 *         description: Validation error / Error de validación
 */
router.get('/', getTourPackages);

/**
 * @swagger
 * /tours/{id}:
 *   get:
 *     summary: Get tour package by ID / Obtener paquete turístico por ID
 *     description: Public endpoint to retrieve a single tour package's details.
 *                  Endpoint público para obtener los detalles de un paquete turístico.
 *     tags: [tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tour package UUID / UUID del paquete turístico
 *     responses:
 *       200:
 *         description: Tour package details / Detalles del paquete turístico
 *       400:
 *         description: Invalid UUID / UUID inválido
 *       404:
 *         description: Tour package not found / Paquete turístico no encontrado
 */
router.get('/:id', getTourPackage);

export default router;
