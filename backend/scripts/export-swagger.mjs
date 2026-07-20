/**
 * Export swagger.json statically for CI/Postman import.
 * Imports the full swagger spec from src/config/swagger.ts.
 *
 * Usage: node scripts/export-swagger.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

try {
  // Import the full swagger spec (includes all components, security schemes, tags)
  const { swaggerSpec } = await import(resolve(root, 'src/config/swagger.ts'));
  const outPath = resolve(root, 'swagger.json');
  writeFileSync(outPath, JSON.stringify(swaggerSpec, null, 2) + '\n');
  console.log(`✓ swagger.json exported → ${outPath}`);
  console.log(`  ${Object.keys(swaggerSpec.paths || {}).length} paths, ${Object.keys(swaggerSpec.components?.schemas || {}).length} schemas`);
} catch (err) {
  console.error('✗ Failed to export swagger.json:', err.message);
  process.exit(1);
}
