# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @tdi2/vite-plugin-di
- Interface-based automatic dependency injection resolution
- Functional component DI transformation support
- Hot reload support for development
- Debug endpoints for development debugging
- Performance tracking and optimization
- Multiple configuration presets
- Comprehensive TypeScript support
- Build-time optimization features

### Features
- 🎯 Interface-based DI with automatic resolution
- ⚡ Zero configuration setup with sensible defaults
- 🔄 Hot reload with automatic retransformation
- 🧩 Functional component dependency injection
- 📊 Development debugging endpoints
- 🏗️ Build optimization for production
- 🔧 Full TypeScript support with type safety
- 📦 Tree shaking for optimal bundle sizes

## [1.0.0] - 2024-01-XX

### Added
- Initial stable release
- Core plugin functionality
- Interface-based dependency resolution
- Functional component transformation
- Hot module replacement support
- Debug endpoints and development tools
- Performance optimizations
- Comprehensive documentation
- Test suite
- JSR and npm publishing support

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- N/A (initial release)

---

## Release Process

1. Update version in `package.json` and `jsr.json`
2. Update `CHANGELOG.md` with new version
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Publish to npm: `npm run publish:npm`
6. Publish to JSR: `npm run publish:jsr`

## Version Guidelines

- **Major** (1.0.0): Breaking changes, major new features
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, small improvements