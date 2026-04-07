/**
 * @fileoverview R2Service - Cloudflare R2 image upload and management
 * @description Service for uploading, resizing, and deleting images using Cloudflare R2
 *              (S3-compatible storage). Images are auto-resized to WebP format.
 *              Servicio para subir, redimensionar y eliminar imágenes usando Cloudflare R2
 *              (almacenamiento compatible con S3). Las imágenes se redimensionan automáticamente a WebP.
 * @module services/R2Service
 * @author MLM Development Team
 *
 * @example
 * // English: Upload a single image to a property
 * const r2 = new R2Service();
 * const url = await r2.uploadImage({ buffer, mimetype: 'image/jpeg', entityType: 'properties', entityId: 'uuid', filename: 'photo.jpg' });
 *
 * // Español: Subir una imagen a una propiedad
 * const r2 = new R2Service();
 * const url = await r2.uploadImage({ buffer, mimetype: 'image/jpeg', entityType: 'properties', entityId: 'uuid', filename: 'foto.jpg' });
 */
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../config/r2';

// ============================================
// TYPES
// ============================================

/**
 * Parameters for uploading a single image
 * Parámetros para subir una sola imagen
 */
export interface UploadImageParams {
  /** Raw image buffer / Buffer de imagen sin procesar */
  buffer: Buffer;
  /** MIME type of the image / Tipo MIME de la imagen */
  mimetype: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Entity type that owns the image / Tipo de entidad propietaria de la imagen */
  entityType: 'properties' | 'tours';
  /** UUID of the owning entity / UUID de la entidad propietaria */
  entityId: string;
  /** Original filename / Nombre de archivo original */
  filename: string;
}

/**
 * Parameters for uploading multiple images
 * Parámetros para subir múltiples imágenes
 */
export interface UploadImagesParams {
  /** Array of file objects / Array de objetos de archivo */
  files: Array<{ buffer: Buffer; mimetype: string; originalname: string }>;
  /** Entity type that owns the images / Tipo de entidad propietaria de las imágenes */
  entityType: 'properties' | 'tours';
  /** UUID of the owning entity / UUID de la entidad propietaria */
  entityId: string;
}

// ============================================
// SERVICE CLASS
// ============================================

/**
 * R2Service - Handles Cloudflare R2 image storage operations
 * R2Service - Gestiona las operaciones de almacenamiento de imágenes en Cloudflare R2
 */
export class R2Service {
  /**
   * Upload a single image to R2 with auto-resize
   * Sube una imagen a R2 con resize automático
   *
   * @description Resizes the image to max 1920px width (maintaining aspect ratio),
   *              converts to WebP at quality 85, then uploads to R2.
   *              Redimensiona la imagen a máximo 1920px de ancho (manteniendo proporción),
   *              convierte a WebP con calidad 85, luego sube a R2.
   *
   * @param params - Upload parameters / Parámetros de subida
   * @returns Full public URL of the uploaded image / URL pública completa de la imagen subida
   *
   * @example
   * const url = await r2Service.uploadImage({
   *   buffer: req.file.buffer,
   *   mimetype: 'image/jpeg',
   *   entityType: 'properties',
   *   entityId: 'prop-uuid',
   *   filename: 'facade.jpg',
   * });
   * // returns 'https://media.nexoreal.xyz/properties/prop-uuid/550e8400.webp'
   */
  async uploadImage(params: UploadImageParams): Promise<string> {
    const { buffer, entityType, entityId } = params;

    // Resize to max 1920px, convert to webp quality 85
    // Redimensionar a máx 1920px, convertir a webp calidad 85
    const processedBuffer = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique storage key: {entityType}/{entityId}/{uuid}.webp
    // Generar clave única de almacenamiento: {entityType}/{entityId}/{uuid}.webp
    const key = `${entityType}/${entityId}/${randomUUID()}.webp`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: processedBuffer,
        ContentType: 'image/webp',
      })
    );

    return `${R2_PUBLIC_URL}/${key}`;
  }

  /**
   * Delete an image from R2 by its public URL
   * Elimina una imagen de R2 por su URL pública
   *
   * @description Extracts the storage key from the full URL and sends a delete command.
   *              Extrae la clave de almacenamiento de la URL completa y envía un comando de eliminación.
   *
   * @param imageUrl - Full public URL of the image to delete / URL pública completa de la imagen a eliminar
   * @returns Promise that resolves when deletion is complete / Promesa que resuelve cuando la eliminación completa
   *
   * @example
   * await r2Service.deleteImage('https://media.nexoreal.xyz/properties/uuid/550e8400.webp');
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // Extract key by removing the base URL prefix
    // Extraer la clave eliminando el prefijo de la URL base
    const key = imageUrl.replace(`${R2_PUBLIC_URL}/`, '');

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
  }

  /**
   * Upload multiple images (max 10), returns array of public URLs
   * Sube múltiples imágenes (máx 10), retorna array de URLs públicas
   *
   * @description Processes each file sequentially through uploadImage.
   *              Procesa cada archivo secuencialmente a través de uploadImage.
   *
   * @param params - Multi-upload parameters / Parámetros de subida múltiple
   * @returns Array of public URLs for each uploaded image / Array de URLs públicas de cada imagen subida
   *
   * @example
   * const urls = await r2Service.uploadImages({
   *   files: req.files as Express.Multer.File[],
   *   entityType: 'properties',
   *   entityId: 'prop-uuid',
   * });
   * // returns ['https://media.nexoreal.xyz/properties/uuid/a.webp', ...]
   */
  async uploadImages(params: UploadImagesParams): Promise<string[]> {
    const { files, entityType, entityId } = params;
    const urls: string[] = [];

    for (const file of files) {
      const url = await this.uploadImage({
        buffer: file.buffer,
        mimetype: file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp',
        entityType,
        entityId,
        filename: file.originalname,
      });
      urls.push(url);
    }

    return urls;
  }
}
