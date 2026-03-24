import { Router } from 'express';
import { getPublicProfile, getSitemapUsers } from '../controllers/PublicController';

const router = Router();

/**
 * @swagger
 * /public/profile/{code}:
 *   get:
 *     summary: Obtener perfil público | Get public profile
 *     description: Retorna el perfil público de un usuario por su código de referido. Returns a user's public profile by their referral code.
 *     tags: [public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de referido | Referral code
 *     responses:
 *       200:
 *         description: Perfil público del usuario | User public profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Código de referido requerido | Referral code required
 *       404:
 *         description: Perfil no encontrado | Profile not found
 */
router.get('/profile/:code', getPublicProfile);

/**
 * @swagger
 * /public/sitemap/users:
 *   get:
 *     summary: Obtener usuarios para sitemap | Get users for sitemap
 *     description: Retorna lista de usuarios activos para generar sitemap XML. Returns list of active users for XML sitemap generation.
 *     tags: [public]
 *     responses:
 *       200:
 *         description: Lista de usuarios para sitemap | Users list for sitemap
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/sitemap/users', getSitemapUsers);

export default router;
