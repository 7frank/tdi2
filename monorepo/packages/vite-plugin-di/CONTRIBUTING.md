# Contributing to @tdi2/vite-plugin-di

Thank you for your interest in contributing to the TDI2 Vite plugin! This guide will help you get started with development and contributing.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+ or pnpm 8+ or yarn 1.22+
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/7frank/tdi2.git
   cd tdi2/packages/vite-plugin-di
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development mode**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## 📝 Development Workflow

### Branch Strategy

- `main` - Stable releases
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following our style guide
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `ci:` - CI/CD changes
- `chore:` - Maintenance tasks

Examples:
```bash
feat: add support for custom DI patterns
fix: resolve hot reload issue with interface resolution
docs: update README with new configuration options
test: add integration tests for functional DI
```

## 🧪 Testing

### Test Types

1. **Unit Tests** - Test individual functions and utilities
2. **Integration Tests** - Test plugin behavior with Vite
3. **Type Tests** - Ensure TypeScript types are correct

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- plugin.test.ts
```

### Writing Tests

- Place tests in `src/__tests__/` directory
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies when appropriate

Example test structure:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { diEnhancedPlugin } from '../plugin';

describe('diEnhancedPlugin', () => {
  it('should create plugin with correct name', () => {
    // Arrange
    const options = { verbose: true };
    
    // Act
    const plugin = diEnhancedPlugin(options);
    
    // Assert
    expect(plugin.name).toBe('vite-plugin-di-enhanced');
  });
});
```

## 📚 Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for public APIs
- Avoid `any` type unless absolutely necessary

### Code Formatting

- Use ESLint for linting
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for public APIs

### File Organization

```
src/
├── index.ts          # Main entry point
├── plugin.ts         # Core plugin implementation
├── types.ts          # Type definitions
├── utils.ts          # Utility functions
└── __tests__/        # Test files
```

## 🔧 Plugin Architecture

### Core Components

1. **Plugin Interface** - Vite plugin implementation
2. **Transformation Engine** - DI transformation logic
3. **Interface Resolution** - Automatic interface mapping
4. **Hot Reload** - Development server integration
5. **Debug Tools** - Development debugging endpoints

### Key Files

- `plugin.ts` - Main Vite plugin logic
- `types.ts` - TypeScript type definitions
- `utils.ts` - Helper functions and utilities
- `index.ts` - Public API exports

### Integration Points

- **@tdi2/di-core** - Core DI functionality
- **Vite Plugin API** - Standard Vite plugin interface
- **TypeScript** - AST analysis and transformation
- **File System** - Configuration and cache management

## 📖 Documentation

### Adding Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new APIs
- Update CHANGELOG.md for releases
- Include examples for new features

### Documentation Standards

- Use clear, concise language
- Provide working code examples
- Include troubleshooting sections
- Keep documentation up to date with code

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Test with latest version
3. Reproduce with minimal example
4. Check debug endpoints for clues

### Bug Report Template

```markdown
## Bug Description
Clear description of what the bug is.

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- Node.js version:
- npm/pnpm/yarn version:
- Vite version:
- @tdi2/vite-plugin-di version:
- Operating System:

## Additional Context
Any other context about the problem.
```

## ✨ Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why would this feature be useful?

## Proposed Solution
How do you think this should work?

## Alternatives Considered
Other approaches you've considered.

## Additional Context
Any other context or screenshots.
```

## 🚀 Release Process

### For Maintainers

1. **Version Bump**
   ```bash
   npm version [major|minor|patch]
   ```

2. **Update Changelog**
   - Add new version section
   - List all changes
   - Follow Keep a Changelog format

3. **Create Release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Publish**
   - CI/CD will automatically publish to npm and JSR
   - GitHub release will be created automatically

### Version Guidelines

- **Major** (1.0.0) - Breaking changes
- **Minor** (0.1.0) - New features, backwards compatible
- **Patch** (0.0.1) - Bug fixes, small improvements

## 🤝 Community

### Getting Help

- **GitHub Discussions** - Questions and community support
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Real-time chat (if available)

### Code of Conduct

Please be respectful and inclusive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## 📋 Checklist for Contributors

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] TypeScript types are correct

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### High Priority
- Performance optimizations
- Better error messages
- Additional debug tools
- Documentation improvements

### Medium Priority
- New configuration options
- Integration with other frameworks
- Additional test coverage
- Developer experience improvements

### Low Priority
- Code style improvements
- Minor bug fixes
- Example projects
- Tooling enhancements

## 🛠️ Development Tips

### Debugging

- Use `verbose: true` in plugin options
- Check debug endpoints: `/_di_debug`, `/_di_interfaces`
- Use debugger statements in your IDE
- Check Vite plugin transformation pipeline

### Performance Testing

```bash
# Test with large codebase
time npm run build

# Memory profiling
node --inspect-brk node_modules/.bin/vite build

# Bundle analysis
npm run build -- --analyze
```

### Local Testing

```bash
# Link for local testing
npm link

# In test project
npm link @tdi2/vite-plugin-di
```

Thank you for contributing to @tdi2/vite-plugin-di! 🎉