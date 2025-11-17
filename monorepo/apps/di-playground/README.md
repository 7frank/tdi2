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

The playground uses a simplified, browser-compatible transformer that demonstrates TDI2's core concepts:

1. **DI Marker Detection**: Looks for `// @di-inject` comments
2. **Service Injection**: Identifies `useInject<ServiceInterface>()` calls
3. **Code Transformation**: Shows how components are enhanced with DI

### Current Limitations

This is a **demo playground** that uses simplified transformations for visualization purposes. The actual production transformer (`@tdi2/di-core`) performs more sophisticated transformations including:

- Full AST-based code transformation
- Interface resolution and validation
- Complex prop destructuring handling
- Configuration class processing
- Bean factory generation

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

The transformer logic is in `src/transformer.ts`. The `transformWithDemo()` method uses simple string replacements for demo purposes. To implement more sophisticated transformations:

1. Use `ts-morph` AST manipulation in the `transform()` method
2. Consider integrating more of `@tdi2/di-core`'s transformation pipeline
3. Be mindful of browser performance and bundle size

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
