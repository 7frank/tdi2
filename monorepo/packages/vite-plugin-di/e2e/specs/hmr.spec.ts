import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';
import {
  startDevServer,
  stopDevServer,
  setupTestApp,
  cleanupTestApp,
  replaceFile,
  addFile,
  waitForHMR,
  waitForFullReload,
  injectReloadMarker,
  expectNoFullReload,
  expectServiceRegistered,
  waitForAppReady,
  waitForText,
} from '../helpers';
import { ViteDevServer } from 'vite';

let server: ViteDevServer;
let testAppDir: string;

test.beforeEach(async () => {
  // Create a unique temp directory for this test
  testAppDir = path.join(os.tmpdir(), `tdi2-test-${Date.now()}`);

  // Set up the test app
  await setupTestApp(testAppDir);
});

test.afterEach(async () => {
  // Clean up server
  if (server) {
    await stopDevServer(server);
  }

  // Clean up test directory
  await cleanupTestApp(testAppDir);
});

test.describe('Vite Plugin DI - HMR Tests', () => {
  test('Scenario 1: Component file change triggers HMR without full reload', async ({ page }) => {
    // Start Vite dev server
    server = await startDevServer(testAppDir);

    // Open browser
    await page.goto('http://localhost:3000');
    await waitForAppReady(page);

    // Verify initial state
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Hello World');

    // Inject marker to detect full reload
    const markerId = await injectReloadMarker(page);

    // Modify App.tsx - change "Hello World" to "Hello HMR"
    const appPath = path.join(testAppDir, 'src', 'App.tsx');
    const modifiedAppPath = path.join(__dirname, '..', 'fixtures', 'modifications', 'App-v2.tsx');
    await replaceFile(modifiedAppPath, appPath);

    // Wait for HMR update
    await waitForHMR(page);

    // Verify text updated
    await expect(h1).toHaveText('Hello HMR');

    // Verify no full reload occurred
    const noReload = await expectNoFullReload(page, markerId);
    expect(noReload).toBe(true);
  });

  test('Scenario 2: Service file change triggers full reload', async ({ page }) => {
    // Start Vite dev server
    server = await startDevServer(testAppDir);

    // Open browser
    await page.goto('http://localhost:3000');
    await waitForAppReady(page);

    // Click increment to set counter to 1
    await page.click('[data-testid="increment-btn"]');
    await expect(page.locator('h2')).toContainText('Counter: 1');

    // Inject marker to detect full reload
    const markerId = await injectReloadMarker(page);

    // Modify CounterService.ts - change increment behavior
    const servicePath = path.join(testAppDir, 'src', 'services', 'CounterService.ts');
    const modifiedServicePath = path.join(
      __dirname,
      '..',
      'fixtures',
      'modifications',
      'CounterService-v2.ts'
    );
    await replaceFile(modifiedServicePath, servicePath);

    // Wait for full reload
    await waitForFullReload(page);

    // Verify marker changed (full reload occurred)
    const noReload = await expectNoFullReload(page, markerId);
    expect(noReload).toBe(false);

    // Verify service behavior changed - should increment by 2 now
    await page.click('[data-testid="increment-btn"]');
    await expect(page.locator('h2')).toContainText('Counter: 2');

    // Click again to verify it's incrementing by 2
    await page.click('[data-testid="increment-btn"]');
    await expect(page.locator('h2')).toContainText('Counter: 4');

    // Verify message changed
    await expect(page.locator('[data-testid="counter-message"]')).toContainText(
      'Count increased by 2'
    );

    // Verify di-config was regenerated
    const diConfigPath = path.join(testAppDir, 'src', '.tdi2', 'di-config.ts');
    const serviceRegistered = await expectServiceRegistered(diConfigPath, 'CounterService');
    expect(serviceRegistered).toBe(true);
  });

  test('Scenario 3: Add new service triggers full reload and registration', async ({ page }) => {
    // Start Vite dev server
    server = await startDevServer(testAppDir);

    // Open browser
    await page.goto('http://localhost:3000');
    await waitForAppReady(page);

    // Verify initial state - no logger UI
    const logsSection = page.locator('[data-testid="logs"]');
    await expect(logsSection).toHaveCount(0);

    // Inject marker
    const markerId = await injectReloadMarker(page);

    // Add LoggerService.ts
    const loggerSourcePath = path.join(
      __dirname,
      '..',
      'fixtures',
      'modifications',
      'LoggerService.ts'
    );
    const loggerTargetPath = path.join(testAppDir, 'src', 'services', 'LoggerService.ts');
    await addFile(loggerSourcePath, loggerTargetPath);

    // Wait for service to be detected
    await page.waitForTimeout(2000);

    // Verify di-config includes new service
    const diConfigPath = path.join(testAppDir, 'src', '.tdi2', 'di-config.ts');
    const loggerRegistered = await expectServiceRegistered(diConfigPath, 'LoggerService');
    expect(loggerRegistered).toBe(true);

    // Modify App.tsx to use LoggerService
    const appWithLoggerPath = path.join(
      __dirname,
      '..',
      'fixtures',
      'modifications',
      'App-with-logger.tsx'
    );
    const appPath = path.join(testAppDir, 'src', 'App.tsx');
    await replaceFile(appWithLoggerPath, appPath);

    // Wait for full reload
    await waitForFullReload(page);

    // Verify full reload occurred
    const noReload = await expectNoFullReload(page, markerId);
    expect(noReload).toBe(false);

    // Verify app renders with logger
    await waitForAppReady(page);
    const logsAfter = page.locator('[data-testid="logs"]');
    await expect(logsAfter).toHaveCount(1);

    // Test logger functionality
    await page.click('[data-testid="increment-btn"]');
    await waitForText(page, 'Incremented counter');

    // Verify log appears
    await expect(page.locator('[data-testid="logs"]')).toContainText('Incremented counter');
  });

  test('Scenario 5: Component uses new service then HMRs properly', async ({ page }) => {
    // Start Vite dev server
    server = await startDevServer(testAppDir);

    // Open browser
    await page.goto('http://localhost:3000');
    await waitForAppReady(page);

    // Step 1: Add new service (triggers full reload)
    const loggerSourcePath = path.join(
      __dirname,
      '..',
      'fixtures',
      'modifications',
      'LoggerService.ts'
    );
    const loggerTargetPath = path.join(testAppDir, 'src', 'services', 'LoggerService.ts');
    await addFile(loggerSourcePath, loggerTargetPath);

    // Step 2: Modify component to use new service
    const appWithLoggerPath = path.join(
      __dirname,
      '..',
      'fixtures',
      'modifications',
      'App-with-logger.tsx'
    );
    const appPath = path.join(testAppDir, 'src', 'App.tsx');
    await replaceFile(appWithLoggerPath, appPath);

    // Wait for reload
    await waitForFullReload(page);
    await waitForAppReady(page);

    // Verify component works with new service
    await page.click('[data-testid="increment-btn"]');
    await expect(page.locator('[data-testid="logs"]')).toContainText('Incremented counter');

    // Step 3: Inject marker for HMR test
    const markerId = await injectReloadMarker(page);

    // Step 4: Modify component again (just text change)
    const appPath2 = path.join(testAppDir, 'src', 'App.tsx');
    const modifiedAppPath = path.join(__dirname, '..', 'fixtures', 'modifications', 'App-v2.tsx');

    // First read current content, then modify just the h1
    const { promises: fs } = await import('fs');
    let content = await fs.readFile(appPath2, 'utf-8');
    content = content.replace('<h1>Hello World</h1>', '<h1>Hello HMR</h1>');
    await fs.writeFile(appPath2, content, 'utf-8');

    // Wait for HMR (not full reload)
    await waitForHMR(page);

    // Verify text changed
    await expect(page.locator('h1')).toHaveText('Hello HMR');

    // Verify no full reload (HMR worked)
    const noReload = await expectNoFullReload(page, markerId);
    expect(noReload).toBe(true);

    // Verify service still works
    await page.click('[data-testid="decrement-btn"]');
    await expect(page.locator('[data-testid="logs"]')).toContainText('Decremented counter');
  });
});
