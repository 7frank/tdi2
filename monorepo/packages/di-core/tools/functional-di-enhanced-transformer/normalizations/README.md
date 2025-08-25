# Normalization Components

This folder contains focused normalizers that convert complex TypeScript patterns into simpler, more manageable forms.

## Architecture

### Base Classes
- `BaseNormalizer` - Abstract base class with common AST utilities and interfaces

### Specific Normalizers
- `DestructuringNormalizer` - Converts `{ a, b } = props` to `const a = props.a; const b = props.b;`
- `RestParametersNormalizer` - Converts `{ a, ...rest } = props` to helper function patterns
- `AliasNormalizer` - Converts `{ a: b } = props` to `const b = props.a;`

## Design Principles

1. **Single Responsibility** - Each normalizer handles one specific pattern
2. **Testable** - Each normalizer can be tested in isolation
3. **Composable** - Normalizers can be combined in pipelines
4. **Incremental** - Build and validate one normalizer at a time

## Usage

```typescript
const destructuring = new DestructuringNormalizer();
const normalized = destructuring.normalize(sourceFile);
```

## Testing

Each normalizer has its own test suite with dedicated fixtures:
- `DestructuringNormalizer.test.ts`
- `RestParametersNormalizer.test.ts`
- `AliasNormalizer.test.ts`

Run tests individually: `bun test DestructuringNormalizer.test.ts`