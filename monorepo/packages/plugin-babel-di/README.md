# @tdi2/babel-plugin-di

Babel plugin for TDI2 (TypeScript Dependency Injection) - enables dependency injection transformations during Babel compilation.

## Installation

```bash
npm install --save-dev @tdi2/babel-plugin-di
```

## Usage

### .babelrc.js

```javascript
module.exports = {
  plugins: [
    ['@tdi2/babel-plugin-di', {
      srcDir: './src',
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      verbose: false
    }]
  ]
};
```

### babel.config.js

```javascript
module.exports = {
  presets: ['@babel/preset-typescript', '@babel/preset-react'],
  plugins: [
    ['@tdi2/babel-plugin-di', {
      verbose: true
    }]
  ]
};
```

### With Create React App (Non-Ejected)

You can use `customize-cra` and `react-app-rewired`:

```bash
npm install --save-dev customize-cra react-app-rewired
```

```javascript
// config-overrides.js
const { override, addBabelPlugin } = require('customize-cra');

module.exports = override(
  addBabelPlugin(['@tdi2/babel-plugin-di', {
    srcDir: './src',
    enableFunctionalDI: true
  }])
);
```

Update package.json:
```json
{
  "scripts": {
    "start": "react-app-rewired start",
    "build": "react-app-rewired build"
  }
}
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

1. **Pre**: Initializes TDI2 transformers on first file
2. **Visitor**: Processes each file's AST, applying transformations
3. **Post**: Reports statistics after all files processed

## Examples

### With TypeScript

```javascript
module.exports = {
  presets: [
    '@babel/preset-typescript',
    '@babel/preset-react'
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@tdi2/babel-plugin-di', {
      enableFunctionalDI: true
    }]
  ]
};
```

### Development vs Production

```javascript
module.exports = (api) => {
  const isDev = api.env('development');

  return {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    plugins: [
      ['@tdi2/babel-plugin-di', {
        verbose: isDev,
        generateDebugFiles: isDev
      }]
    ]
  };
};
```

### With webpack

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ['@tdi2/babel-plugin-di', {
                srcDir: './src'
              }]
            ]
          }
        }
      }
    ]
  }
};
```

## Performance

Babel plugins run synchronously, but TDI2's transformation happens once:
- **First file**: Triggers initialization (~100-200ms)
- **Subsequent files**: Use cached transformation results (~1-2ms per file)
- **Total overhead**: Minimal for typical projects

## Limitations

**Note:** Babel plugins have limited async support. TDI2 initializes on the first file, which may cause a brief delay. For better performance with large projects, consider using:
- `@tdi2/vite-plugin-di` for Vite projects
- `@tdi2/webpack-plugin-di` for Webpack projects
- `@tdi2/esbuild-plugin-di` for esbuild projects

## Compatibility

- ✅ Babel 7.x
- ✅ Works with TypeScript, React (JSX/TSX)
- ✅ Compatible with CRA (via customize-cra)
- ✅ Supports all Babel presets and plugins
- ⚠️  Requires `@babel/plugin-proposal-decorators` for `@Service` decorator support

## License

MIT
