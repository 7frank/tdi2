# @tdi2/rollup-plugin-di

Rollup plugin for TDI2 (TypeScript Dependency Injection) - enables dependency injection transformations during Rollup builds.

## Installation

```bash
npm install --save-dev @tdi2/rollup-plugin-di
```

## Usage

```javascript
// rollup.config.js
import { tdi2Plugin } from '@tdi2/rollup-plugin-di';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    tdi2Plugin({
      srcDir: './src',
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      verbose: false
    })
  ]
};
```

## Configuration

All options from `@tdi2/plugin-core` are supported:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `srcDir` | `string` | `'./src'` | Source directory to scan |
| `outputDir` | `string` | `'./src/generated'` | Output directory for generated files |
| `enableFunctionalDI` | `boolean` | `true` | Enable functional component DI |
| `enableInterfaceResolution` | `boolean` | `true` | Enable interface-to-implementation resolution |
| `verbose` | `boolean` | `false` | Enable verbose logging |
| `generateDebugFiles` | `boolean` | `false` | Generate debug files |

## Examples

### Basic Configuration

```javascript
import { tdi2Plugin } from '@tdi2/rollup-plugin-di';

export default {
  plugins: [tdi2Plugin()]
};
```

### With TypeScript

```javascript
import typescript from '@rollup/plugin-typescript';
import { tdi2Plugin } from '@tdi2/rollup-plugin-di';

export default {
  plugins: [
    tdi2Plugin({
      verbose: true
    }),
    typescript()
  ]
};
```

### Library Bundling

```javascript
import { tdi2Plugin } from '@tdi2/rollup-plugin-di';

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/index.js', format: 'cjs' },
    { file: 'dist/index.mjs', format: 'esm' }
  ],
  plugins: [
    tdi2Plugin({
      enableFunctionalDI: true,
      enableInterfaceResolution: true
    })
  ]
};
```

## How It Works

1. **Build Start**: Initializes TDI2 transformers and scans source directory
2. **Transform**: Processes each file, applying DI transformations where needed
3. **Build End**: Reports statistics and cleans up

## License

MIT
