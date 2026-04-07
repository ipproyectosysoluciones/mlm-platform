import * as esbuild from 'esbuild';
import { rm, readFile } from 'fs/promises';
import { existsSync } from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

// Mark ALL node_modules as external — avoids CJS/ESM dynamic require() issues
// with SDKs like pino, mercadopago, nodemailer that use require() internally.
// Node resolves them at runtime from node_modules, not bundled.
const pkg = JSON.parse(await readFile('./package.json', 'utf8'));
const externalDeps = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
];

const buildOptions = {
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  outfile: 'dist/server.mjs',
  external: externalDeps,
  format: 'esm',
  sourcemap: !isProduction,
  minify: isProduction,
  minifyWhitespace: isProduction,
  minifyIdentifiers: isProduction,
  minifySyntax: isProduction,
  treeShaking: true,
  legalComments: 'none',
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

      // Explicitly remove sourcemap if it exists (belt-and-suspenders: sourcemap is already
      // disabled in production via sourcemap: !isProduction, but we enforce it here to
      // guarantee no *.map file ever enters the Docker image).
      // Eliminar explícitamente el sourcemap si existe (doble seguro: sourcemap ya está
      // desactivado en producción vía sourcemap: !isProduction, pero lo forzamos aquí para
      // garantizar que ningún archivo *.map entre a la imagen Docker).
      if (isProduction) {
        await rm('dist/server.mjs.map', { force: true });
        console.log('🔒 Sourcemap removed from dist/ (production build)');
      }

      console.log('✅ Build complete!');
      console.log('   Output: dist/server.mjs');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
