/**
 * @fileoverview PropertyController - Property listing endpoints
 * @description Controller for public property browsing and admin CRUD operations.
 *              Public routes: list, detail.
 *              Admin routes: create, update, soft-delete.
 * @module controllers/PropertyController
 * @author MLM Development Team
 *
 * @example
 * // English: List available properties
 * GET /api/properties?city=Bogotá&status=available
 *
 * // Español: Listar propiedades disponibles
 * GET /api/properties?city=Bogotá&status=available
 */
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { propertyService } from '../services/PropertyService';
import { R2Service } from '../services/R2Service';
import { logger } from '../utils/logger';

// ============================================
// VALIDATION RULES
// ============================================

/**
 * Validation rule sets for property endpoints
 * Conjuntos de reglas de validación para endpoints de propiedades
 */
export const validationRules = {
  /**
   * Rules for listing properties (public + admin filter)
   * Reglas para listar propiedades (filtro público + admin)
   */
  list: [
    query('type').optional().isIn(['rental', 'sale', 'management']),
    query('city').optional().isString().trim().isLength({ max: 100 }),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('bedrooms').optional().isInt({ min: 0 }),
    query('status').optional().isIn(['available', 'rented', 'sold', 'paused']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],

  /**
   * Rules for creating a property
   * Reglas para crear una propiedad
   */
  create: [
    body('type').isIn(['rental', 'sale', 'management']),
    body('title').notEmpty().trim().isLength({ min: 1, max: 255 }),
    body('titleEn').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
    body('description').optional({ nullable: true }).isString().trim(),
    body('descriptionEn').optional({ nullable: true }).isString().trim(),
    body('price').isFloat({ min: 0 }),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }),
    body('priceNegotiable').optional().isBoolean(),
    body('bedrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('bathrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('areaM2').optional({ nullable: true }).isFloat({ min: 0 }),
    body('address').notEmpty().trim().isLength({ min: 1, max: 500 }),
    body('city').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('country').optional().isString().trim().isLength({ max: 100 }),
    body('lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
    body('lng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
    body('amenities').optional().isArray(),
    body('images').optional().isArray(),
    body('status').optional().isIn(['available', 'rented', 'sold', 'paused']),
    body('vendorId').optional({ nullable: true }).isUUID(),
  ],

  /**
   * Rules for updating a property (all fields optional)
   * Reglas para actualizar una propiedad (todos los campos opcionales)
   */
  update: [
    param('id').isUUID(),
    body('type').optional().isIn(['rental', 'sale', 'management']),
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('titleEn').optional({ nullable: true }).isString().trim().isLength({ max: 255 }),
    body('description').optional({ nullable: true }).isString().trim(),
    body('descriptionEn').optional({ nullable: true }).isString().trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().trim().isLength({ min: 3, max: 3 }),
    body('priceNegotiable').optional().isBoolean(),
    body('bedrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('bathrooms').optional({ nullable: true }).isInt({ min: 0 }),
    body('areaM2').optional({ nullable: true }).isFloat({ min: 0 }),
    body('address').optional().trim().isLength({ min: 1, max: 500 }),
    body('city').optional().trim().isLength({ min: 1, max: 100 }),
    body('country').optional().isString().trim().isLength({ max: 100 }),
    body('lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
    body('lng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
    body('amenities').optional().isArray(),
    body('images').optional().isArray(),
    body('status').optional().isIn(['available', 'rented', 'sold', 'paused']),
    body('vendorId').optional({ nullable: true }).isUUID(),
  ],
};

// ============================================
// HANDLERS
// ============================================

/**
 * GET /api/properties — Public property listing with filters
 * GET /api/properties — Listado público de propiedades con filtros
 *
 * @route GET /api/properties
 * @access Public
 */
export const getProperties = [
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
      const { type, city, minPrice, maxPrice, bedrooms, status, page, limit } = req.query as Record<
        string,
        string | undefined
      >;

      const { rows, count } = await propertyService.findAll({
        type: type as 'rental' | 'sale' | 'management' | undefined,
        city,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : undefined,
        status: status as 'available' | 'rented' | 'sold' | 'paused' | undefined,
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
      logger.error({ err: error }, 'Get properties error');
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to get properties',
        },
      });
    }
  },
];

/**
 * GET /api/properties/:id — Public property detail
 * GET /api/properties/:id — Detalle público de propiedad
 *
 * @route GET /api/properties/:id
 * @access Public
 */
export const getProperty = [
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
      const property = await propertyService.findById(req.params.id);

      res.json({
        success: true,
        data: property,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Get property error');
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to get property',
        },
      });
    }
  },
];

/**
 * POST /api/admin/properties — Admin: create a property
 * POST /api/admin/properties — Admin: crear una propiedad
 *
 * @route POST /api/admin/properties
 * @access Admin
 */
export const createProperty = [
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
      const property = await propertyService.create(req.body);

      res.status(201).json({
        success: true,
        data: property,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Create property error');
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to create property',
        },
      });
    }
  },
];

/**
 * PUT /api/admin/properties/:id — Admin: update a property
 * PUT /api/admin/properties/:id — Admin: actualizar una propiedad
 *
 * @route PUT /api/admin/properties/:id
 * @access Admin
 */
export const updateProperty = [
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
      const property = await propertyService.update(req.params.id, req.body);

      res.json({
        success: true,
        data: property,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Update property error');
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to update property',
        },
      });
    }
  },
];

/**
 * DELETE /api/admin/properties/:id — Admin: soft-delete a property
 * DELETE /api/admin/properties/:id — Admin: eliminar suavemente una propiedad
 *
 * @route DELETE /api/admin/properties/:id
 * @access Admin
 */
export const deleteProperty = [
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
      await propertyService.remove(req.params.id);

      res.json({
        success: true,
        message: 'Property deleted successfully',
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Delete property error');
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Failed to delete property',
        },
      });
    }
  },
];

/**
 * POST /api/admin/properties/:id/images — Upload images to a property
 * POST /api/admin/properties/:id/images — Sube imágenes a una propiedad
 *
 * @description Uploads files to Cloudflare R2 and appends the resulting public URLs
 *              to the property's images array. Safely normalizes req.files regardless
 *              of whether Multer returns a flat array (array()) or a fieldname dict (fields()).
 *              Sube archivos a Cloudflare R2 y agrega las URLs públicas resultantes
 *              al array de imágenes de la propiedad. Normaliza req.files de forma segura
 *              independientemente de si Multer retorna array plano o diccionario por campo.
 *
 * @security Fixed CodeQL js/type-confusion-through-parameter-tampering (#40)
 *           req.files puede ser File[] o { [fieldname]: File[] } — se normaliza explícitamente.
 *
 * @route POST /api/admin/properties/:id/images
 * @access Admin
 */
export const uploadPropertyImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const property = await propertyService.findById(req.params.id);
    // Normalize req.files: Multer can return File[] (array()) or { [field]: File[] } (fields())
    // Normalizar req.files: Multer puede retornar File[] (array()) o { [campo]: File[] } (fields())
    const files: Express.Multer.File[] = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files ?? {}).flat();

    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No images provided / No se proporcionaron imágenes' });
      return;
    }

    const rawImages = property.images;
    const currentImages: string[] = Array.isArray(rawImages)
      ? rawImages.filter((img): img is string => typeof img === 'string')
      : [];

    if (currentImages.length + files.length > 10) {
      res
        .status(400)
        .json({ message: `Max 10 images per property. Current: ${currentImages.length}` });
      return;
    }

    const r2Service = new R2Service();
    const newUrls = await r2Service.uploadImages({
      files,
      entityType: 'properties',
      entityId: property.id,
    });

    await propertyService.update(property.id, { images: [...currentImages, ...newUrls] });

    res.json({ images: [...currentImages, ...newUrls] });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/properties/:id/images/:imageIndex — Delete a property image by index
 * DELETE /api/admin/properties/:id/images/:imageIndex — Elimina una imagen de propiedad por índice
 *
 * @description Removes an image from Cloudflare R2 by index and updates the property record.
 *              Elimina una imagen de Cloudflare R2 por índice y actualiza el registro de propiedad.
 *
 * @route DELETE /api/admin/properties/:id/images/:imageIndex
 * @access Admin
 */
export const deletePropertyImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const property = await propertyService.findById(req.params.id);
    const imageIndex = parseInt(req.params.imageIndex, 10);
    const rawPropertyImages = property.images;
    const currentImages: string[] = Array.isArray(rawPropertyImages)
      ? rawPropertyImages.filter((img): img is string => typeof img === 'string')
      : [];

    if (imageIndex < 0 || imageIndex >= currentImages.length) {
      res.status(400).json({ message: 'Invalid image index / Índice de imagen inválido' });
      return;
    }

    const r2Service = new R2Service();
    await r2Service.deleteImage(currentImages[imageIndex]);

    const updatedImages = currentImages.filter((_, i) => i !== imageIndex);
    await propertyService.update(property.id, { images: updatedImages });

    res.json({ images: updatedImages });
  } catch (error) {
    next(error);
  }
};
