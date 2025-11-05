#!/usr/bin/env node

// Node.js wrapper for TDI2 Debug CLI
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import and execute the actual CLI
import(join(__dirname, '..', 'dist', 'cli.js'));