#!/usr/bin/env node

/**
 * fix-imports.mjs — Add .js extensions to relative ESM imports in TypeScript files.
 *
 * Path-aware: resolves each import target to check whether it's a file or a
 * directory with an index.ts, producing the correct .js extension.
 *
 * Handles:
 *   - Single, double, and backtick quotes
 *   - `import type` statements
 *   - Dynamic `import()` calls
 *   - Re-export `export { ... } from '...'` and `export * from '...'`
 *
 * Skips:
 *   - Non-relative imports (package imports, absolute paths)
 *   - Imports that already have an extension (.js, .ts, .json, .mjs, .cjs)
 *   - node_modules and dist directories
 *   - Test files (*.test.ts, *.spec.ts)
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { readdirSync } from 'node:fs';

const SRC_DIR = resolve(process.cwd(), 'src');

// Files to skip
const SKIP_PATTERNS = [/\.test\.ts$/, /\.spec\.ts$/, /node_modules/, /dist\//];

// Already has a known extension — do not append .js
const HAS_EXTENSION = /\.(js|ts|mjs|cjs|json)$/i;

/**
 * Recursively collect all .ts files under dir, skipping ignored paths.
 */
function collectTsFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_PATTERNS.some((p) => p.test(full))) continue;
      collectTsFiles(full, files);
    } else if (entry.endsWith('.ts') && !SKIP_PATTERNS.some((p) => p.test(full))) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Resolve a relative import specifier to the correct .js path.
 * - If `./foo.ts` exists → `./foo.js`
 * - If `./foo/index.ts` exists → `./foo/index.js`
 * - If neither exists → return null (will be handled by Phase B)
 */
function resolveSpecifier(specifier, fromFile) {
  const fromDir = dirname(fromFile);
  const resolved = resolve(fromDir, specifier);

  // Case 1: Direct .ts file
  if (existsSync(resolved + '.ts')) {
    return specifier + '.js';
  }

  // Case 2: Directory with index.ts
  if (existsSync(join(resolved, 'index.ts'))) {
    return specifier + '/index.js';
  }

  // Neither — leave unchanged (Phase B territory)
  return null;
}

/**
 * Add .js to a bare relative import specifier.
 * Returns null if the specifier cannot be resolved.
 */
function addJsExtension(specifier, fromFile) {
  // Already has extension
  if (HAS_EXTENSION.test(specifier)) return specifier;
  // Non-relative (package import or absolute)
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return specifier;
  return resolveSpecifier(specifier, fromFile);
}

/**
 * Rewrite a single import/export line.
 */
function rewriteLine(line, fromFile) {
  const IMPORT_RE =
    /((?:import\s+type\s+|import\s+(?:\{[^}]*\}|\w+\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+|export\s+(?:\{[^}]*\}\s+from\s+|\*\s+from\s+|default\s+from\s+)?|(?:\bfrom\s+|import\s*\()))(["'`])([^"'`]*?)(\2)([;\s)]*)/g;

  let changed = false;

  const result = line.replace(IMPORT_RE, (match, prefix, quote, specifier, _closeQuote, suffix) => {
    const fixed = addJsExtension(specifier, fromFile);
    if (fixed === null) return match; // unresolvable — skip
    if (fixed !== specifier) changed = true;
    return `${prefix}${quote}${fixed}${quote}${suffix}`;
  });

  return { result, changed };
}

// --- Main ---

const files = collectTsFiles(SRC_DIR);
let totalFiles = 0;
let totalChanges = 0;
let skippedUnresolvable = 0;

for (const filePath of files) {
  const original = readFileSync(filePath, 'utf-8');
  const lines = original.split('\n');
  let fileChanged = false;

  const rewritten = lines.map((line) => {
    const { result, changed } = rewriteLine(line, filePath);
    if (changed) fileChanged = true;
    if (!changed && result === line) {
      // Check if it was an unresolvable relative import (for stats only)
      const fromQuote = /from\s+["'`](\.[^"'`]+)["'`]/.exec(line);
      const dynamicImport = /import\s*\(\s*["'`](\.[^"'`]+)["'`]\s*\)/.exec(line);
      const target = fromQuote?.[1] || dynamicImport?.[1];
      if (target && !HAS_EXTENSION.test(target) && !addJsExtension(target, filePath)) {
        skippedUnresolvable++;
      }
    }
    return result;
  });

  if (fileChanged) {
    writeFileSync(filePath, rewritten.join('\n'), 'utf-8');
    totalFiles++;
    const changes = lines.filter((l, i) => l !== rewritten[i]).length;
    totalChanges += changes;
  }
}

console.log(`\n✅ fix-imports complete:`);
console.log(`   Files modified: ${totalFiles}`);
console.log(`   Imports rewritten: ${totalChanges}`);
if (skippedUnresolvable > 0) {
  console.log(`   Skipped (unresolvable): ${skippedUnresolvable} — Phase B territory`);
}
