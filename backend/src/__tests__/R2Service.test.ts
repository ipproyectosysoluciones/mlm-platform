/**
 * @fileoverview Unit tests for R2Service
 * @description Tests for R2Service image upload, delete, and batch upload operations including:
 *              - Image resizing with sharp before upload
 *              - Correct public URL construction with WebP extension
 *              - Correct entity path usage in the R2 key
 *              - Key extraction from URL on delete
 *              - Nested path handling on delete
 *              - Batch upload calling uploadImage per file
 *              - Batch upload returning array of URLs
 *              Tests para las operaciones de subida, eliminación y subida masiva de imágenes de R2Service:
 *              - Redimensionado con sharp antes de la subida
 *              - Construcción correcta de la URL pública con extensión WebP
 *              - Uso correcto de la ruta de entidad en la clave R2
 *              - Extracción de la clave desde la URL al eliminar
 *              - Manejo de rutas anidadas al eliminar
 *              - Subida masiva llamando a uploadImage por archivo
 *              - Subida masiva retornando array de URLs
 * @module __tests__/R2Service
 */

// ============================================
// Mock @aws-sdk/client-s3 before any imports
// ============================================

const mockSend = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest
      .fn()
      .mockImplementation((params) => ({ ...params, __type: 'PutObjectCommand' })),
    DeleteObjectCommand: jest
      .fn()
      .mockImplementation((params) => ({ ...params, __type: 'DeleteObjectCommand' })),
  };
});

// ============================================
// Mock sharp — simulates the fluent chain
// sharp(buffer).resize().webp().toBuffer()
// ============================================

const mockToBuffer = jest.fn().mockResolvedValue(Buffer.from('processed-image'));
const mockWebp = jest.fn().mockReturnValue({ toBuffer: mockToBuffer });
const mockResize = jest.fn().mockReturnValue({ webp: mockWebp });
const mockSharp = jest.fn().mockReturnValue({ resize: mockResize });

jest.mock('sharp', () => mockSharp);

// ============================================
// Mock config/r2 to avoid real credentials
// ============================================

jest.mock('../config/r2', () => ({
  r2Client: { send: mockSend },
  R2_BUCKET: 'test-bucket',
  R2_PUBLIC_URL: 'https://media.nexoreal.xyz',
}));

// ============================================
// Mock crypto uuid to be predictable
// ============================================

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
}));

import { R2Service } from '../services/R2Service';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

describe('R2Service', () => {
  let r2Service: R2Service;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
    mockToBuffer.mockResolvedValue(Buffer.from('processed-image'));
    r2Service = new R2Service();
  });

  // ============================================================
  // uploadImage
  // ============================================================
  describe('uploadImage', () => {
    /**
     * Test 1: should resize image with sharp and upload to R2
     * Verifica que sharp se llama con el buffer original y los parámetros correctos
     */
    it('should resize image with sharp and upload to R2', async () => {
      const buffer = Buffer.from('raw-image-data');

      await r2Service.uploadImage({
        buffer,
        mimetype: 'image/jpeg',
        entityType: 'properties',
        entityId: 'prop-uuid-1',
        filename: 'photo.jpg',
      });

      // Verify sharp was called with the original buffer
      // Verificar que sharp se llamó con el buffer original
      expect(mockSharp).toHaveBeenCalledWith(buffer);

      // Verify resize was called with max 1920px and withoutEnlargement
      // Verificar que resize se llamó con máximo 1920px y withoutEnlargement
      expect(mockResize).toHaveBeenCalledWith({ width: 1920, withoutEnlargement: true });

      // Verify webp quality 85
      // Verificar webp con calidad 85
      expect(mockWebp).toHaveBeenCalledWith({ quality: 85 });

      // Verify toBuffer was called
      // Verificar que se llamó toBuffer
      expect(mockToBuffer).toHaveBeenCalled();

      // Verify send was called (upload happened)
      // Verificar que se llamó send (la subida ocurrió)
      expect(mockSend).toHaveBeenCalled();
    });

    /**
     * Test 2: should return the public URL with webp extension
     * Verifica que la URL retornada es la URL pública correcta con extensión .webp
     */
    it('should return the public URL with webp extension', async () => {
      const url = await r2Service.uploadImage({
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
        entityType: 'properties',
        entityId: 'prop-uuid-1',
        filename: 'photo.png',
      });

      expect(url).toMatch(/^https:\/\/media\.nexoreal\.xyz\//);
      expect(url).toMatch(/\.webp$/);
    });

    /**
     * Test 3: should use correct entity path in the key
     * Verifica que el key de R2 incluye el tipo de entidad y el ID correctamente
     */
    it('should use correct entity path in the key', async () => {
      const url = await r2Service.uploadImage({
        buffer: Buffer.from('data'),
        mimetype: 'image/jpeg',
        entityType: 'tours',
        entityId: 'tour-uuid-99',
        filename: 'banner.jpg',
      });

      // URL should contain {entityType}/{entityId}/{uuid}.webp
      // La URL debe contener {entityType}/{entityId}/{uuid}.webp
      expect(url).toContain('tours/tour-uuid-99/');

      // Verify PutObjectCommand was called with correct key
      // Verificar que PutObjectCommand se llamó con la clave correcta
      const putCallArgs = (PutObjectCommand as jest.Mock).mock.calls[0][0];
      expect(putCallArgs.Key).toMatch(/^tours\/tour-uuid-99\/.+\.webp$/);
      expect(putCallArgs.ContentType).toBe('image/webp');
      expect(putCallArgs.Bucket).toBe('test-bucket');
    });
  });

  // ============================================================
  // deleteImage
  // ============================================================
  describe('deleteImage', () => {
    /**
     * Test 4: should extract key from URL and call DeleteObjectCommand
     * Verifica que la clave se extrae correctamente de la URL pública simple
     */
    it('should extract key from URL and call DeleteObjectCommand', async () => {
      const imageUrl = 'https://media.nexoreal.xyz/properties/prop-uuid/abc123.webp';

      await r2Service.deleteImage(imageUrl);

      const deleteCallArgs = (DeleteObjectCommand as jest.Mock).mock.calls[0][0];
      expect(deleteCallArgs.Key).toBe('properties/prop-uuid/abc123.webp');
      expect(deleteCallArgs.Bucket).toBe('test-bucket');
      expect(mockSend).toHaveBeenCalled();
    });

    /**
     * Test 5: should handle URLs with nested paths
     * Verifica que URLs con rutas anidadas se procesan correctamente
     */
    it('should handle URLs with nested paths', async () => {
      const imageUrl = 'https://media.nexoreal.xyz/tours/tour-abc/nested/path/file.webp';

      await r2Service.deleteImage(imageUrl);

      const deleteCallArgs = (DeleteObjectCommand as jest.Mock).mock.calls[0][0];
      expect(deleteCallArgs.Key).toBe('tours/tour-abc/nested/path/file.webp');
    });
  });

  // ============================================================
  // uploadImages
  // ============================================================
  describe('uploadImages', () => {
    /**
     * Test 6: should call uploadImage for each file
     * Verifica que uploadImage se llama una vez por cada archivo
     */
    it('should call uploadImage for each file', async () => {
      const uploadImageSpy = jest
        .spyOn(r2Service, 'uploadImage')
        .mockResolvedValue('https://media.nexoreal.xyz/test.webp');

      const files = [
        { buffer: Buffer.from('file1'), mimetype: 'image/jpeg', originalname: 'a.jpg' },
        { buffer: Buffer.from('file2'), mimetype: 'image/png', originalname: 'b.png' },
        { buffer: Buffer.from('file3'), mimetype: 'image/webp', originalname: 'c.webp' },
      ];

      await r2Service.uploadImages({
        files,
        entityType: 'properties',
        entityId: 'prop-uuid-batch',
      });

      expect(uploadImageSpy).toHaveBeenCalledTimes(3);

      expect(uploadImageSpy).toHaveBeenNthCalledWith(1, {
        buffer: files[0].buffer,
        mimetype: 'image/jpeg',
        entityType: 'properties',
        entityId: 'prop-uuid-batch',
        filename: 'a.jpg',
      });

      expect(uploadImageSpy).toHaveBeenNthCalledWith(2, {
        buffer: files[1].buffer,
        mimetype: 'image/png',
        entityType: 'properties',
        entityId: 'prop-uuid-batch',
        filename: 'b.png',
      });
    });

    /**
     * Test 7: should return array of URLs
     * Verifica que el método retorna un array con todas las URLs resultantes
     */
    it('should return array of URLs', async () => {
      const expectedUrls = [
        'https://media.nexoreal.xyz/properties/uuid/img1.webp',
        'https://media.nexoreal.xyz/properties/uuid/img2.webp',
      ];

      jest
        .spyOn(r2Service, 'uploadImage')
        .mockResolvedValueOnce(expectedUrls[0])
        .mockResolvedValueOnce(expectedUrls[1]);

      const files = [
        { buffer: Buffer.from('f1'), mimetype: 'image/jpeg', originalname: 'x.jpg' },
        { buffer: Buffer.from('f2'), mimetype: 'image/jpeg', originalname: 'y.jpg' },
      ];

      const result = await r2Service.uploadImages({
        files,
        entityType: 'properties',
        entityId: 'prop-uuid-arr',
      });

      expect(result).toEqual(expectedUrls);
      expect(result).toHaveLength(2);
    });
  });
});
