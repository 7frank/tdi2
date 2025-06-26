# TDI2 Configuration Troubleshooting Guide

## Problem: CLI and Dev Server Generate Different Configurations

### Symptoms
- Running `npm run di:enhanced` creates one config
- Running `npm run dev` creates a different config  
- Frontend shows "Service not registered" errors
- Bridge files point to the wrong configuration

### Root Cause
The ConfigManager generates hashes based on execution context, and subtle differences between CLI and Vite plugin execution can result in different hashes.

### Quick Fixes

#### 1. Use the Reset Workflow (Recommended)
```bash
# Clean all configs and regenerate
npm run di:reset

# Start dev server (will reuse the generated config)
npm run dev
```

#### 2. Check Current Configuration Status
```bash
# See all available configs
npm run di:list

# Check which config is currently active
npm run di:check-config

# Validate the current config
npm run di:validate
```

#### 3. Force Fresh Development
```bash
# Start development with fresh config
npm run dev:fresh
```

#### 4. Clean Up Old Configs
```bash
# Remove all old configs
npm run di:clean

# Keep only 3 most recent configs
npm run di:clean-keep-recent
```

### Advanced Debugging

#### 1. Compare Hash Inputs
Check what inputs are being used for hash generation:

```bash
# Run with verbose output to see hash inputs
DEBUG=true npm run di:enhanced
```

Look for output like:
```
🔑 Config hash inputs: {
  "srcDir": "/path/to/src",
  "enableFunctionalDI": true,
  "packageName": "tdi2",
  "environment": "development"
}
🏗️ Generated config: tdi2-a1b2c3d4
```

#### 2. Check Debug URLs
While dev server is running, visit these URLs:

- `http://localhost:5173/_di_debug` - General debug info
- `http://localhost:5173/_di_interfaces` - Interface mappings  
- `http://localhost:5173/_di_configs` - All configurations

#### 3. Force Regeneration via API
```bash
# Force regeneration while dev server is running
curl -X POST http://localhost:5173/_di_regenerate
```

### Configuration Coordination Features

#### New ConfigManager Features
- **Existing Config Detection**: Automatically finds and reuses valid existing configs
- **Config Validation**: Checks if config files are complete and valid
- **Force Regeneration**: Ability to force clean regeneration
- **Better Hash Stability**: More consistent hash generation across contexts

#### Updated Vite Plugin Features
- **Config Reuse**: By default, reuses existing valid configurations
- **Smart Regeneration**: Only regenerates when necessary
- **Hot Update Coordination**: Better coordination with file changes
- **Debug Endpoints**: Enhanced debugging capabilities

### Workflow Recommendations

#### For Development
```bash
# Initial setup
npm run di:enhanced

# Start development (reuses config)
npm run dev

# If issues arise
npm run di:reset && npm run dev
```

#### For Production Build
```bash
# Ensure fresh config for build
npm run di:enhanced

# Build (uses the same config)
npm run build
```

#### For Testing
```bash
# Test interface resolution
npm run test:interfaces

# Validate current configuration
npm run di:validate

# Test DI container
npm run test
```

### Common Issues and Solutions

#### Issue: "Service not registered" in browser console
**Solution:**
```bash
npm run di:reset
npm run dev
```

#### Issue: Bridge files point to wrong config
**Solution:**
```bash
# Check current config
npm run di:check-config

# If invalid, reset
npm run di:reset
```

#### Issue: Hot reload not working for DI changes
**Solution:**
1. Check that the Vite plugin is configured correctly
2. Ensure `watch: true` in plugin options
3. Try manual reload or restart dev server

#### Issue: Multiple configs with same timestamp
**Solution:**
```bash
# Clean up and start fresh
npm run di:clean
npm run di:enhanced
npm run dev
```

### Understanding Config Hash Generation

The hash is generated from:
- **srcDir**: Absolute path to source directory
- **enableFunctionalDI**: Whether functional DI is enabled
- **packageName**: Name from package.json
- **environment**: 'development' or 'production'
- **customSuffix**: Optional custom suffix

These inputs are normalized and sorted to ensure consistency.

### Vite Plugin Configuration

Ensure your `vite.config.ts` has:

```typescript
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      verbose: true,
      enableInterfaceResolution: true,
      enableFunctionalDI: true,
      reuseExistingConfig: true, // NEW: Reuse existing configs
      watch: true,
      generateDebugFiles: true
    }),
    react()
  ]
});
```

### Prevention Tips

1. **Always run `npm run di:enhanced` before starting development** if you've made DI-related changes
2. **Use `npm run dev:fresh`** when switching branches or after major changes
3. **Check `npm run di:info`** for debug URLs during development
4. **Use `npm run di:validate`** to catch issues early
5. **Clean old configs periodically** with `npm run di:clean-keep-recent`

### Still Having Issues?

1. Check the generated bridge files in `src/.tdi2/`
2. Verify the config directory exists: `node_modules/.tdi2/configs/`
3. Check console output for hash generation details
4. Compare config metadata in `.config-meta.json` files
5. Try running with `DEBUG=true` for more verbose output

### Emergency Reset

If all else fails:
```bash
# Nuclear option: clean everything and start fresh
rm -rf node_modules/.tdi2
rm -rf src/.tdi2
npm run di:enhanced
npm run dev
```