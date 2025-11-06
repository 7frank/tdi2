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

## Integration with Transformation Pipeline

### Current Problem
The existing `transformation-pipeline.ts` has a complex `transformComponent` method with multiple steps that mix destructuring normalization with DI transformations, leading to:
- Duplicate destructuring statements
- Invalid TypeScript generation
- Complex debugging
- Brittle transformation logic

### Proposed Solution: Pre-normalization Phase

Instead of mixing normalization with DI logic, we propose adding a **pre-normalization phase** before the main DI transformations:

```typescript
transformComponent(
  func: FunctionDeclaration | ArrowFunction,
  dependencies: ExtractedDependency[],
  sourceFile: SourceFile
): void {
  // NEW: Step 0 - Pre-normalize all destructuring patterns
  this.preNormalizeDestructuring(func);
  
  // Step 1: Enhance dependencies with resolved implementations
  const enhancedDependencies = this.enhanceDependenciesWithResolution(dependencies);
  
  // Step 2: Normalize parameters (now much simpler)
  this.normalizeParameters(func);
  
  // Step 3: Generate DI hook calls (no destructuring conflicts)
  this.generateDIHookCalls(func, enhancedDependencies);
  
  // Step 4: Update property access expressions
  this.propertyUpdater.updatePropertyAccessAdvanced(func, enhancedDependencies);
  
  // Step 5: Validate transformation
  this.validateTransformation(func, enhancedDependencies);
}
```

### Pre-normalization Implementation

```typescript
private preNormalizeDestructuring(func: FunctionDeclaration | ArrowFunction): void {
  const sourceFile = func.getSourceFile();
  
  // Apply normalizers in sequence
  const destructuringNormalizer = new DestructuringNormalizer({ verbose: this.options.verbose });
  const aliasNormalizer = new AliasNormalizer({ verbose: this.options.verbose });
  const restParametersNormalizer = new RestParametersNormalizer({ verbose: this.options.verbose });
  
  // Normalize in order: aliases first, then rest parameters, then simple destructuring
  aliasNormalizer.normalize(sourceFile);
  restParametersNormalizer.normalize(sourceFile);
  destructuringNormalizer.normalize(sourceFile);
  
  if (this.options.verbose) {
    console.log("✅ Pre-normalization completed - all destructuring converted to property access");
  }
}
```

### Steps to Remove/Simplify

The following complex methods can be **removed** or **greatly simplified** after pre-normalization:

1. **Remove Complex Methods:**
   - `extractNonDIParameterVariablesBeforeNormalization()` - No longer needed
   - `generateDIHookCallsAndPreserveDestructuring()` - Simplify to just generate DI hooks
   - `extractNonDIDestructuring()` - No destructuring left to preserve
   - `removeOnlyDIDestructuring()` - No destructuring left to remove
   - `removeConflictingDestructuring()` - No conflicts after pre-normalization
   - `removeOriginalDestructuringThatWillBePreserved()` - No longer needed

2. **Simplify Methods:**
   - `normalizeParameters()` - Only handle simple parameter renaming
   - `generateDIHookStatementsWithOptionalChaining()` - Focus purely on DI logic
   - Property access updating becomes more predictable

### Benefits

1. **Separation of Concerns** - Destructuring normalization is completely separate from DI logic
2. **Predictable State** - After pre-normalization, we know exactly what the code looks like
3. **Easier Debugging** - Each phase can be tested and validated independently
4. **Maintainable** - Complex edge cases are handled by focused normalizers
5. **Testable** - Each normalizer has comprehensive test coverage

### Migration Strategy

1. **Phase 1**: Add pre-normalization step alongside existing logic
2. **Phase 2**: Remove complex destructuring handling from main pipeline
3. **Phase 3**: Simplify remaining methods that no longer need to handle destructuring
4. **Phase 4**: Clean up and optimize the streamlined pipeline

This approach transforms the pipeline from:
> "Handle DI transformations while carefully preserving non-DI destructuring"

To:
> "Normalize all destructuring first, then apply straightforward DI transformations"