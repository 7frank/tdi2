# @tdi2/vite-plugin-di Package Structure

This document outlines the complete package structure for the standalone TDI2 Vite plugin.

## 📁 Directory Structure

```
packages/vite-plugin-di/
├── src/                           # Source code
│   ├── index.ts                   # Main entry point
│   ├── plugin.ts                  # Core plugin implementation
│   ├── types.ts                   # TypeScript type definitions
│   ├── utils.ts                   # Utility functions
│   └── __tests__/                 # Test files
│       ├── plugin.test.ts         # Plugin tests
│       ├── utils.test.ts          # Utility tests
│       └── types.test.ts          # Type tests
├── dist/                          # Built output (generated)
│   ├── index.js                   # CommonJS build
│   ├── index.mjs                  # ES modules build
│   ├── index.d.ts                 # TypeScript declarations
│   └── *.map                      # Source maps
├── .github/                       # GitHub workflows
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline
├── docs/                          # Documentation
│   ├── api.md                     # API documentation
│   ├── examples.md                # Usage examples
│   └── migration.md               # Migration guide
├── examples/                      # Example projects
│   ├── basic/                     # Basic usage example
│   ├── advanced/                  # Advanced configuration
│   └── migration/                 # Migration from other DI solutions
├── scripts/                       # Build and utility scripts
│   ├── build.js                   # Custom build script
│   ├── test.js                    # Test runner script
│   └── release.js                 # Release automation
├── package.json                   # Package configuration
├── tsconfig.json                  # TypeScript configuration
├── tsup.config.ts                 # Build configuration
├── vitest.config.ts               # Test configuration
├── eslint.config.js               # Linting configuration
├── jsr.json                       # JSR publishing configuration
├── README.md                      # Package documentation
├── CHANGELOG.md                   # Version history
├── LICENSE                        # MIT license
├── .gitignore                     # Git ignore rules
└── .npmignore                     # npm ignore rules
```

## 📦 Package Configuration

### package.json
- **Main exports**: CommonJS, ESM, and TypeScript declarations
- **Peer dependencies**: Vite and @tdi2/di-core
- **Scripts**: Build, test, lint, and publish commands
- **Keywords**: For discoverability on npm/JSR

### tsup.config.ts
- **Dual format**: CommonJS and ES modules
- **TypeScript declarations**: Generated automatically
- **Source maps**: For debugging
- **External dependencies**: Properly marked
- **Tree shaking**: Enabled for optimal builds

### jsr.json
- **JSR publishing**: Alternative to npm
- **Deno/Bun compatibility**: First-class support
- **Export mapping**: TypeScript sources for JSR

## 🔧 Build System

### TypeScript
- **Target**: ES2020 for modern runtime support
- **Module**: ESNext for optimal bundling
- **Strict mode**: Full type safety
- **Decorators**: Experimental support for DI

### ESLint
- **TypeScript rules**: Full type-aware linting
- **Import sorting**: Consistent import organization
- **Performance rules**: Async/await best practices

### Vitest
- **Node environment**: For plugin testing
- **Coverage**: v8 provider for accurate reports
- **TypeScript**: Native support without transpilation

## 🚀 Publishing Strategy

### Dual Publishing
1. **npm Registry**: Primary distribution
2. **JSR Registry**: Modern alternative for Deno/Bun

### Version Management
- **Semantic versioning**: Major.Minor.Patch
- **Git tags**: Automated releases
- **Changelog**: Keep a Changelog format

### CI/CD Pipeline
1. **Lint**: Code quality checks
2. **Test**: Multi-version Node.js testing
3. **Build**: Package compilation
4. **Publish**: Automated publishing on tags
5. **Release**: GitHub release creation

## 📚 Documentation Structure

### README.md
- **Quick start**: Get up and running fast
- **Configuration**: All available options
- **Examples**: Real-world usage patterns
- **Migration**: From other DI solutions
- **Troubleshooting**: Common issues and solutions

### API Documentation
- **TypeScript types**: Comprehensive type definitions
- **Plugin options**: Detailed configuration guide
- **Debug endpoints**: Development tools
- **Performance**: Optimization strategies

### Examples
- **Basic usage**: Simple setup
- **Advanced configuration**: Power user features
- **Migration guides**: From Context API, manual DI
- **Best practices**: Recommended patterns

## 🔍 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Run tests in watch mode
npm run test:watch

# Lint and fix code
npm run lint:fix
```

### Testing Strategy
- **Unit tests**: Individual function testing
- **Integration tests**: Plugin behavior testing
- **Type tests**: TypeScript type checking
- **Performance tests**: Build time benchmarks

### Release Process
1. **Version bump**: Update package.json and jsr.json
2. **Changelog**: Update CHANGELOG.md
3. **Git tag**: Create version tag
4. **Push**: Trigger CI/CD pipeline
5. **Verify**: Check npm and JSR packages

## 🎯 Integration Points

### @tdi2/di-core
- **Peer dependency**: Required for core DI functionality
- **Version compatibility**: Semantic versioning alignment
- **API stability**: Consistent interface contracts

### Vite Ecosystem
- **Plugin API**: Standard Vite plugin interface
- **Hot reload**: Vite HMR integration
- **Build optimization**: Vite build pipeline
- **Development server**: Debug endpoints

### TypeScript
- **Decorator support**: Experimental decorators
- **Type inference**: Full type safety
- **Declaration files**: Comprehensive type exports
- **Source maps**: Debugging support

## 🔒 Security Considerations

### Dependencies
- **Minimal dependencies**: Reduce attack surface
- **Peer dependencies**: Let consumers control versions
- **Security audits**: Regular vulnerability scans
- **Supply chain**: Trusted dependency sources

### Code Quality
- **Type safety**: Full TypeScript coverage
- **Linting**: Security-focused rules
- **Testing**: Comprehensive test coverage
- **Code review**: All changes reviewed

## 📈 Monitoring and Analytics

### Package Analytics
- **Download stats**: npm and JSR metrics
- **Version adoption**: Usage patterns
- **Geographic distribution**: Global usage
- **Dependency analysis**: Ecosystem impact

### Performance Monitoring
- **Build times**: Transformation performance
- **Bundle sizes**: Output optimization
- **Memory usage**: Resource consumption
- **Error rates**: Reliability metrics