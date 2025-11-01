# @tdi2/esbuild-plugin-di

esbuild plugin for TDI2 (TypeScript Dependency Injection) - enables dependency injection transformations during esbuild builds.

## Installation

```bash
npm install --save-dev @tdi2/esbuild-plugin-di
```

## Usage

```javascript
import { tdi2Plugin } from '@tdi2/esbuild-plugin-di';
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [
    tdi2Plugin({
      srcDir: './src',
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      verbose: false
    })
  ]
});
```

### Watch Mode

```javascript
import { tdi2Plugin } from '@tdi2/esbuild-plugin-di';
import * as esbuild from 'esbuild';

const ctx = await esbuild.context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [
    tdi2Plugin({
      verbose: true
    })
  ]
});

await ctx.watch();
```

### With React

```javascript
import { tdi2Plugin } from '@tdi2/esbuild-plugin-di';
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  loader: { '.tsx': 'tsx' },
  plugins: [
    tdi2Plugin({
      enableFunctionalDI: true
    })
  ]
});
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

## How It Works

1. **On Start**: Initializes TDI2 transformers and scans source directory
2. **On Load**: Intercepts .ts/.tsx files and applies DI transformations
3. **On End**: Reports statistics and cleans up

## Examples

### Development Build

```javascript
import { tdi2Plugin } from '@tdi2/esbuild-plugin-di';
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  plugins: [
    tdi2Plugin({
      verbose: true,
      generateDebugFiles: true
    })
  ]
});
```

### Production Build

```javascript
import { tdi2Plugin } from '@tdi2/esbuild-plugin-di';
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: false,
  plugins: [
    tdi2Plugin({
      verbose: false
    })
  ]
});
```

### Multiple Entry Points

```javascript
import { tdi2Plugin } from '@tdi2/esbuild-plugin-di';
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: {
    app: 'src/app.ts',
    admin: 'src/admin.ts'
  },
  bundle: true,
  outdir: 'dist',
  plugins: [
    tdi2Plugin()
  ]
});
```

## Performance

esbuild is extremely fast, and TDI2's transformation is done once at build start. Typical overhead:
- **Cold build**: +100-200ms for initial transformation
- **Incremental rebuilds**: Near-zero overhead (cached results)
- **Watch mode**: Instant HMR with cached transformations

## Compatibility

- ✅ esbuild 0.19.x, 0.20.x, 0.21.x
- ✅ Works with TypeScript, React (JSX/TSX)
- ✅ Compatible with watch mode and live reload
- ✅ Supports code splitting and multiple entry points

## License

MIT
