/**
 * @fileoverview Public profile routes
 * @description API routes for public profile products
 * @module routes/profile-public.routes
 * @author MLM Development Team
 *
 * @example
 * // English: Get products for a public profile
 * GET /api/public/profile/AFFILIATE123/products
 *
 * // Español: Obtener productos para un perfil público
 * GET /api/public/profile/AFFILIATE123/products
 */
import { Router, Request, Response } from 'express';
import { Product, User } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';
import type { ApiResponse } from '../types';

const router = Router();

/**
 * @swagger
 * /public/profile/{code}/products:
 *   get:
 *     summary: Get products for a public profile
 *     description: Returns products associated with a user based on their referral code
 *     tags: [public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: User's referral code
 *     responses:
 *       200:
 *         description: List of products for this profile
 *       404:
 *         description: Profile not found
 */
router.get(
  '/:code/products',
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    // Verify user exists
    const user = await User.findOne({
      where: { referralCode: code.toUpperCase(), status: 'active' },
      attributes: ['id', 'referralCode'],
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Profile not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Get active products (for now, return all active products as featured)
    // In the future, this could be linked to user's specific offerings
    const products = await Product.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'price', 'currency', 'platform'],
      limit: 6,
      order: [['created_at', 'DESC']],
    });

    const productList = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      currency: product.currency,
      platform: product.platform,
      imageUrl: getProductImageUrl(product.platform),
    }));

    const response: ApiResponse<typeof productList> = {
      success: true,
      data: productList,
    };

    res.json(response);
  })
);

/**
 * Get product image URL based on platform
 * Obtener URL de imagen del producto según la plataforma
 */
function getProductImageUrl(platform: string): string {
  const images: Record<string, string> = {
    netflix: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    spotify: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
    disney_plus: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
    hbo_max: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/HBO_Max_Logo.svg',
    amazon_prime: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.jpg',
    youtube_premium: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/YouTube_Logo_2017.svg',
    apple_tv: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Apple_TV_Plus_Logo.svg',
    other: '/images/product-placeholder.svg',
  };

  return images[platform] || images.other;
}

export default router;
