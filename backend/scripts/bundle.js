import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Create output directory
const outDir = path.join(projectRoot, 'lambda-bundle');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}
fs.mkdirSync(outDir, { recursive: true });

console.log('Building Lambda bundle with headless browser support...');

// Bundle the search handler with all dependencies
// Using CommonJS format to handle packages with dynamic require
await esbuild.build({
  entryPoints: [path.join(projectRoot, 'dist/handlers/search.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs', // Use CommonJS to avoid dynamic require issues
  outfile: path.join(outDir, 'handlers/search.js'),
  external: [
    '@sparticuz/chromium', // Keep external - will be installed separately
  ],
  minify: false,
  sourcemap: false,
});

// Copy the registry file
fs.copyFileSync(
  path.join(projectRoot, '..', 'brokers.registry.json'),
  path.join(outDir, 'brokers.registry.json')
);

// Create package.json with @sparticuz/chromium dependency (no type: module for CJS)
const packageJson = {
  dependencies: {
    '@sparticuz/chromium': '^123.0.0',
  },
};
fs.writeFileSync(
  path.join(outDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Install @sparticuz/chromium in the bundle directory
console.log('Installing @sparticuz/chromium...');
execSync('npm install --omit=dev', {
  cwd: outDir,
  stdio: 'inherit',
});

console.log('✓ Lambda bundle created at:', outDir);
console.log('  Bundle includes @sparticuz/chromium with Chromium binary');
