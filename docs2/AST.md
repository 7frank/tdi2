# AST Transformation Packages for TypeScript DI

## 🥇 Tier 1: Highly Recommended

### 1. **ts-query + ts-morph** (Best Overall)
```bash
npm install @phenomnomnominal/ts-query ts-morph
```
- **Perfect for DI patterns**: CSS-like selectors for `Inject<T>` and `@Service`
- **Gradual migration**: Keep existing ts-morph code
- **Your use case**: `query(sourceFile, 'TypeReference[typeName.text="Inject"]')`

### 2. **jscodeshift** (Most Mature)
```bash
npm install jscodeshift @types/jscodeshift
```
- **Battle-tested**: Facebook's codebase transformer
- **Excellent TypeScript support**
- **Perfect for class/function transformation patterns**

## 🥈 Tier 2: Good Options

### 3. **ast-grep** (Fastest)
```bash
npm install @ast-grep/napi
```
- **Lightning fast** pattern matching
- **YAML-based rules** for team collaboration
- **Less transformation power** than above

### 4. **ts-ast-utils** (TypeScript Focused)
```bash
npm install ts-ast-utils
```
- **TypeScript-specific** helpers
- **Good for interface extraction**
- **Less mature** ecosystem

### 5. **recast + ast-types** (Precise)
```bash
npm install recast ast-types @types/ast-types
```
- **Preserves formatting** perfectly
- **More low-level** than needed

## 🥉 Tier 3: Specialized

### 6. **ts-simple-ast** (Lightweight)
### 7. **typescript-estree** (ESLint ecosystem)
### 8. **putout** (Plugin system)

## 📊 Impact Assessment

| File | Current Lines | With Library | Reduction |
|------|---------------|--------------|-----------|
| `functional-di-enhanced-transformer.ts` | 800+ | ~50-100 | **90%** |
| `enhanced-di-transformer.ts` | 600+ | ~100-150 | **80%** |
| `enhanced-interface-extractor.ts` | 400+ | ~50-80 | **85%** |
| `RecursiveInjectExtractor.ts` | 400+ | ~20-40 | **95%** |

## 🎯 Recommended Path

**Start with**: `ts-query + ts-morph`

**Implementation:**
```typescript
// Week 1: Replace finders
const diCandidates = query(sourceFile, 
  'FunctionDeclaration:has(Parameter TypeReference[typeName.text=/Inject/])'
);

// Week 2: Replace extractors
const dependencies = query(node, 
  'PropertySignature:has(TypeReference[typeName.text="Inject"])'
);

// Week 3: Keep ts-morph for generation
```

**Fallback**: `jscodeshift` if you need more transformation power or prefer Facebook tooling.