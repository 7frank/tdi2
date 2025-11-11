import { Page } from '@playwright/test';
import { createServer, ViteDevServer } from 'vite';
import fs from 'fs-extra';
import path from 'path';

/**
 * Start a Vite dev server programmatically
 */
export async function startDevServer(testAppDir: string): Promise<ViteDevServer> {
  const server = await createServer({
    root: testAppDir,
    configFile: path.join(testAppDir, 'vite.config.ts'),
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        port: 3000,
      },
    },
    logLevel: 'error', // Reduce noise in test output
  });

  await server.listen();
  return server;
}

/**
 * Stop the Vite dev server and clean up
 */
export async function stopDevServer(server: ViteDevServer): Promise<void> {
  await server.close();
}

/**
 * Copy the fixture test app to a temporary directory
 */
export async function setupTestApp(tempDir: string): Promise<void> {
  const fixtureDir = path.join(__dirname, 'fixtures', 'test-app');

  // Clean temp directory if it exists
  if (await fs.pathExists(tempDir)) {
    await fs.remove(tempDir);
  }

  // Copy fixture to temp directory
  await fs.copy(fixtureDir, tempDir);
}

/**
 * Clean up the temporary test directory
 */
export async function cleanupTestApp(tempDir: string): Promise<void> {
  if (await fs.pathExists(tempDir)) {
    await fs.remove(tempDir);
  }
}

/**
 * Replace a file with a modified version
 */
export async function replaceFile(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  await fs.copy(sourcePath, targetPath, { overwrite: true });

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
  await fs.copy(sourcePath, targetPath);

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
  // Wait for React root to render
  await page.waitForSelector('#root > *', { timeout: 10000 });

  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Small additional delay for DI initialization
  await page.waitForTimeout(500);
}
