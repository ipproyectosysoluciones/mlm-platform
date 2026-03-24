import { Router } from 'express';
import {
  createLandingPage,
  getMyLandingPages,
  getLandingPageStats,
  getLandingPageById,
  updateLandingPage,
  deleteLandingPage,
  getPublicLandingPage,
  trackConversion,
} from '../controllers/LandingPageController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================================
// Protected routes / Rutas protegidas
// ============================================================

/**
 * @swagger
 * /landing:
 *   post:
 *     summary: Crear landing page | Create landing page
 *     description: Crea una nueva página de aterrizaje para campañas de marketing. Creates a new landing page for marketing campaigns.
 *     tags: [landing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título de la página | Page title
 *               description:
 *                 type: string
 *                 description: Descripción de la página | Page description
 *               template:
 *                 type: string
 *                 enum: [hero, promo, webinar, product]
 *                 default: hero
 *                 description: Plantilla a usar | Template to use
 *               content:
 *                 type: object
 *                 description: Contenido de la página | Page content
 *               slug:
 *                 type: string
 *                 description: URL amigable (opcional) | URL-friendly slug (optional)
 *               metaTitle:
 *                 type: string
 *                 description: Título SEO | SEO title
 *               metaDescription:
 *                 type: string
 *                 description: Descripción SEO | SEO description
 *     responses:
 *       201:
 *         description: Landing page creada | Landing page created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Error de validación | Validation error
 *       401:
 *         description: No autenticado | Not authenticated
 */
router.post('/landing', authenticate, createLandingPage);

/**
 * @swagger
 * /landing:
 *   get:
 *     summary: Obtener mis landing pages | Get my landing pages
 *     description: Retorna todas las landing pages del usuario autenticado. Returns all landing pages for the authenticated user.
 *     tags: [landing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de resultados | Results limit
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Resultados a omitir | Results to skip
 *     responses:
 *       200:
 *         description: Lista de landing pages | List of landing pages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: No autenticado | Not authenticated
 */
router.get('/landing', authenticate, getMyLandingPages);

/**
 * @swagger
 * /landing/stats:
 *   get:
 *     summary: Obtener estadísticas de landing pages | Get landing page statistics
 *     description: Retorna estadísticas agregadas de las landing pages del usuario. Returns aggregated statistics for user's landing pages.
 *     tags: [landing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de landing pages | Landing page statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: No autenticado | Not authenticated
 */
router.get('/landing/stats', authenticate, getLandingPageStats);

/**
 * @swagger
 * /landing/{id}:
 *   get:
 *     summary: Obtener landing page por ID | Get landing page by ID
 *     description: Retorna una landing page específica por su ID. Returns a specific landing page by ID.
 *     tags: [landing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la landing page | Landing page ID
 *     responses:
 *       200:
 *         description: Landing page encontrada | Landing page found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: No autenticado | Not authenticated
 *       403:
 *         description: No autorizado | Not authorized
 *       404:
 *         description: Landing page no encontrada | Landing page not found
 */
router.get('/landing/:id', authenticate, getLandingPageById);

/**
 * @swagger
 * /landing/{id}:
 *   put:
 *     summary: Actualizar landing page | Update landing page
 *     description: Actualiza una landing page existente. Updates an existing landing page.
 *     tags: [landing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la landing page | Landing page ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               template:
 *                 type: string
 *               content:
 *                 type: object
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Landing page actualizada | Landing page updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: No autenticado | Not authenticated
 *       403:
 *         description: No autorizado | Not authorized
 *       404:
 *         description: Landing page no encontrada | Landing page not found
 */
router.put('/landing/:id', authenticate, updateLandingPage);

/**
 * @swagger
 * /landing/{id}:
 *   delete:
 *     summary: Eliminar landing page | Delete landing page
 *     description: Elimina una landing page existente. Deletes an existing landing page.
 *     tags: [landing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la landing page | Landing page ID
 *     responses:
 *       200:
 *         description: Landing page eliminada | Landing page deleted
 *       401:
 *         description: No autenticado | Not authenticated
 *       403:
 *         description: No autorizado | Not authorized
 *       404:
 *         description: Landing page no encontrada | Landing page not found
 */
router.delete('/landing/:id', authenticate, deleteLandingPage);

// ============================================================
// Public routes / Rutas públicas
// ============================================================

/**
 * @swagger
 * /landing/{slug}:
 *   get:
 *     summary: Ver landing page pública | View public landing page
 *     description: Retorna una landing page pública por su slug. Returns a public landing page by its slug.
 *     tags: [landing]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug de la landing page | Landing page slug
 *     responses:
 *       200:
 *         description: Landing page pública | Public landing page
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Landing page no encontrada | Landing page not found
 */
router.get('/landing/:slug', getPublicLandingPage);

/**
 * @swagger
 * /landing/{slug}/convert:
 *   post:
 *     summary: Registrar conversión | Register conversion
 *     description: Registra una conversión (clic en CTA) para una landing page. Registers a conversion (CTA click) for a landing page.
 *     tags: [landing]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug de la landing page | Landing page slug
 *     responses:
 *       200:
 *         description: Conversión registrada | Conversion registered
 *       404:
 *         description: Landing page no encontrada | Landing page not found
 */
router.post('/landing/:slug/convert', trackConversion);

export default router;
