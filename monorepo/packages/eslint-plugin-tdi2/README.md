# ESLint Plugin TDI2

Rich context information for TDI2 interface resolution in VS Code and other editors.

## Features

### 1. **Interface Resolution Context** (`show-interface-resolution`)

Shows how `Inject<InterfaceType>` resolves to concrete implementations at usage points.

**What you see when hovering over `Inject<UserServiceInterface>`:**

```
✅ UserServiceInterface → UserService ⭐ PRIMARY
📍 src/services/UserService.ts:15
⚙️  Scope: singleton | Profiles: all
🔗 Dependencies: AuthService, LoggerService

🔄 Other implementations (2):
   • MockUserService (test/mocks/MockUserService.ts:5)
     └─ Profiles: test
   • DevUserService (src/services/DevUserService.ts:10)
     └─ Profiles: dev

💡 Reason: Marked with @Primary decorator
```

**Features:**
- Shows selected implementation with reason
- Lists all alternative implementations
- Displays dependencies, scope, and profiles
- Warns about ambiguous resolutions
- Detects profile mismatches

---

### 2. **Implementation Context** (`show-implementation-context`)

Shows context when hovering over `@Service()` class declarations.

**What you see when hovering over a service class:**

```typescript
@Service()
@Primary()
export class UserService implements UserServiceInterface {
//           ^^^^^^^^^^^ (hover here)

// Shows:
📦 Service: UserService
🔗 Implements: UserServiceInterface
⭐ Marked as: PRIMARY (default selection)

📊 Usage:
   • Used by: 12 components
   • Dependencies: 2

🔄 Other implementations of UserServiceInterface:
   • MockUserService [test]
   • DevUserService [dev]
```

**Features:**
- Shows what interfaces the class implements
- Displays usage statistics
- Lists dependencies
- Shows alternative implementations
- Indicates primary status and profiles

---

### 3. **Interface Implementations** (`show-interface-implementations`)

Shows all implementations when hovering over interface declarations.

**What you see when hovering over an interface:**

```typescript
export interface UserServiceInterface {
//               ^^^^^^^^^^^^^^^^^^^^^ (hover here)

// Shows:
📦 Interface: UserServiceInterface
🏭 Implementations: 3 found

✅ Registered:
   1. UserService ⭐ PRIMARY ✅ SELECTED
      └─ 📍 src/services/UserService.ts:15
      └─ ⚙️  Scope: singleton
      └─ 🔗 Dependencies: AuthService, LoggerService
      └─ 📊 Used by: 12 components

   2. MockUserService
      └─ 📍 test/mocks/MockUserService.ts:5
      └─ ⚙️  Scope: transient
      └─ ⏸️ Profiles: test
      └─ 📊 Used by: 8 test files

   3. DevUserService
      └─ 📍 src/services/DevUserService.ts:10
      └─ ⚙️  Scope: singleton
      └─ ✅ Profiles: dev
```

**Features:**
- Lists all implementations in one view
- Shows which is selected and why
- Displays usage statistics for each
- Indicates profile requirements
- Warns about ambiguity issues

---

## Installation

### Option 1: Local Plugin (Current Setup)

The plugin is already available in `monorepo/apps/legacy/eslint-plugin-tdi2/`.

Configure in your `.eslintrc.js` or `eslint.config.js`:

```javascript
// .eslintrc.js (legacy config)
module.exports = {
  plugins: ['./monorepo/apps/legacy/eslint-plugin-tdi2'],
  extends: ['plugin:tdi2/recommended'],
  // Or configure rules individually:
  rules: {
    'tdi2/show-interface-resolution': 'warn',
    'tdi2/show-implementation-context': 'warn',
    'tdi2/show-interface-implementations': 'warn',
  },
};
```

```javascript
// eslint.config.js (flat config)
const tdi2Plugin = require('./monorepo/apps/legacy/eslint-plugin-tdi2');

module.exports = [
  {
    plugins: {
      tdi2: tdi2Plugin,
    },
    rules: {
      'tdi2/show-interface-resolution': 'warn',
      'tdi2/show-implementation-context': 'warn',
      'tdi2/show-interface-implementations': 'warn',
    },
  },
];
```

### Option 2: As npm Package (Future)

```bash
npm install --save-dev eslint-plugin-tdi2
```

---

## Configuration

### Recommended Config

```javascript
{
  "extends": ["plugin:tdi2/recommended"]
}
```

### Strict Config (All Features)

```javascript
{
  "extends": ["plugin:tdi2/strict"]
}
```

### Custom Configuration

```javascript
{
  "rules": {
    "tdi2/show-interface-resolution": ["warn", {
      "showDependencies": true,        // Show dependency list
      "showScope": true,                // Show singleton/transient
      "showFilePath": true,             // Show implementation location
      "showOtherImplementations": true, // Show alternatives
      "warnOnAmbiguous": true           // Warn on ambiguous resolution
    }],

    "tdi2/show-implementation-context": ["warn", {
      "showUsageStats": true,          // Show component usage count
      "showDependencies": true,        // Show dependency count
      "showOtherImplementations": true // Show alternatives
    }],

    "tdi2/show-interface-implementations": ["warn", {
      "showUsageStats": true,          // Show usage per implementation
      "showProfiles": true,            // Show profile requirements
      "warnOnAmbiguity": true          // Warn if no @Primary
    }]
  }
}
```

---

## Requirements

1. **TDI2 Configuration Must Be Generated**

   The plugin reads from `.tdi2/eslint-metadata.json`. This file is auto-generated when you run your app:

   ```bash
   npm run dev     # Generates .tdi2/eslint-metadata.json
   ```

   If metadata is missing, you'll see:

   ```
   ⚠️  TDI2 config not found
   💡 Run your app once to generate interface resolution data.
   ```

2. **TypeScript Parser**

   Ensure your ESLint is configured with TypeScript support:

   ```bash
   npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
   ```

   ```javascript
   // .eslintrc.js
   module.exports = {
     parser: '@typescript-eslint/parser',
     parserOptions: {
       project: './tsconfig.json',
     },
   };
   ```

---

## VS Code Integration

The plugin works automatically with VS Code's ESLint extension:

1. **Install ESLint Extension**

   ```
   ext install dbaeumer.vscode-eslint
   ```

2. **Enable ESLint**

   Add to `.vscode/settings.json`:

   ```json
   {
     "eslint.enable": true,
     "eslint.validate": [
       "javascript",
       "javascriptreact",
       "typescript",
       "typescriptreact"
     ]
   }
   ```

3. **Hover to See Context**

   - Hover over `Inject<InterfaceType>` → See resolution
   - Hover over `class ServiceName` → See implementation context
   - Hover over `interface InterfaceName` → See all implementations

---

## Troubleshooting

### "TDI2 config not found"

**Solution:** Run your app once to generate metadata:

```bash
cd examples/tdi2-basic-example
npm run dev
```

The `.tdi2/eslint-metadata.json` file should be created.

---

### "Interface not resolved"

**Causes:**
- No `@Service()` class implements the interface
- Service file not in `scanDirs` (check `vite.config.ts`)
- Interface name typo

**Solution:** Ensure a service implements the interface:

```typescript
@Service()
export class MyService implements MyServiceInterface {
  // ...
}
```

---

### "Ambiguous resolution warning"

**Cause:** Multiple implementations, no `@Primary`

**Solution:** Add `@Primary()` to preferred implementation:

```typescript
@Service()
@Primary()  // <-- Add this
export class ProdService implements ServiceInterface {
  // ...
}
```

Or use `@Qualifier` at injection point:

```typescript
function Component({ service }: { service: Inject<ServiceInterface> & Qualifier<'prod'> }) {
  // ...
}
```

---

## How It Works

1. **Metadata Generation (di-core)**
   - During build, `di-core` analyzes all services
   - Generates `.tdi2/eslint-metadata.json` with interface resolutions
   - Includes multiple implementations, profiles, dependencies

2. **Metadata Loading (ESLint Plugin)**
   - Plugin loads JSON file (cached for 5 seconds)
   - Parses metadata for quick lookups

3. **Context Display (ESLint Rules)**
   - Rules detect `Inject<>`, class declarations, interface declarations
   - Look up metadata
   - Format and display context messages
   - VS Code shows as inline hints

---

## Performance

- **Metadata file:** ~50KB for typical app
- **Load time:** ~5ms (cached)
- **Rule overhead:** <1ms per file
- **No AST parsing:** Uses pre-generated metadata

---

## Future Enhancements

- [ ] Code actions for "Go to Implementation"
- [ ] Code actions for "Add @Primary"
- [ ] Code actions for "Add @Qualifier"
- [ ] Dependency graph visualization
- [ ] Circular dependency detection
- [ ] Quick fixes for common issues

---

## License

MIT
