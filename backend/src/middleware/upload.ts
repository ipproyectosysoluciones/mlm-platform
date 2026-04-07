/**
 * @fileoverview Multer upload middleware for multipart/form-data
 * @description Configura multer con memoria (sin disco), validación de tipo y tamaño.
 *              Configures multer with memory storage (no disk), type and size validation.
 * @module middleware/upload
 * @author MLM Development Team
 *
 * @example
 * // English: Use the uploadImages middleware in a route
 * router.post('/:id/images', uploadImages, uploadPropertyImages);
 *
 * // Español: Usar el middleware uploadImages en una ruta
 * router.post('/:id/images', uploadImages, uploadPropertyImages);
 */
import multer from 'multer';
import { AppError } from './error.middleware';

/**
 * Allowed MIME types for image uploads
 * Tipos MIME permitidos para subida de imágenes
 */
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Maximum file size in bytes (10 MB)
 * Tamaño máximo de archivo en bytes (10 MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Base multer instance configured with memory storage and validation
 * Instancia base de multer configurada con almacenamiento en memoria y validación
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          400,
          'INVALID_FILE_TYPE',
          'Solo se permiten imágenes JPG, PNG o WebP / Only JPG, PNG or WebP images are allowed'
        )
      );
    }
  },
});

/**
 * Multer middleware configured to accept up to 10 images in the "images" field
 * Middleware multer configurado para aceptar hasta 10 imágenes en el campo "images"
 *
 * @example
 * router.post('/:id/images', uploadImages, handler);
 */
export const uploadImages = uploadMiddleware.array('images', 10);
