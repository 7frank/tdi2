# TDI2 VS Code Extension - Quick Start Guide

## Installation (Development Mode)

1. **Open the extension in VS Code:**
   ```bash
   cd monorepo/packages/vscode-extension-tdi2
   code .
   ```

2. **Press F5** to launch the Extension Development Host
   - A new VS Code window will open with the extension loaded
   - The extension will activate when you open a TypeScript file

3. **Open your TDI2 project in the new window:**
   - Open `monorepo/apps/legacy` folder
   - Navigate to `src/todo2/TodoApp2.tsx`

## Features

### 1. Hover Documentation 🔍

**Try it:**
- Open `TodoApp2.tsx`
- Hover over `Inject<AppLangInterface>` on line 16
- You'll see a rich hover card with:
  - ✅ Resolves to: I18n
  - 📍 Clickable file path
  - ⚙️ Scope information
  - 💡 Selection reason
  - Dependencies list

### 2. CodeLens Navigation 🔗

**What you'll see:**
Above each `Inject<>` marker, you'll see an inline link like:
```
→ I18n
i18n: Inject<AppLangInterface>
```

**Click the link** to jump directly to the implementation!

### 3. Ctrl+Click Navigation ⌨️

**Try it:**
- Hold Ctrl (Cmd on Mac)
- Click on `AppLangInterface` inside `Inject<AppLangInterface>`
- You'll jump directly to the `I18n` implementation class

## Testing the Extension

### Test Files:
1. **TodoApp2.tsx** (lines 14-21)
   ```typescript
   interface AppProps {
     services: {
       i18n: Inject<AppLangInterface>;        // Hover here!
       todoService: Inject<TodoServiceInterface>;
       appState: Inject<AppStateServiceInterface>;
       notifications: Inject<NotificationServiceInterface>;
     };
   }
   ```

2. **EnhancedFunctionalComponent.tsx**
   ```typescript
   services: {
     api: Inject<ExampleApiInterface>;  // Hover here!
   }
   ```

### What to Expect:

✅ **Hover shows:**
- Implementation class name
- File path (clickable!)
- DI scope
- Dependencies
- Ambiguity warnings (if multiple implementations)

✅ **CodeLens shows:**
- `→ ImplementationName` above each Inject<>

✅ **Ctrl+Click:**
- Jumps to implementation file

## Commands

Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- `TDI2: Refresh Metadata` - Reload DI metadata
- `TDI2: Show Dependency Graph` - (Coming soon)

## Configuration

Open Settings (Ctrl+, / Cmd+,) and search for "tdi2":

- `tdi2.enableHover` - Enable hover documentation (default: true)
- `tdi2.enableCodeLens` - Enable inline navigation links (default: true)
- `tdi2.enableDefinitionProvider` - Enable Ctrl+Click (default: true)

## Troubleshooting

### No hover information showing?
1. Make sure `.tdi2/eslint-metadata.json` exists
2. Run `npm run build` in your app to generate metadata
3. Try `TDI2: Refresh Metadata` command

### CodeLens not appearing?
1. Check if CodeLens is enabled globally: `editor.codeLens: true`
2. Check extension setting: `tdi2.enableCodeLens: true`
3. Restart the Extension Development Host (F5 again)

### Navigation not working?
1. Check file paths in metadata are correct
2. Try clicking the file path in hover tooltip
3. Check VS Code Output panel (View → Output → TDI2)

## Development

### Make changes:
1. Edit source files in `src/`
2. Extension will auto-recompile (watch mode)
3. Press Ctrl+R (Cmd+R) in Extension Development Host to reload

### View logs:
- Open Output panel: View → Output
- Select "TDI2" from dropdown
- Watch for activation and error messages

## Next Steps

Once you're happy with the extension:
1. Package it: `npx vsce package`
2. Install locally: `code --install-extension tdi2-vscode-0.1.0.vsix`
3. Publish to marketplace (optional)

Enjoy your TDI2 development with rich IDE support! 🚀
