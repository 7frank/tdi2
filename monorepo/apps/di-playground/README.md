# TDI2 Playground

An interactive, browser-based playground for exploring TDI2 (TypeScript Dependency Injection) code transformations. Similar to TypeScript Playground or Typia Playground, this tool provides live visualization of how TDI2 transforms your React components.

## Features

- **Live Code Transformation**: See real-time transformations as you type
- **Monaco Editor**: Full-featured code editor with TypeScript support
- **Split-Pane View**: Input code on the left, transformed output on the right
- **Example Library**: Pre-built examples demonstrating common patterns
- **Browser-Based**: No backend required - all transformations run in your browser

## Quick Start

### Development

```bash
# From monorepo root
bun run playground:dev

# Or directly
cd monorepo/apps/di-playground
bun run dev
```

Visit http://localhost:5174

### Build

```bash
# From monorepo root
bun run playground:build

# Or directly
cd monorepo/apps/di-playground
bun run build
```

## Usage

1. **Select an Example**: Use the dropdown to choose from pre-built examples
2. **Edit Code**: Modify the input code in the left panel
3. **View Transformation**: See the transformed output in the right panel (updates automatically after 500ms)
4. **Reset**: Click "Reset" to restore the original example code
5. **Transform**: Click "Transform" to manually trigger transformation

## Examples

The playground includes several examples:

- **Basic Counter**: Simple counter component with DI marker
- **Counter with Service**: Counter using dependency injection
- **Todo List**: Todo list with service injection
- **User Profile**: Multi-service component with authentication
- **Shopping Cart**: Complex e-commerce cart example

## How It Works

### Transformation Process

The playground uses the **actual** `FunctionalDIEnhancedTransformer` from `@tdi2/di-core` running in the browser:

1. **In-Memory File System**: Uses ts-morph's in-memory file system for browser compatibility
2. **Service Registry**: Pre-loads common service interfaces (Counter, Todo, User, Auth, Cart, Product)
3. **Real Transformation**: Runs the same transformation pipeline used by the Vite plugin
4. **DI Marker Detection**: Looks for `// @di-inject` comments
5. **Interface Resolution**: Automatically resolves service interfaces to implementations
6. **Code Generation**: Generates actual transformed code with proper imports and DI setup

### Features

The playground runs the full production transformer including:

- ✅ Full AST-based code transformation
- ✅ Interface resolution and validation
- ✅ Complex prop destructuring handling
- ✅ Service injection transformation
- ✅ Import management and code generation
- ✅ Error reporting and warnings

Note: Configuration class processing and bean factory generation work but require specific setup.

## Project Structure

```
di-playground/
├── src/
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   ├── transformer.ts       # Browser-compatible transformer
│   ├── examples.ts          # Example code snippets
│   └── styles.css           # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
└── tsconfig.json            # TypeScript configuration
```

## Technologies

- **React 19**: UI framework
- **Vite 6**: Build tool and dev server
- **Monaco Editor**: Code editor (powers VS Code)
- **ts-morph**: TypeScript AST manipulation
- **@tdi2/di-core**: Core DI transformation logic

## Development Notes

### Adding New Examples

Edit `src/examples.ts` and add a new entry to the `examples` array:

```typescript
{
  name: 'My Example',
  description: 'Brief description',
  code: `// Your example code here`
}
```

### Enhancing Transformations

The transformer logic is in `src/transformer.ts` and uses the real `FunctionalDIEnhancedTransformer`. To add more features:

1. **Add More Services**: Add service definitions in `createCommonServices()` method
2. **Configuration Options**: Expose transformer options in the UI (e.g., enable/disable features)
3. **Multiple Files**: Support multiple file transformations in the virtual filesystem
4. **Advanced Debugging**: Show intermediate transformation steps or AST visualization

### Styling

The playground uses a dark VS Code-inspired theme. Styles are in `src/styles.css` and follow a component-based naming convention.

## Future Enhancements

- [ ] URL-based code sharing (encode input in URL)
- [ ] Full production transformer integration
- [ ] Multiple file support
- [ ] TypeScript diagnostics display
- [ ] Transformation step visualization
- [ ] Export transformed code
- [ ] Customizable transformation options
- [ ] Side-by-side diff view
- [ ] Mobile-responsive layout

## Contributing

To contribute to the playground:

1. Make your changes in `monorepo/apps/di-playground`
2. Test thoroughly with `bun run dev`
3. Build to verify: `bun run build`
4. Follow the project's coding conventions
5. Submit a PR with clear description

## Related Documentation

- [TDI2 Documentation](https://7frank.github.io/tdi2/)
- [Getting Started Guide](../../apps/docs-starlight/src/content/docs/getting-started/quick-start.md)
- [Architecture Patterns](../../apps/docs-starlight/src/content/docs/guides/architecture/controller-service-pattern.md)

## License

MIT - See root LICENSE file
