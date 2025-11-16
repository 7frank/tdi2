# Vite Plugin DI - E2E Test Scenarios

## Overview
These tests validate HMR (Hot Module Replacement) behavior for the TDI2 Vite plugin by programmatically modifying files and observing browser behavior.

## Test Setup Architecture

```
e2e/
├── TEST_SCENARIOS.md          # This file
├── fixtures/
│   ├── test-app/              # Minimal test application
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx       # App entry point
│   │       ├── App.tsx        # Root component (modified during tests)
│   │       ├── services/
│   │       │   └── CounterService.ts  # Test service (modified during tests)
│   │       └── types/
│   │           └── interfaces.ts      # Service interfaces
│   └── modifications/         # File modifications for tests
│       ├── App-v1.tsx         # Original component
│       ├── App-v2.tsx         # Modified component (text change)
│       ├── CounterService-v1.ts
│       ├── CounterService-v2.ts  # Modified service
│       └── NewService.ts      # New service to add
└── specs/
    ├── hmr.spec.ts            # Main HMR tests
    └── helpers.ts             # Test utilities
```

---

## Test Scenarios

### Scenario 1: Component File Change → HMR (No Full Reload)
**Goal:** Verify that changing a component's JSX triggers HMR without full page reload.

**Steps:**
1. Start Vite dev server with test app
2. Open browser with Playwright
3. Wait for initial render
4. Inject a marker into `window` object (e.g., `window.__hmr_test_id = Math.random()`)
5. Modify `App.tsx` - change text content (e.g., "Hello World" → "Hello HMR")
6. Wait for HMR update event
7. Verify:
   - ✅ Text updated in DOM
   - ✅ `window.__hmr_test_id` unchanged (no full reload)
   - ✅ Console shows HMR update, not full reload

**Expected Logs:**
```
🔄 HMR: Processing App.tsx
   Updated 3 transformed file(s)
   Invalidating 1 module(s)
[vite] hmr update /src/App.tsx
```

---

### Scenario 2: Service File Change → Full Reload
**Goal:** Verify that changing a service file triggers di-config regeneration and full reload.

**Steps:**
1. Start app and inject marker: `window.__service_test_id = Math.random()`
2. Modify `CounterService.ts` - change a method implementation
3. Wait for reload event
4. Verify:
   - ✅ Service behavior changed (new implementation runs)
   - ✅ `window.__service_test_id` changed (full reload occurred)
   - ✅ di-config.ts was regenerated
   - ✅ Console shows service transformation

**Expected Logs:**
```
🔄 HMR: Processing CounterService.ts
   Service changed, running full transformation (including di-config)...
   Full transformation completed, di-config regenerated
   Triggering reload for di-config changes...
[vite] page reload (full reload forced)
```

---

### Scenario 3: Add New Service → Full Reload + Registration
**Goal:** Verify that adding a new service file is detected and registered.

**Steps:**
1. Start app without `LoggerService`
2. Copy `LoggerService.ts` into `src/services/`
3. Modify `App.tsx` to import and use `LoggerServiceInterface`
4. Wait for transformation
5. Verify:
   - ✅ di-config.ts includes new service
   - ✅ App renders without "Service not registered" error
   - ✅ New service is functional

**Expected Logs:**
```
🔄 HMR: Processing LoggerService.ts
   Service changed, running full transformation (including di-config)...
🚀 Running enhanced DI transformation with interface resolution...
✅ Enhanced DI transformation completed
   Triggering reload for di-config changes...
```

---

### Scenario 4: Service Interface Change → Transformation Error → Recovery
**Goal:** Verify error handling when interface changes break type safety.

**Steps:**
1. Start app with `CounterService: CounterServiceInterface`
2. Modify interface to remove a required property
3. Verify:
   - ⚠️ Transformation warning/error logged
   - ⚠️ TypeScript error shown in browser (if applicable)
4. Fix the interface
5. Verify:
   - ✅ Error cleared
   - ✅ App works again

**Expected Logs:**
```
⚠️  Functional DI transformation failed: ...
Error retransforming file during HMR: ...
```

---

### Scenario 5: Component Uses New Service → HMR Works
**Goal:** Verify that after adding a service, components can HMR properly when using it.

**Steps:**
1. Start with existing service
2. Add new service (triggers full reload)
3. After reload, modify component to use new service
4. Modify component again (change text)
5. Verify:
   - ✅ Component HMRs without full reload (step 4)
   - ✅ Service injection works
   - ✅ No "Service not registered" errors

---

### Scenario 6: di-config.ts Change → Dependent Modules Reload
**Goal:** Verify that direct di-config modifications trigger smart invalidation.

**Steps:**
1. Start app
2. Manually modify `.tdi2/di-config.ts` (simulate external change)
3. Verify:
   - ✅ All modules importing di-config are invalidated
   - ✅ HMR used if importers found
   - ✅ Fallback to full reload if no importers

**Expected Logs:**
```
🌉 Bridge file changed: di-config.ts
   Found 2 importers, using HMR
[vite] hmr update /src/main.tsx
```

---

### Scenario 7: Multiple Rapid Changes → Debouncing
**Goal:** Verify that rapid file changes don't cause transformation conflicts.

**Steps:**
1. Start app
2. Rapidly modify service file 3 times in succession
3. Verify:
   - ✅ Only final state is applied
   - ✅ No race conditions
   - ✅ No duplicate transformations

---

### Scenario 8: Service with Dependencies → Cascade Updates
**Goal:** Verify that when a service changes, dependent components update.

**Steps:**
1. Start with `CounterService` → `App.tsx` → `Counter.tsx`
2. Modify `CounterService` method
3. Verify:
   - ✅ Both `App.tsx` and `Counter.tsx` reload
   - ✅ All components using the service update
   - ✅ Module graph correctly identifies dependents

**Expected Logs:**
```
🔄 HMR: Processing CounterService.ts
   Service file changed, finding dependent components...
   Found importer: App.tsx
   Found importer: Counter.tsx
   Invalidating 3 module(s)
```

---

### Scenario 9: Commented Service → Uncommented → Registration
**Goal:** Verify that uncommenting a service triggers registration.

**Steps:**
1. Start with service class commented out:
   ```typescript
   // @Service()
   // export class CounterService { ... }
   ```
2. Uncomment the service and save
3. Verify:
   - ✅ File change detected
   - ✅ Full transformation runs
   - ✅ Service registered in di-config
   - ✅ App works after reload

---

### Scenario 10: Non-exported Service Class → Error Handling
**Goal:** Verify proper error when service class is not exported.

**Steps:**
1. Create service with decorator but no export:
   ```typescript
   @Service()
   class CounterService { ... }  // Missing 'export'
   ```
2. Try to use it in component
3. Verify:
   - ⚠️ Service not found in di-config
   - ⚠️ "Service not registered" error shown
   - ⚠️ Clear error message in console

---

## Test Utilities Needed

### `helpers.ts` should provide:

```typescript
// Start Vite dev server programmatically
async function startDevServer(testAppDir: string): Promise<ViteDevServer>

// Open browser with Playwright
async function openBrowser(url: string): Promise<Page>

// File modification helpers
async function replaceFile(sourcePath: string, targetPath: string): Promise<void>
async function modifyFile(filePath: string, find: string, replace: string): Promise<void>
async function appendToFile(filePath: string, content: string): Promise<void>

// Wait for HMR/reload events
async function waitForHMR(page: Page): Promise<void>
async function waitForFullReload(page: Page): Promise<void>

// Verification helpers
async function expectTextContent(page: Page, selector: string, text: string): Promise<void>
async function expectNoFullReload(page: Page, marker: string): Promise<boolean>
async function expectServiceRegistered(configPath: string, serviceName: string): Promise<boolean>

// Console log capture
function captureConsoleLogs(page: Page): string[]
```

---

## Implementation Priority

1. **High Priority (MVP):**
   - Scenario 1: Component HMR
   - Scenario 2: Service full reload
   - Scenario 3: Add new service

2. **Medium Priority:**
   - Scenario 5: Component uses new service
   - Scenario 8: Dependency cascade
   - Scenario 9: Uncomment service

3. **Low Priority (Edge Cases):**
   - Scenario 4: Error handling
   - Scenario 6: di-config changes
   - Scenario 7: Rapid changes
   - Scenario 10: Non-exported service

---

## Success Criteria

All tests should:
- ✅ Run in CI/CD pipeline
- ✅ Complete in < 30 seconds total
- ✅ Clean up resources (close servers, browsers)
- ✅ Provide clear failure messages
- ✅ Be deterministic (no flaky tests)
