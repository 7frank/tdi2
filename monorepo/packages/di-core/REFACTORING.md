# TDI2 DI-Core Refactoring Guide

## Current Status ✅ STEP 1 COMPLETED
We've successfully reorganized the internal structure of `di-core` but several cleanup tasks remain.

## Critical Issues to Fix

### 🚨 **Issue 1: Duplicate Test Files & Fixtures (URGENT)**
**Problem**: Test count increased from ~200 to 319 because we copied files but didn't remove originals.

**Files Duplicated**:
```
tools/                              → src/shared/ & src/build-tools/
├── interface-resolver/             → src/shared/interface-resolver/
│   ├── *.test.ts (5 files)        → (copied but originals remain)
│   └── fixtures/                   → (copied but originals remain)
├── functional-di-enhanced-transformer/ → src/build-tools/transformers/
│   ├── __tests__/ (3 test files)  → (copied but originals remain)  
│   └── __fixtures__/ (47 files)   → (copied but originals remain)
└── __tests__/ (3 test files)      → (need to relocate)
```

**Fix Actions**:
- [ ] Remove original test files from `tools/` directories
- [ ] Remove original fixtures from `tools/` directories  
- [ ] Ensure no test logic is lost in the process
- [ ] Verify test count returns to ~200

### 🚨 **Issue 2: Module Resolution Errors in Tests**
**Problem**: Tests fail because they can't find modules after restructuring.

**Failing Imports**:
```typescript
// These paths are now invalid:
'@tdi2/di-core/markers'     → should be '@tdi2/di-core/core/markers'
'@tdi2/di-core/context'     → should be '@tdi2/di-core/react/context'  
'./shared-types'            → should be '../shared/utils/shared-types'
```

**Fix Actions**:
- [ ] Update test fixture imports to use new structure
- [ ] Update test configuration for new module paths
- [ ] Fix relative imports in test files

## Remaining Refactoring Steps

### Step 2: Clean Up Duplicates
```bash
# Remove original test files (after verifying copies work)
rm -rf tools/interface-resolver/*.test.ts
rm -rf tools/interface-resolver/fixtures/
rm -rf tools/functional-di-enhanced-transformer/__tests__/
rm -rf tools/__tests__/

# Keep only the backward-compatibility re-exports
```

### Step 3: Fix Test Module Resolution
- [ ] Update `tsconfig.json` paths for tests
- [ ] Update test imports to new structure
- [ ] Fix fixture file imports
- [ ] Update any hardcoded paths in test utilities

### Step 4: Package.json Updates
- [ ] Verify all exports point to correct new locations
- [ ] Update scripts if they reference old paths
- [ ] Check if any dependencies need updating

### Step 5: Validation & Testing
- [ ] Run full test suite and ensure ~200 tests pass
- [ ] Verify no functionality is broken
- [ ] Test imports work from external packages
- [ ] Validate backward compatibility

### Step 6: Documentation Updates
- [ ] Update README.md with new structure
- [ ] Update any developer documentation
- [ ] Update examples if they reference internal paths

## Post-Refactoring: Package Extraction Preparation

### Future Step 7: Create di-react Package Structure
```
packages/
├── di-core/                    # Core + Shared utilities only
│   ├── src/core/              # Keep
│   ├── src/shared/            # Keep  
│   ├── src/build-tools/       # Move to vite-plugin-di
│   └── src/react/             # Move to di-react
└── di-react/                   # New package
    ├── src/
    │   ├── context/           # From di-core/src/react/
    │   └── hooks/             # From di-core/src/react/
    └── package.json
```

### Future Step 8: Update Import Patterns
```typescript
// Before (current)
import { DIProvider, useService } from '@tdi2/di-core';

// After (future)
import { Service, Inject } from '@tdi2/di-core';
import { DIProvider, useService } from '@tdi2/di-react';
```

## Quick Fix Priority

**🔥 IMMEDIATE (Do these now)**:
1. Remove duplicate test files from `tools/`
2. Fix module resolution in failing tests
3. Verify test count returns to ~200

**📋 NEXT (Do after validation)**:
4. Clean up package.json exports
5. Update documentation
6. Plan package extraction

## Validation Checklist

- [ ] Test count back to ~200
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Backward compatibility maintained
- [ ] No duplicate code
- [ ] Clear separation achieved

## Risk Assessment

**🟢 Low Risk**: Internal restructuring (Step 1) - DONE
**🟡 Medium Risk**: Cleanup & test fixes (Steps 2-6) - IN PROGRESS  
**🔴 High Risk**: Package extraction (Steps 7-8) - FUTURE

---

*This guide will be updated as we progress through each step.*