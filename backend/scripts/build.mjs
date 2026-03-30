import * as esbuild from 'esbuild';
import { rename, rm } from 'fs/promises';
import { existsSync } from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/server.js',
  external: [
    'mysql2',
    'bcryptjs',
    'jsonwebtoken',
    'ioredis',
    'dotenv',
    'express',
    'cors',
    'helmet',
    'express-rate-limit',
    'swagger-jsdoc',
    'swagger-ui-express',
    'qrcode',
    'sequelize',
    'pg',
    'pg-hstore',
    // Dependencias que faltaban - se estaban bundeleando innecesariamente
    'axios',
    'csv-parse',
    'node-cron',
    'uuid',
    '@sentry/node',
    // NOT using external for nodemailer - needs types and should be bundled
  ],
  format: 'cjs',
  sourcemap: !isProduction,
  minify: isProduction,
  minifyWhitespace: isProduction,
  minifyIdentifiers: isProduction,
  minifySyntax: isProduction,
  treeShaking: true,
  metafile: true,
  logLevel: 'info',
};

async function build() {
  try {
    // Clean dist folder
    if (existsSync('dist')) {
      await rm('dist', { recursive: true });
    }

    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('👀 Watching for changes...');
    } else {
      const result = await esbuild.build(buildOptions);
      
      // Print bundle size info
      if (result.metafile) {
        const outputs = Object.entries(result.metafile.outputs);
        for (const [file, info] of outputs) {
          const size = (info.bytes / 1024).toFixed(1);
          console.log(`📦 ${file}: ${size} KB`);
        }
      }
      
      console.log('✅ Build complete!');
      console.log('   Output: dist/server.cjs');
      
      // Rename .js to .cjs for CommonJS compatibility
      if (existsSync('dist/server.js')) {
        await rename('dist/server.js', 'dist/server.cjs');
        if (result.metafile) {
          const size = (result.metafile.outputs['dist/server.js']?.bytes || 0) / 1024;
          console.log(`📦 dist/server.cjs: ${size.toFixed(1)} KB (renamed from server.js)`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
