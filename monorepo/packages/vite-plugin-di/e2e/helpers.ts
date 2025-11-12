import { Page } from '@playwright/test';
import { createServer, ViteDevServer } from 'vite';
import { promises as fsPromises } from 'fs';
import * as pathModule from 'path';

// Create fs and path references
const fs = fsPromises;
const path = pathModule;

// Use a different approach - get __dirname from the current working directory
// In Playwright's CommonJS context, __dirname should be available globally
declare const __dirname: string;

/**
 * Helper to check if a path exists
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to recursively copy a directory
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Helper to recursively remove a directory
 */
async function removeDir(dir: string): Promise<void> {
  if (await pathExists(dir)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

/**
 * Start a Vite dev server programmatically
 */
export async function startDevServer(testAppDir: string): Promise<{ server: ViteDevServer; port: number }> {
  // Use random port to avoid conflicts when tests run in parallel
  const port = 3000 + Math.floor(Math.random() * 1000);

  const server = await createServer({
    root: testAppDir,
    configFile: path.join(testAppDir, 'vite.config.ts'),
    server: {
      port,
      strictPort: false, // Allow fallback to another port
      hmr: {
        port,
      },
    },
    logLevel: 'error', // Reduce noise in test output
  });

  await server.listen();

  // Get the actual port (might be different if strictPort is false)
  const actualPort = (server.config.server.port || port) as number;

  // Give the plugin time to generate di-config
  await new Promise(resolve => setTimeout(resolve, 2000));

  return { server, port: actualPort };
}

/**
 * Stop the Vite dev server and clean up
 */
export async function stopDevServer(server: ViteDevServer): Promise<void> {
  await server.close();
}

/**
 * Copy the fixture test app to a temporary directory and set up dependencies
 */
export async function setupTestApp(tempDir: string): Promise<void> {
  const fixtureDir = path.join(__dirname, 'fixtures', 'test-app');

  // Clean temp directory if it exists
  if (await pathExists(tempDir)) {
    await removeDir(tempDir);
  }

  // Copy fixture to temp directory
  await copyDir(fixtureDir, tempDir);

  // Symlink node_modules from monorepo root to temp directory
  // This gives access to all workspace packages
  const monorepoRoot = path.resolve(__dirname, '../../..');
  const monorepoNodeModules = path.join(monorepoRoot, 'node_modules');
  const tempNodeModules = path.join(tempDir, 'node_modules');

  // Create symlink to monorepo node_modules
  if (await pathExists(monorepoNodeModules)) {
    await fs.symlink(monorepoNodeModules, tempNodeModules, 'dir');
  }
}

/**
 * Clean up the temporary test directory
 */
export async function cleanupTestApp(tempDir: string): Promise<void> {
  if (await pathExists(tempDir)) {
    await removeDir(tempDir);
  }
}

/**
 * Replace a file with a modified version
 */
export async function replaceFile(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  await fs.copyFile(sourcePath, targetPath);

  // Small delay to ensure file system change is detected
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Modify a file by find/replace
 */
export async function modifyFile(
  filePath: string,
  find: string,
  replace: string
): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  const newContent = content.replace(find, replace);
  await fs.writeFile(filePath, newContent, 'utf-8');

  // Small delay to ensure file system change is detected
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Append content to a file
 */
export async function appendToFile(
  filePath: string,
  content: string
): Promise<void> {
  await fs.appendFile(filePath, content, 'utf-8');

  // Small delay to ensure file system change is detected
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Copy a new file into the test app
 */
export async function addFile(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  await fs.copyFile(sourcePath, targetPath);

  // Small delay to ensure file system change is detected
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Wait for HMR update to complete
 */
export async function waitForHMR(page: Page, timeout = 5000): Promise<void> {
  try {
    await page.waitForEvent('console', {
      predicate: msg => msg.text().includes('[vite] hmr update'),
      timeout,
    });

    // Additional small delay for React to finish rendering
    await page.waitForTimeout(200);
  } catch (error) {
    // If we didn't see the HMR message, just wait a bit
    await page.waitForTimeout(1000);
  }
}

/**
 * Wait for full page reload
 */
export async function waitForFullReload(page: Page, timeout = 5000): Promise<void> {
  try {
    await page.waitForEvent('console', {
      predicate: msg =>
        msg.text().includes('[vite] page reload') ||
        msg.text().includes('full-reload'),
      timeout,
    });

    // Wait for page to reload
    await page.waitForLoadState('networkidle');
  } catch (error) {
    // Fallback: just wait for network idle
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Inject a marker into window object to detect full reloads
 */
export async function injectReloadMarker(page: Page, markerName = '__hmr_test_id'): Promise<string> {
  const markerId = Math.random().toString(36).substring(7);
  await page.evaluate(({ name, id }) => {
    (window as any)[name] = id;
  }, { name: markerName, id: markerId });

  return markerId;
}

/**
 * Check if the reload marker is still present (no full reload occurred)
 */
export async function expectNoFullReload(
  page: Page,
  markerId: string,
  markerName = '__hmr_test_id'
): Promise<boolean> {
  const currentId = await page.evaluate(({ name }) => {
    return (window as any)[name];
  }, { name: markerName });

  return currentId === markerId;
}

/**
 * Check if a service is registered in di-config
 */
export async function expectServiceRegistered(
  configPath: string,
  serviceName: string
): Promise<boolean> {
  const content = await fs.readFile(configPath, 'utf-8');
  return content.includes(serviceName);
}

/**
 * Capture console logs from the browser
 */
export function captureConsoleLogs(page: Page): string[] {
  const logs: string[] = [];

  page.on('console', msg => {
    logs.push(msg.text());
  });

  return logs;
}

/**
 * Wait for specific text to appear on the page
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (searchText) => document.body.textContent?.includes(searchText),
    text,
    { timeout }
  );
}

/**
 * Verify text content in a selector
 */
export async function expectTextContent(
  page: Page,
  selector: string,
  expectedText: string
): Promise<boolean> {
  const element = await page.locator(selector);
  const text = await element.textContent();
  return text?.includes(expectedText) ?? false;
}

/**
 * Wait for the test app to be fully loaded and initialized
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Capture console errors
  const errors: string[] = [];
  page.on('pageerror', err => {
    errors.push(err.message);
    console.error('Browser error:', err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Browser console error:', msg.text());
    }
  });

  // Wait for React root to render
  try {
    await page.waitForSelector('#root > *', { timeout: 10000 });
  } catch (error) {
    console.error('Failed to find #root > *, page errors:', errors);
    // Check if there's anything in the root at all
    const rootHTML = await page.$eval('#root', el => el.innerHTML).catch(() => 'Could not read root');
    console.error('Root HTML:', rootHTML);
    throw error;
  }

  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Small additional delay for DI initialization
  await page.waitForTimeout(500);
}
