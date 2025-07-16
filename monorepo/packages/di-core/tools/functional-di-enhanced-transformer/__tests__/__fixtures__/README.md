# Test Fixtures for DI Transformation

This directory contains test fixtures for testing the Functional DI Enhanced Transformer.

## File Naming Convention

- `*.input.tsx` - Input React components to be transformed
- `*.interfaces.ts` - Separate interface definitions
- `*.types.ts` - Additional type definitions
- `__snapshots__/*.transformed.snap.ts` - Generated transformation snapshots

## Fixture Categories

### Basic Inline Interfaces
- `inline-with-destructuring.input.tsx` - Component with destructuring
- `inline-without-destructuring.input.tsx` - Component without destructuring
- `inline-all-required.input.tsx` - All required dependencies
- `inline-mixed-deps.input.tsx` - Mixed DI and non-DI services

### Separate Interfaces
- `separate-interface.input.tsx` - Uses separate interface file
- `separate-interface-arrow.input.tsx` - Arrow function with separate interface
- `imported-interface.input.tsx` - Imports interface from different file

### Edge Cases
- `missing-dependencies.input.tsx` - Missing required/optional dependencies
- `complex-generics.input.tsx` - Complex generic type parameters
- `deep-destructuring.input.tsx` - Deep object destructuring
- `no-services.input.tsx` - No services (should be ignored)
- `empty-services.input.tsx` - Empty services object
- `non-di-services.input.tsx` - Non-DI services (should be ignored)

### Advanced Cases
- `multiple-components.input.tsx` - Multiple components in one file
- `nested-arrow-functions.input.tsx` - Nested function definitions
- `complex-props-spreading.input.tsx` - Complex props with spreading
- `conditional-rendering.input.tsx` - Conditional rendering with services

## Usage

Run the transformation tests:
```bash
npm test
```

Update snapshots:
```bash
npm test -- --updateSnapshots
```

Generate new fixtures:
```bash
./generate-fixtures.sh
```
