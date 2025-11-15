# E2E Tests for TDI2 Vite Plugin HMR

This directory contains end-to-end tests for validating Hot Module Replacement (HMR) behavior in the TDI2 Vite plugin.

## Overview

These tests use Playwright to programmatically:
1. Set up a minimal test application
2. Start a Vite dev server
3. Modify files (components, services, interfaces)
4. Verify that HMR or full reload occurs correctly
5. Validate that the browser state updates as expected

## Directory Structure

```
e2e/
├── README.md                    # This file
├── TEST_SCENARIOS.md            # Comprehensive test scenario documentation
├── helpers.ts                   # Test utility functions
├── fixtures/
│   ├── test-app/               # Minimal React app with DI
│   │   ├── package.json
│   │   ├── vite.config.ts      # Uses diEnhancedPlugin
│   │   ├── index.html
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── main.tsx        # Entry point with DI initialization
│   │       ├── App.tsx         # Root component
│   │       ├── services/
│   │       │   └── CounterService.ts
│   │       └── types/
│   │           └── interfaces.ts
│   └── modifications/          # Modified file versions for testing
│       ├── App-v1.tsx          # Original App
│       ├── App-v2.tsx          # Modified App (text change)
│       ├── App-with-logger.tsx # App using LoggerService
│       ├── CounterService-v1.ts
│       ├── CounterService-v2.ts # Modified service (behavior change)
│       └── LoggerService.ts    # New service to add during tests
└── specs/
    └── hmr.spec.ts             # Main HMR test specifications
```

## Running Tests

### Run all E2E tests:
```bash
bun run test:e2e
```

### Run with UI mode (interactive):
```bash
bun run test:e2e:ui
```

### Run in headed mode (see browser):
```bash
bun run test:e2e:headed
```

### Run specific test:
```bash
bun run test:e2e --grep "Scenario 1"
```

## Test Scenarios Covered

### ✅ Scenario 1: Component File Change → HMR (No Full Reload)
- Modifies `App.tsx` to change text content
- Verifies HMR update without full page reload
- Checks that window marker persists

### ✅ Scenario 2: Service File Change → Full Reload
- Modifies `CounterService.ts` to change behavior
- Verifies full page reload occurs
- Checks that di-config.ts is regenerated
- Validates new service behavior works

### ✅ Scenario 3: Add New Service → Full Reload + Registration
- Adds `LoggerService.ts` to the project
- Verifies service is registered in di-config.ts
- Modifies App to use new service
- Validates service injection works correctly

### ✅ Scenario 5: Component Uses New Service → HMR Works
- Adds a new service (triggers full reload)
- Modifies component to use new service
- Makes subsequent component change
- Verifies HMR works properly (no full reload for component change)

See [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) for complete scenario documentation.

## How It Works

### 1. Test Setup
Each test creates a temporary directory and copies the fixture app:

```typescript
testAppDir = path.join(os.tmpdir(), `tdi2-test-${Date.now()}`);
await setupTestApp(testAppDir);
```

### 2. Server Start
Starts Vite dev server programmatically:

```typescript
server = await startDevServer(testAppDir);
```

### 3. File Modifications
Tests modify files to trigger HMR:

```typescript
// Replace with modified version
await replaceFile(modifiedAppPath, appPath);

// Add new file
await addFile(loggerSourcePath, loggerTargetPath);
```

### 4. Verification
Tests verify browser state and behavior:

```typescript
// Check text changed
await expect(page.locator('h1')).toHaveText('Hello HMR');

// Verify no full reload (marker still present)
const noReload = await expectNoFullReload(page, markerId);
expect(noReload).toBe(true);
```

### 5. Cleanup
After each test, server is stopped and temp directory cleaned:

```typescript
await stopDevServer(server);
await cleanupTestApp(testAppDir);
```

## Helper Functions

See [helpers.ts](./helpers.ts) for available utilities:

- **Server Management**: `startDevServer()`, `stopDevServer()`
- **File Operations**: `setupTestApp()`, `replaceFile()`, `addFile()`, `modifyFile()`
- **HMR Verification**: `waitForHMR()`, `waitForFullReload()`, `injectReloadMarker()`, `expectNoFullReload()`
- **Service Verification**: `expectServiceRegistered()`
- **Page Interaction**: `waitForAppReady()`, `waitForText()`, `expectTextContent()`

## Key Patterns

### Detecting Full Reload vs HMR

Tests inject a random marker into `window` before making changes:

```typescript
const markerId = await injectReloadMarker(page);
// ... make file changes ...
const noReload = await expectNoFullReload(page, markerId);
```

If marker persists → HMR worked
If marker changed → Full reload occurred

### Service vs Component Detection

The plugin detects service files by the `@Service()` decorator:
- **Service changes** → Full transformation + full reload
- **Component changes** → Fast retransformation + HMR

### Module Graph Invalidation

When files change, Vite's module graph is used to:
1. Find importers of changed files
2. Invalidate affected modules
3. Trigger HMR for dependent components

## Debugging Tests

### View browser during test:
```bash
bun run test:e2e:headed
```

### Use Playwright UI mode:
```bash
bun run test:e2e:ui
```

### Enable verbose Vite logs:
Modify `helpers.ts` and change `logLevel: 'error'` to `logLevel: 'info'`

### Inspect console logs:
```typescript
const logs = captureConsoleLogs(page);
console.log('Browser logs:', logs);
```

## CI Integration

Tests are designed to run in CI:
- Headless by default
- Retries on failure (configured in playwright.config.ts)
- Screenshots on failure
- HTML report generation

## Future Test Scenarios

See [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) for planned scenarios:
- Error handling (Scenario 4)
- di-config direct changes (Scenario 6)
- Rapid file changes / debouncing (Scenario 7)
- Dependency cascade updates (Scenario 8)
- Commented service uncommented (Scenario 9)
- Non-exported service error (Scenario 10)

## Contributing

When adding new tests:
1. Add scenario documentation to TEST_SCENARIOS.md
2. Create necessary file modifications in `fixtures/modifications/`
3. Write test in `specs/hmr.spec.ts`
4. Ensure proper cleanup in `afterEach` hook
5. Add clear assertions and comments

## Troubleshooting

### Port already in use
If tests fail with "port 3000 already in use", check for hanging Vite processes:
```bash
lsof -i :3000
kill -9 <PID>
```

### Temp directory not cleaned
Manually clean up if tests fail:
```bash
rm -rf /tmp/tdi2-test-*
```

### Module not found errors
Build the plugin before running tests:
```bash
bun run build
```
