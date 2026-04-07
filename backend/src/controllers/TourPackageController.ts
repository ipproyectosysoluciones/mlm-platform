/**
 * @fileoverview TourPackageController - Tourism package endpoints
 * @description Controller for public tour browsing and admin CRUD operations.
 *              Public routes: list, detail.
 *              Admin routes: create, update, soft-delete.
 *              Controlador para navegación pública de tours y operaciones CRUD de admin.
 *              Rutas públicas: listado, detalle.
 *              Rutas admin: crear, actualizar, borrado suave.
 * @module controllers/TourPackageController
 * @author MLM Development Team
 *
 * @example
 * // English: List active adventure tours
 * GET /api/tours?type=adventure&status=active
 *
 * // Español: Listar tours de aventura activos
 * GET /api/tours?type=adventure&status=active
 */
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { tourPackageService } from '../services/TourPackageService';
import { R2Service } from '../services/R2Service';

// ============================================
// VALIDATION RULES
// ============================================

/**
 * Validation rule sets for tour package endpoints
 * Conjuntos de reglas de validación para endpoints de paquetes turísticos
 */
export const validationRules = {
  /**
   * Rules for listing tour packages (public + admin filter)
   * Reglas para listar paquetes turísticos (filtro público + admin)
   */
  list: [
    query('type')
      .optional()
      .isIn(['adventure', 'cultural', 'relaxation', 'gastronomic', 'ecotourism', 'luxury']),
    query('destination').optional().isString().trim().isLength({ max: 100 }),
    query('country').optional().isString().trim().isLength({ max: 100 }),
    query('status').optional().isIn(['active', 'inactive', 'draft']),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('durationDays').optional().isInt({ min: 1 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],

  /**
   * Rules for creating a tour package
   * Reglas para crear un paquete turístico
   */
  create: [
    body('type').isIn([
      'adventure',
      'cultural',
      'relaxation',
      'gastronomic',
      'ecotourism',
      'luxury',
    ]),
    body('title').notEmpty().trim().isLength({ min: 1, max: 200 }),
    body('titleEn').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
    body('description').optional({ nullable: true }).isString().trim(),
    body('descriptionEn').optional({ nullable: true }).isString().trim(),
    body('destination').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('country').optional().isString().trim().isLength({ max: 100 }),
    body('durationDays').isInt({ min: 1 }),
    body('price').isFloat({ min: 0 }),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }),
    body('priceIncludes').optional().isArray(),
    body('priceExcludes').optional().isArray(),
    body('images').optional().isArray(),
    body('maxCapacity').optional().isInt({ min: 1 }),
    body('minGroupSize').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['active', 'inactive', 'draft']),
    body('vendorId').optional({ nullable: true }).isUUID(),
  ],

  /**
   * Rules for updating a tour package (all fields optional)
   * Reglas para actualizar un paquete turístico (todos los campos opcionales)
   */
  update: [
    param('id').isUUID(),
    body('type')
      .optional()
      .isIn(['adventure', 'cultural', 'relaxation', 'gastronomic', 'ecotourism', 'luxury']),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('titleEn').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
    body('description').optional({ nullable: true }).isString().trim(),
    body('descriptionEn').optional({ nullable: true }).isString().trim(),
    body('destination').optional().trim().isLength({ min: 1, max: 100 }),
    body('country').optional().isString().trim().isLength({ max: 100 }),
    body('durationDays').optional().isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }),
    body('priceIncludes').optional().isArray(),
    body('priceExcludes').optional().isArray(),
    body('images').optional().isArray(),
    body('maxCapacity').optional().isInt({ min: 1 }),
    body('minGroupSize').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['active', 'inactive', 'draft']),
    body('vendorId').optional({ nullable: true }).isUUID(),
  ],
};

// ============================================
// HANDLERS
// ============================================

/**
 * GET /api/tours — Public tour listing with filters
 * GET /api/tours — Listado público de tours con filtros
 *
 * @route GET /api/tours
 * @access Public
 */
export const getTourPackages = [
  validationRules.list,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      const { type, destination, country, status, minPrice, maxPrice, durationDays, page, limit } =
        req.query as Record<string, string | undefined>;

      const { rows, count } = await tourPackageService.findAll({
        type: type as
          | 'adventure'
          | 'cultural'
          | 'relaxation'
          | 'gastronomic'
          | 'ecotourism'
          | 'luxury'
          | undefined,
        destination,
        country,
        status: status as 'active' | 'inactive' | 'draft' | undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        durationDays: durationDays ? parseInt(durationDays, 10) : undefined,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(count / parsedLimit),
        },
      });
    } catch (error: any) {
      console.error('Get tour packages error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to get tour packages',
        },
      });
    }
  },
];

/**
 * GET /api/tours/:id — Public tour package detail
 * GET /api/tours/:id — Detalle público de paquete turístico
 *
 * @route GET /api/tours/:id
 * @access Public
 */
export const getTourPackage = [
  param('id').isUUID(),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      const tourPackage = await tourPackageService.findById(req.params.id);

      res.json({
        success: true,
        data: tourPackage,
      });
    } catch (error: any) {
      console.error('Get tour package error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to get tour package',
        },
      });
    }
  },
];

/**
 * POST /api/admin/tours — Admin: create a tour package
 * POST /api/admin/tours — Admin: crear un paquete turístico
 *
 * @route POST /api/admin/tours
 * @access Admin
 */
export const createTourPackage = [
  authenticate,
  requireAdmin,
  validationRules.create,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      const tourPackage = await tourPackageService.create(req.body);

      res.status(201).json({
        success: true,
        data: tourPackage,
      });
    } catch (error: any) {
      console.error('Create tour package error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to create tour package',
        },
      });
    }
  },
];

/**
 * PUT /api/admin/tours/:id — Admin: update a tour package
 * PUT /api/admin/tours/:id — Admin: actualizar un paquete turístico
 *
 * @route PUT /api/admin/tours/:id
 * @access Admin
 */
export const updateTourPackage = [
  authenticate,
  requireAdmin,
  validationRules.update,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      const tourPackage = await tourPackageService.update(req.params.id, req.body);

      res.json({
        success: true,
        data: tourPackage,
      });
    } catch (error: any) {
      console.error('Update tour package error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to update tour package',
        },
      });
    }
  },
];

/**
 * DELETE /api/admin/tours/:id — Admin: soft-delete a tour package
 * DELETE /api/admin/tours/:id — Admin: eliminar suavemente un paquete turístico
 *
 * @route DELETE /api/admin/tours/:id
 * @access Admin
 */
export const deleteTourPackage = [
  authenticate,
  requireAdmin,
  param('id').isUUID(),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array(),
        },
      });
      return;
    }

    try {
      await tourPackageService.remove(req.params.id);

      res.status(204).send();
    } catch (error: any) {
      console.error('Delete tour package error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to delete tour package',
        },
      });
    }
  },
];

/**
 * POST /api/admin/tours/:id/images — Upload images to a tour package
 * POST /api/admin/tours/:id/images — Sube imágenes a un paquete turístico
 *
 * @description Uploads files to Cloudflare R2 and appends the resulting public URLs
 *              to the tour package's images array.
 *              Sube archivos a Cloudflare R2 y agrega las URLs públicas resultantes
 *              al array de imágenes del paquete turístico.
 *
 * @route POST /api/admin/tours/:id/images
 * @access Admin
 */
export const uploadTourImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tourPackage = await tourPackageService.findById(req.params.id);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No images provided / No se proporcionaron imágenes' });
      return;
    }

    const currentImages = (tourPackage.images as string[]) ?? [];

    if (currentImages.length + files.length > 10) {
      res.status(400).json({ message: `Max 10 images per tour. Current: ${currentImages.length}` });
      return;
    }

    const r2Service = new R2Service();
    const newUrls = await r2Service.uploadImages({
      files,
      entityType: 'tours',
      entityId: tourPackage.id,
    });

    await tourPackageService.update(tourPackage.id, { images: [...currentImages, ...newUrls] });

    res.json({ images: [...currentImages, ...newUrls] });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/tours/:id/images/:imageIndex — Delete a tour package image by index
 * DELETE /api/admin/tours/:id/images/:imageIndex — Elimina una imagen de paquete turístico por índice
 *
 * @description Removes an image from Cloudflare R2 by index and updates the tour package record.
 *              Elimina una imagen de Cloudflare R2 por índice y actualiza el registro del paquete turístico.
 *
 * @route DELETE /api/admin/tours/:id/images/:imageIndex
 * @access Admin
 */
export const deleteTourImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tourPackage = await tourPackageService.findById(req.params.id);
    const imageIndex = parseInt(req.params.imageIndex, 10);
    const currentImages = (tourPackage.images as string[]) ?? [];

    if (imageIndex < 0 || imageIndex >= currentImages.length) {
      res.status(400).json({ message: 'Invalid image index / Índice de imagen inválido' });
      return;
    }

    const r2Service = new R2Service();
    await r2Service.deleteImage(currentImages[imageIndex]);

    const updatedImages = currentImages.filter((_, i) => i !== imageIndex);
    await tourPackageService.update(tourPackage.id, { images: updatedImages });

    res.json({ images: updatedImages });
  } catch (error) {
    next(error);
  }
};
