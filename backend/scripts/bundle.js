import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Create output directory
const outDir = path.join(projectRoot, 'lambda-bundle');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Bundle the search handler with all dependencies
await esbuild.build({
  entryPoints: [path.join(projectRoot, 'dist/handlers/search.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: path.join(outDir, 'handlers'),
  external: [],
  minify: false,
  sourcemap: false,
  banner: {
    js: `
// ESM shims for Lambda
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
`.trim(),
  },
});

// Copy the registry file
fs.copyFileSync(
  path.join(projectRoot, '..', 'brokers.registry.json'),
  path.join(outDir, 'brokers.registry.json')
);

// Create package.json for ESM
fs.writeFileSync(
  path.join(outDir, 'package.json'),
  JSON.stringify({ type: 'module' }, null, 2)
);

console.log('✓ Lambda bundle created at:', outDir);

