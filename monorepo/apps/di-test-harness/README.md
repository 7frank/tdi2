# DI Test Harness

Test harness and living documentation for the DI code generator using Ladle.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy your transformer code:**
   Copy your transformer files to `src/transformer/`:
   - `functional-di-enhanced-transformer.ts`
   - `code-generator.ts`
   - `dependency-extractor.ts`
   - `types.ts`

3. **Update story imports:**
   In the story files, replace the mock transformer imports with your actual transformer:
   ```typescript
   import { FunctionalDIEnhancedTransformer } from '../src/transformer/functional-di-enhanced-transformer';
   ```

4. **Start Ladle:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to the URL shown in the terminal (usually http://localhost:61000)

## Stories

- **Simple Animal Component** - Basic single service transformation
- **Multi-Animal Component** - Multiple services with optional dependencies

## Next Steps

- Copy your actual transformer code
- Update the mock resolvers with real implementations
- Add more story files for other fixtures
- Test transformation behavior interactively

## Features

- ✅ Live code transformation
- ✅ Side-by-side diff display
- ✅ Interactive transformation triggers
- ✅ Error handling and display
- ✅ Collapsible documentation sections
