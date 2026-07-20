/**
 * Export swagger.json statically for CI/Postman import.
 * Replicates the swagger-jsdoc config from src/config/swagger.ts.
 *
 * Usage: node scripts/export-swagger.mjs
 */
import swaggerJsdoc from 'swagger-jsdoc';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexo Real API',
      version: '3.2.0',
      description: 'API REST para plataforma Nexo Real',
      contact: {
        name: 'Nexo Real Support',
        email: 'support@nexoreal.com.co',
      },
    },
    servers: [
      {
        url: 'https://api.nexoreal.com.co/api',
        description: 'Production Server',
      },
      {
        url: 'https://staging-api.nexoreal.com.co/api',
        description: 'Staging Server',
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development Server',
      },
    ],
  },
  apis: [
    resolve(root, 'src/routes/*.ts'),
    resolve(root, 'src/controllers/**/*.ts'),
  ],
};

try {
  const spec = swaggerJsdoc(options);
  const outPath = resolve(root, 'swagger.json');
  writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n');
  console.log(`✓ swagger.json exported → ${outPath}`);
  console.log(`  ${Object.keys(spec.paths || {}).length} paths, ${Object.keys(spec.components?.schemas || {}).length} schemas`);
} catch (err) {
  console.error('✗ Failed to export swagger.json:', err.message);
  process.exit(1);
}
