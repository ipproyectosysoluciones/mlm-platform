/**
 * @fileoverview Public landing page routes
 * @description API routes for product landing pages and public profile products
 * @module routes/landing-public.routes
 * @author MLM Development Team
 *
 * @example
 * // English: Get product landing page data
 * GET /api/public/landing/product/123e4567-e89b-12d3-a456-426614174000?ref=REFCODE
 *
 * // Español: Obtener datos de landing page de producto
 * GET /api/public/landing/product/123e4567-e89b-12d3-a456-426614174000?ref=REFCODE
 */
import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import { validationResult } from 'express-validator';
import { Product, User } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate.middleware';
import type { ApiResponse } from '../types';

const router = Router();

// DEBUG endpoint - test without validation
router.get(
  '/product/debug/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    res.json({ success: true, id, message: 'Debug endpoint works' });
  })
);

/**
 * Get product features based on platform
 * Obtener características del producto según la plataforma
 */
function getProductFeatures(platform: string): string[] {
  const featuresMap: Record<string, string[]> = {
    netflix: [
      'Unlimited movies & TV shows',
      'Watch on any device',
      'Download for offline viewing',
      'Ad-free streaming',
    ],
    spotify: [
      'Ad-free music streaming',
      'Offline downloads',
      'High quality audio',
      'Access to exclusive podcasts',
    ],
    disney_plus: [
      'Disney, Pixar, Marvel & Star Wars',
      'Originals & exclusives',
      'Family-friendly content',
      '4K Ultra HD streaming',
    ],
    hbo_max: ['HBO Originals', 'Warner Bros. movies', 'DC Universe content', 'Ad-free streaming'],
    amazon_prime: ['Prime Video included', 'Free shipping', 'Prime Music', 'Exclusive deals'],
    youtube_premium: [
      'Ad-free YouTube',
      'YouTube Music Premium',
      'Background play',
      'Offline downloads',
    ],
    apple_tv: ['Apple Originals', '4K HDR streaming', 'Family sharing', 'AirPlay support'],
    other: ['Premium subscription', 'Multi-device access', 'HD streaming', '24/7 support'],
  };

  return featuresMap[platform] || featuresMap.other;
}

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

// Validation for product ID - accept any UUID format
const productIdValidation = [param('id').isUUID().withMessage('Product ID must be a valid UUID')];

// Validation for referral code
const refCodeValidation = [
  query('ref')
    .optional()
    .isString()
    .trim()
    .custom((value: string) => {
      // Allow empty string (treated as "no ref"), or valid 3-15 char code
      if (value === '' || (value.length >= 3 && value.length <= 15)) return true;
      throw new Error('Referral code must be 3-15 characters');
    }),
];

/**
 * @swagger
 * /public/landing/product/{id}:
 *   get:
 *     summary: Get product landing page data
 *     description: Returns product details with optional affiliate info for landing pages
 *     tags: [public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: ref
 *         required: false
 *         schema:
 *           type: string
 *         description: Affiliate referral code
 *     responses:
 *       200:
 *         description: Product landing data with optional affiliate info
 *       404:
 *         description: Product not found
 */
router.get(
  '/product/:id',
  validate(productIdValidation),
  validate(refCodeValidation),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const refCode = req.query.ref as string | undefined;

    // Fetch product
    const product = await Product.findByPk(id);

    if (!product) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Build product data
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      currency: product.currency,
      platform: product.platform,
      features: getProductFeatures(product.platform),
      imageUrl: getProductImageUrl(product.platform),
      isActive: product.isActive,
    };

    // Fetch affiliate info if ref code provided
    let affiliate: { referralCode: string; fullName: string } | undefined;

    if (refCode) {
      const affiliateUser = await User.findOne({
        where: { referralCode: refCode.toUpperCase(), status: 'active' },
        attributes: ['referralCode', 'email', 'level'],
      });

      if (affiliateUser) {
        affiliate = {
          referralCode: affiliateUser.referralCode,
          fullName: affiliateUser.email.split('@')[0], // Use email prefix as display name
        };
      }
    }

    // Generate SEO metadata
    const meta = {
      title: `${product.name} - Exclusive Deal`,
      description: product.description || `Get ${product.name} subscription at the best price`,
      ogImage: productData.imageUrl,
    };

    const response: ApiResponse<{
      product: typeof productData;
      affiliate?: typeof affiliate;
    }> & { meta: typeof meta } = {
      success: true,
      data: {
        product: productData,
        ...(affiliate && { affiliate }),
      },
      meta,
    };

    res.json(response);
  })
);

export default router;
