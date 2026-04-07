/**
 * @fileoverview Cloudflare R2 configuration — S3-compatible storage
 * @description Configura el cliente S3 apuntando al endpoint de Cloudflare R2.
 *              Configures the S3 client pointing to the Cloudflare R2 endpoint.
 * @module config/r2
 * @author MLM Development Team
 *
 * @example
 * // English: Import the R2 client and bucket name
 * import { r2Client, R2_BUCKET } from './config/r2';
 *
 * // Español: Importar el cliente R2 y el nombre del bucket
 * import { r2Client, R2_BUCKET } from './config/r2';
 */
import { S3Client } from '@aws-sdk/client-s3';

/**
 * S3-compatible client configured to use Cloudflare R2
 * Cliente compatible con S3 configurado para usar Cloudflare R2
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

/**
 * Target R2 bucket name / Nombre del bucket R2 destino
 */
export const R2_BUCKET = process.env.R2_BUCKET ?? 'nexoreal-media';

/**
 * Public base URL for serving R2 assets / URL base pública para servir activos de R2
 */
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? 'https://media.nexoreal.xyz';
