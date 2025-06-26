// tools/config-manager.ts - Fixed version with consistent hashing

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

interface DIConfigOptions {
  srcDir: string;
  outputDir: string;
  enableFunctionalDI: boolean;
  verbose: boolean;
  nodeEnv?: string;
  customSuffix?: string;
}

export class ConfigManager {
  private configHash: string;
  private configDir: string;
  private bridgeDir: string;
  private options: DIConfigOptions;
  private packageName: string;

  constructor(options: DIConfigOptions) {
    this.options = {
      nodeEnv: process.env.NODE_ENV || 'development',
      ...options
    };
    
    this.packageName = this.getPackageName();
    this.configHash = this.generateConfigHash();
    this.configDir = path.resolve(`node_modules/.tdi2/configs/${this.configHash}`);
    this.bridgeDir = path.resolve(options.srcDir, '.tdi2');
    
    this.ensureDirectories();
  }

  private getPackageName(): string {
    try {
      const require = createRequire(import.meta.url);
      const packageJson = require(path.resolve('package.json'));
      return packageJson.name || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private generateConfigHash(): string {
    // FIXED: Make hash generation more deterministic
    // Normalize paths to be consistent regardless of execution context
    const normalizedSrcDir = path.resolve(this.options.srcDir).replace(/\\/g, '/');
    
    // Only include essential configuration that affects DI behavior
    const hashInput = {
      srcDir: normalizedSrcDir,
      enableFunctionalDI: this.options.enableFunctionalDI,
      packageName: this.packageName,
      // Remove nodeEnv from hash unless it's explicitly different
      // This prevents dev vs build from having different configs
      environment: this.options.nodeEnv === 'production' ? 'production' : 'development',
      // Only include customSuffix if provided
      ...(this.options.customSuffix && { customSuffix: this.options.customSuffix })
    };

    // Sort keys for consistent hashing
    const sortedKeys = Object.keys(hashInput).sort();
    const sortedHashInput = sortedKeys.reduce((acc, key) => {
      acc[key] = hashInput[key as keyof typeof hashInput];
      return acc;
    }, {} as any);

    const hashString = JSON.stringify(sortedHashInput);
    const hash = crypto.createHash('sha256').update(hashString).digest('hex').substring(0, 8);
    
    // FIXED: Use a more stable naming scheme
    const configName = `${this.packageName}-${hash}`;
    
    if (this.options.verbose) {
      console.log(`🔑 Config hash inputs:`, sortedHashInput);
      console.log(`🏗️  Generated config: ${configName}`);
    }
    
    return configName;
  }

  // FIXED: Add method to check for existing configurations
  findExistingConfig(): string | null {
    const tdi2Dir = path.resolve('node_modules/.tdi2/configs');
    
    if (!fs.existsSync(tdi2Dir)) {
      return null;
    }

    try {
      const configs = fs.readdirSync(tdi2Dir)
        .filter(name => name.startsWith(this.packageName))
        .map(name => ({
          name,
          path: path.join(tdi2Dir, name),
          stats: fs.statSync(path.join(tdi2Dir, name))
        }))
        .filter(item => item.stats.isDirectory())
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // FIXED: Check if any existing config has the required files
      for (const config of configs) {
        const diConfigFile = path.join(config.path, 'di-config.ts');
        if (fs.existsSync(diConfigFile)) {
          if (this.options.verbose) {
            console.log(`♻️  Found existing config: ${config.name}`);
          }
          return config.name;
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn('⚠️  Failed to scan existing configs:', error);
      }
    }

    return null;
  }

  // FIXED: Use existing config if available and valid
  private ensureDirectories(): void {
    // Check for existing valid configuration first
    const existingConfig = this.findExistingConfig();
    
    if (existingConfig && existingConfig !== this.configHash) {
      if (this.options.verbose) {
        console.log(`🔄 Using existing config: ${existingConfig}`);
      }
      
      // Update to use existing config
      this.configHash = existingConfig;
      this.configDir = path.resolve(`node_modules/.tdi2/configs/${this.configHash}`);
    }

    // Ensure config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Ensure bridge directory exists
    if (!fs.existsSync(this.bridgeDir)) {
      fs.mkdirSync(this.bridgeDir, { recursive: true });
    }

    // Create transformed subdirectory
    const transformedDir = path.join(this.configDir, 'transformed');
    if (!fs.existsSync(transformedDir)) {
      fs.mkdirSync(transformedDir, { recursive: true });
    }

    // Write config metadata for debugging
    this.writeConfigMetadata();
  }

  private writeConfigMetadata(): void {
    const metadata = {
      configHash: this.configHash,
      generatedAt: new Date().toISOString(),
      options: this.options,
      packageName: this.packageName,
      paths: {
        configDir: this.configDir,
        bridgeDir: this.bridgeDir
      },
      // FIXED: Add version tracking
      version: '2.0.0',
      hashInputs: {
        srcDir: path.resolve(this.options.srcDir).replace(/\\/g, '/'),
        enableFunctionalDI: this.options.enableFunctionalDI,
        packageName: this.packageName,
        environment: this.options.nodeEnv === 'production' ? 'production' : 'development'
      }
    };

    fs.writeFileSync(
      path.join(this.configDir, '.config-meta.json'),
      JSON.stringify(metadata, null, 2)
    );
  }

  generateBridgeFiles(): void {
    if (this.options.verbose) {
      console.log(`🌉 Generating bridge files in ${this.bridgeDir}`);
    }

    // Generate DI config bridge
    this.generateDIConfigBridge();
    
    // Generate registry bridge
    this.generateRegistryBridge();

    // Generate .gitignore for bridge directory
    this.generateBridgeGitignore();

    if (this.options.verbose) {
      console.log(`✅ Bridge files generated for config: ${this.configHash}`);
    }
  }

  private generateDIConfigBridge(): void {
    const relativePath = path.relative(
      this.bridgeDir,
      path.join(this.configDir, 'di-config.ts')
    ).replace(/\\/g, '/');

    const bridgeContent = `// Auto-generated bridge file - do not edit
// Config: ${this.configHash}
// Generated: ${new Date().toISOString()}

export * from '${relativePath}';
`;

    fs.writeFileSync(
      path.join(this.bridgeDir, 'di-config.ts'),
      bridgeContent
    );
  }

  private generateRegistryBridge(): void {
    const relativePath = path.relative(
      this.bridgeDir,
      path.join(this.configDir, 'AutoGeneratedRegistry.ts')
    ).replace(/\\/g, '/');

    const bridgeContent = `// Auto-generated bridge file - do not edit
// Config: ${this.configHash}
// Generated: ${new Date().toISOString()}

export * from '${relativePath}';
`;

    fs.writeFileSync(
      path.join(this.bridgeDir, 'registry.ts'),
      bridgeContent
    );
  }

  private generateBridgeGitignore(): void {
    const gitignoreContent = `# Auto-generated TDI2 bridge files
*
!.gitignore
!README.md
`;

    fs.writeFileSync(
      path.join(this.bridgeDir, '.gitignore'),
      gitignoreContent
    );

    // Also create a README for clarity
    const readmeContent = `# TDI2 Bridge Files

This directory contains auto-generated bridge files that connect your source code to the actual DI configuration files.

**Do not edit these files manually** - they are regenerated automatically.

## Current Configuration
- Config Hash: ${this.configHash}
- Config Directory: ${this.configDir}
- Generated: ${new Date().toISOString()}

## Files
- \`di-config.ts\` - Exports DI configuration
- \`registry.ts\` - Exports service registry

## Debugging
If you see issues with mismatched configurations:
1. Check \`npm run di:info\` for debug URLs
2. Compare config hashes between CLI and dev server
3. Use \`npm run di:clean\` to reset all configs
4. Run \`npm run di:enhanced\` followed by \`npm run dev\`
`;

    fs.writeFileSync(
      path.join(this.bridgeDir, 'README.md'),
      readmeContent
    );
  }

  // FIXED: Add method to check if config is valid
  isConfigValid(): boolean {
    const diConfigFile = path.join(this.configDir, 'di-config.ts');
    const registryFile = path.join(this.configDir, 'AutoGeneratedRegistry.ts');
    
    return fs.existsSync(diConfigFile) && fs.existsSync(registryFile);
  }

  // FIXED: Add method to force regeneration
  forceRegenerate(): void {
    if (fs.existsSync(this.configDir)) {
      fs.rmSync(this.configDir, { recursive: true, force: true });
    }
    this.ensureDirectories();
  }

  // Getters for other classes to use
  getConfigDir(): string {
    return this.configDir;
  }

  getBridgeDir(): string {
    return this.bridgeDir;
  }

  getConfigHash(): string {
    return this.configHash;
  }

  getTransformedDir(): string {
    return path.join(this.configDir, 'transformed');
  }

  // FIXED: Enhanced cleanup with better logic
  static cleanOldConfigs(keepCount: number = 3): void {
    const tdi2Dir = path.resolve('node_modules/.tdi2/configs');
    
    if (!fs.existsSync(tdi2Dir)) {
      return;
    }

    try {
      const configs = fs.readdirSync(tdi2Dir)
        .map(name => ({
          name,
          path: path.join(tdi2Dir, name),
          stats: fs.statSync(path.join(tdi2Dir, name))
        }))
        .filter(item => item.stats.isDirectory())
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Keep the most recent configs, remove the rest
      const toRemove = configs.slice(keepCount);
      
      for (const config of toRemove) {
        try {
          fs.rmSync(config.path, { recursive: true, force: true });
          console.log(`🗑️  Cleaned up old config: ${config.name}`);
        } catch (error) {
          console.warn(`⚠️  Failed to remove config ${config.name}:`, error);
        }
      }
      
      if (toRemove.length === 0 && configs.length > 0) {
        console.log(`📋 Found ${configs.length} configs, all within keep limit`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to clean old configs:', error);
    }
  }

  // FIXED: Add method to list all configs
  static listConfigs(): void {
    const tdi2Dir = path.resolve('node_modules/.tdi2/configs');
    
    if (!fs.existsSync(tdi2Dir)) {
      console.log('📋 No configuration directory found');
      return;
    }

    try {
      const configs = fs.readdirSync(tdi2Dir)
        .map(name => {
          const configPath = path.join(tdi2Dir, name);
          const metaFile = path.join(configPath, '.config-meta.json');
          let metadata = null;
          
          if (fs.existsSync(metaFile)) {
            try {
              metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
            } catch (error) {
              // Ignore metadata read errors
            }
          }
          
          return {
            name,
            path: configPath,
            metadata,
            stats: fs.statSync(configPath),
            isValid: fs.existsSync(path.join(configPath, 'di-config.ts'))
          };
        })
        .filter(item => item.stats.isDirectory())
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      console.log(`📋 Found ${configs.length} configurations:`);
      
      for (const config of configs) {
        const age = Math.round((Date.now() - config.stats.mtime.getTime()) / (1000 * 60));
        const status = config.isValid ? '✅' : '❌';
        console.log(`  ${status} ${config.name} (${age}m ago)`);
        
        if (config.metadata) {
          console.log(`     Generated: ${config.metadata.generatedAt}`);
          console.log(`     Options: functional=${config.metadata.options?.enableFunctionalDI}`);
        }
      }
    } catch (error) {
      console.warn('⚠️  Failed to list configs:', error);
    }
  }
}