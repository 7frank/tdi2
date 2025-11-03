# @tdi2/webpack-plugin-di

Webpack plugin for TDI2 (TypeScript Dependency Injection) - enables dependency injection transformations during Webpack builds.

## Installation

```bash
npm install --save-dev @tdi2/webpack-plugin-di
```

## Usage

```javascript
// webpack.config.js
const { TDI2WebpackPlugin } = require('@tdi2/webpack-plugin-di');

module.exports = {
  plugins: [
    new TDI2WebpackPlugin({
      srcDir: './src',
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      verbose: false
    })
  ]
};
```

### With TypeScript

```javascript
const { TDI2WebpackPlugin } = require('@tdi2/webpack-plugin-di');

module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new TDI2WebpackPlugin({
      verbose: true
    })
  ]
};
```

### With Create React App (Ejected)

```javascript
// config/webpack.config.js
const { TDI2WebpackPlugin } = require('@tdi2/webpack-plugin-di');

module.exports = function (webpackEnv) {
  return {
    // ... existing config
    plugins: [
      // ... existing plugins
      new TDI2WebpackPlugin({
        srcDir: './src',
        enableFunctionalDI: true
      })
    ]
  };
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

## How It Works

1. **Before Compile**: Initializes TDI2 transformers and scans source directory
2. **Build Module**: Intercepts each module during build and applies DI transformations
3. **Done**: Reports statistics and cleans up

## Examples

### Development Build

```javascript
const { TDI2WebpackPlugin } = require('@tdi2/webpack-plugin-di');

module.exports = {
  mode: 'development',
  plugins: [
    new TDI2WebpackPlugin({
      verbose: true,
      generateDebugFiles: true
    })
  ]
};
```

### Production Build

```javascript
const { TDI2WebpackPlugin } = require('@tdi2/webpack-plugin-di');

module.exports = {
  mode: 'production',
  plugins: [
    new TDI2WebpackPlugin({
      verbose: false,
      generateDebugFiles: false
    })
  ]
};
```

## Compatibility

- ✅ Webpack 5.x
- ✅ Works with ts-loader, babel-loader
- ✅ Compatible with React, Next.js (custom webpack config)
- ✅ Supports HMR (Hot Module Replacement)

## License

MIT
