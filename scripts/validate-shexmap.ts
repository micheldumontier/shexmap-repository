#!/usr/bin/env tsx
/**
 * CLI: validate a ShExMap file using the same logic as the API.
 * Usage: npx tsx scripts/validate-shexmap.ts path/to/map.shexmap
 */
import { readFileSync } from 'node:fs';
import { validateShExMap } from '../api/src/services/shex.service.js';

const [, , filePath] = process.argv;

if (!filePath) {
  console.error('Usage: npx tsx scripts/validate-shexmap.ts <file>');
  process.exit(1);
}

const content = readFileSync(filePath, 'utf-8');
const result = validateShExMap(content);

if (result.valid) {
  console.log('✓ Valid ShExMap');
  process.exit(0);
} else {
  console.error(`✗ Invalid ShExMap: ${result.error}`);
  process.exit(1);
}
