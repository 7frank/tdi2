# RSI SSR: Build Integration & Tooling

## Build System Challenges

RSI SSR requires sophisticated build tooling to handle dual-environment compilation, service registration, and code splitting between server and client bundles.

## TDI2 Transformer Enhancements

### Dual-Environment Code Generation

```typescript
// Enhanced TDI2 plugin configuration
export interface TDI2SSRConfig {
  // Existing options
  enableFunctionalDI: boolean
  enableInterfaceResolution: boolean
  
  // New SSR options
  environments: ('client' | 'server')[]
  generateServerConfig: boolean
  generateClientConfig: boolean
  enableProfileBasedInjection: boolean
  enableServiceStateExtraction: boolean
  enableHydrationHelpers: boolean
}

// vite.config.ts
export default defineConfig({
  plugins: [
    diEnhancedPlugin({
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
      
      // SSR Configuration
      environments: ['client', 'server'],
      generateServerConfig: true,
      generateClientConfig: true,
      enableProfileBasedInjection: true,
      enableServiceStateExtraction: true,
      enableHydrationHelpers: true
    }),
    react()
  ]
})
```

### Generated Configuration per Environment

```typescript
// src/.tdi2/server-di-config.ts (generated)
export const SERVER_DI_CONFIG = {
  services: [
    {
      token: 'UserService',
      implementation: 'UserService',
      interface: 'UserServiceInterface',
      profile: ['server', 'isomorphic']
    },
    {
      token: 'UserRepository', 
      implementation: 'DatabaseUserRepository',
      interface: 'UserRepository',
      profile: ['server']
    }
  ],
  interfaces: {
    'UserServiceInterface': 'UserService',
    'UserRepository': 'DatabaseUserRepository'
  }
}

// src/.tdi2/client-di-config.ts (generated)  
export const CLIENT_DI_CONFIG = {
  services: [
    {
      token: 'UserService',
      implementation: 'UserService', 
      interface: 'UserServiceInterface',
      profile: ['client', 'isomorphic']
    },
    {
      token: 'UserRepository',
      implementation: 'ApiUserRepository',
      interface: 'UserRepository', 
      profile: ['client']
    }
  ],
  interfaces: {
    'UserServiceInterface': 'UserService',
    'UserRepository': 'ApiUserRepository'
  }
}
```

## Vite Plugin for SSR Support

### Enhanced Build Pipeline

```typescript
// plugins/vite-plugin-rsi-ssr.ts
export function rsiSSRPlugin(options: RSISSROptions): Plugin {
  return {
    name: 'rsi-ssr',
    
    // Generate environment-specific configs
    buildStart() {
      generateServerConfig(options)
      generateClientConfig(options)
      generateHydrationHelpers(options)
    },
    
    // Transform imports based on environment
    resolveId(id, importer) {
      if (id.includes('di-config')) {
        const isServerBuild = this.meta?.isServer
        return isServerBuild 
          ? path.resolve('src/.tdi2/server-di-config.ts')
          : path.resolve('src/.tdi2/client-di-config.ts')
      }
    },
    
    // Transform service injections
    transform(code, id) {
      if (id.includes('.tsx') || id.includes('.ts')) {
        return transformServiceInjections(code, {
          enableSSR: true,
          environment: this.meta?.isServer ? 'server' : 'client'
        })
      }
    },
    
    // Generate hydration utilities
    generateBundle(options, bundle) {
      if (!this.meta?.isServer) {
        // Client bundle gets hydration helpers
        this.emitFile({
          type: 'chunk',
          fileName: 'rsi-hydration.js',
          source: generateHydrationUtils()
        })
      }
    }
  }
}
```

### Component Transformation for SSR

```typescript
// Before transformation
function UserProfile({ userService }: {
  userService: Inject<UserServiceInterface>
}) {
  const user = userService.state.currentUser
  return <div>{user?.name}</div>
}

// After transformation (server)
function UserProfile() {
  const userService = useServerService('UserService')
  // No useSnapshot on server - direct state access
  const user = userService.state.currentUser
  return <div>{user?.name}</div>
}

// After transformation (client) 
function UserProfile() {
  const userService = useClientService('UserService')
  const userSnap = useSnapshot(userService.state) // Valtio reactivity
  return <div>{userSnap.currentUser?.name}</div>
}
```

## Webpack Integration

### RSLoader for Webpack

```typescript
// loaders/rsi-ssr-loader.ts
export default function rsiSSRLoader(source: string) {
  const callback = this.async()
  const options = this.getOptions() as RSISSRLoaderOptions
  
  try {
    const transformed = transformForSSR(source, {
      isServer: options.isServer,
      enableStateExtraction: options.enableStateExtraction,
      generateHydrationCode: !options.isServer
    })
    
    callback(null, transformed)
  } catch (error) {
    callback(error)
  }
}

// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          'babel-loader',
          {
            loader: 'rsi-ssr-loader',
            options: {
              isServer: process.env.BUILD_TARGET === 'server',
              enableStateExtraction: true
            }
          }
        ]
      }
    ]
  }
}
```

## Metro (React Native) Integration

### Metro Transformer for RSI

```typescript
// metro-transformer-rsi-ssr.js
const { transform } = require('@tdi2/transformer')

module.exports.transform = function({ src, filename, options }) {
  // Only transform RSI components
  if (src.includes('Inject<') || src.includes('@Service')) {
    const transformed = transform(src, {
      filename,
      isSSR: options.dev ? false : true, // SSR for production builds
      platform: options.platform
    })
    
    return {
      code: transformed,
      map: null
    }
  }
  
  // Fall back to default transformer
  return require('@react-native-community/cli-plugin-metro/build/commands/bundle/metro-transform').transform({
    src, filename, options
  })
}
```

## Next.js Integration

### Next.js Plugin for RSI

```typescript
// next-plugin-rsi.js
module.exports = (nextConfig = {}) => {
  return {
    ...nextConfig,
    
    webpack(config, { buildId, dev, isServer, defaultLoaders, webpack }) {
      // Add RSI transformation
      config.module.rules.push({
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          defaultLoaders.babel,
          {
            loader: 'rsi-ssr-loader',
            options: {
              isServer,
              enableStateExtraction: !dev,
              generateHydrationCode: !isServer
            }
          }
        ]
      })
      
      // Environment-specific DI config resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        '@rsi/di-config': isServer 
          ? path.resolve('.next/server-di-config.js')
          : path.resolve('.next/client-di-config.js')
      }
      
      return config
    },
    
    // Generate configs during build
    async generateBuildId() {
      await generateSSRConfigs({
        outputDir: '.next',
        srcDir: './src'
      })
      return nextConfig.generateBuildId ? nextConfig.generateBuildId() : null
    }
  }
}

// next.config.js
const withRSI = require('next-plugin-rsi')

module.exports = withRSI({
  experimental: {
    esmExternals: true
  },
  
  // RSI-specific configuration
  rsi: {
    enableStateExtraction: true,
    enableProfileBasedInjection: true,
    serverProfiles: ['server', 'isomorphic'],
    clientProfiles: ['client', 'isomorphic']
  }
})
```

## Bundle Optimization

### Tree Shaking for Environment-Specific Code

```typescript
// Conditional service loading
export function createEnvironmentContainer(): DIContainer {
  const container = new CompileTimeDIContainer()
  
  if (typeof window === 'undefined') {
    // Server-only imports - tree-shaken from client bundle
    const { SERVER_DI_CONFIG } = require('./.tdi2/server-di-config')
    container.loadConfiguration(SERVER_DI_CONFIG)
  } else {
    // Client-only imports - tree-shaken from server bundle  
    const { CLIENT_DI_CONFIG } = require('./.tdi2/client-di-config')
    container.loadConfiguration(CLIENT_DI_CONFIG)
  }
  
  return container
}

// Webpack DefinePlugin for dead code elimination
module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.IS_SERVER': JSON.stringify(isServer),
      'process.env.IS_CLIENT': JSON.stringify(!isServer)
    })
  ]
}

// Code that gets eliminated
if (process.env.IS_SERVER) {
  // This block removed from client bundle
  registerServerOnlyServices(container)
}

if (process.env.IS_CLIENT) {
  // This block removed from server bundle
  setupClientOnlyFeatures(container)
}
```

### Code Splitting for Services

```typescript
// Dynamic service loading for better performance
export async function loadUserFeatures(): Promise<void> {
  if (typeof window !== 'undefined') {
    // Lazy load client-specific services
    const { ClientUserService } = await import('./services/ClientUserService')
    const { ApiUserRepository } = await import('./repositories/ApiUserRepository')
    
    container.register('UserService', ClientUserService)
    container.register('UserRepository', ApiUserRepository)
  }
}

// Route-based service loading
export const UserProfilePage = lazy(async () => {
  await loadUserFeatures()
  return import('./pages/UserProfilePage')
})
```

## Development Tools

### RSI SSR DevTools Extension

```typescript
// devtools/rsi-ssr-inspector.ts
export class RSISSRInspector {
  private serviceStates = new Map()
  private hydrationDiffs = new Map()
  
  captureServerState(serviceName: string, state: any): void {
    this.serviceStates.set(`server:${serviceName}`, state)
  }
  
  captureClientState(serviceName: string, state: any): void {
    this.serviceStates.set(`client:${serviceName}`, state)
    
    // Compare with server state
    const serverState = this.serviceStates.get(`server:${serviceName}`)
    if (serverState) {
      const diff = deepDiff(serverState, state)
      if (diff.length > 0) {
        this.hydrationDiffs.set(serviceName, diff)
        console.warn(`🚨 Hydration mismatch in ${serviceName}:`, diff)
      }
    }
  }
  
  getHydrationReport(): HydrationReport {
    return {
      services: Array.from(this.serviceStates.keys()),
      mismatches: Array.from(this.hydrationDiffs.entries()),
      recommendations: this.generateRecommendations()
    }
  }
}

// Integration with React DevTools
if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  window.__RSI_SSR_INSPECTOR__ = new RSISSRInspector()
}
```

### Hot Module Replacement Support

```typescript
// HMR support for service updates
if (module.hot && typeof window !== 'undefined') {
  module.hot.accept('./services/UserService', () => {
    // Re-register updated service
    const { UserService } = require('./services/UserService')
    container.register('UserService', UserService)
    
    // Preserve existing state during HMR
    const existingState = container.get('UserService').state
    const newService = container.get('UserService')
    Object.assign(newService.state, existingState)
    
    console.log('🔄 RSI Service hot reloaded: UserService')
  })
}
```

## CLI Tools

### RSI SSR CLI

```bash
# Generate SSR configurations
npx rsi-ssr generate-configs --src ./src --output ./.rsi

# Validate service compatibility
npx rsi-ssr validate --config ./rsi.config.js

# Analyze bundle sizes
npx rsi-ssr analyze --server-bundle ./dist/server.js --client-bundle ./dist/client.js

# Test hydration compatibility  
npx rsi-ssr test-hydration --url http://localhost:3000/users/123
```

### Configuration File

```typescript
// rsi-ssr.config.ts
export default {
  environments: ['server', 'client'],
  profiles: {
    server: ['server', 'isomorphic'],
    client: ['client', 'isomorphic']
  },
  
  build: {
    enableTreeShaking: true,
    enableCodeSplitting: true,
    generateSourceMaps: true
  },
  
  development: {
    enableHMR: true,
    enableDevTools: true,
    validateHydration: true
  },
  
  optimization: {
    enableLazyLoading: true,
    enableServiceCaching: true,
    bundleAnalysis: true
  }
} satisfies RSISSRConfig
```

## Implementation Timeline

### Phase 1: Basic Build Support (4-6 weeks)
- Enhance TDI2 transformer for dual-environment output
- Create Vite plugin for SSR configuration generation
- Implement basic service profile filtering

### Phase 2: Framework Integration (6-8 weeks)
- Build Next.js plugin with RSI support
- Create webpack loader for RSI transformation
- Implement bundle optimization strategies

### Phase 3: Developer Experience (4-6 weeks)
- Build RSI SSR DevTools extension
- Create CLI tools for configuration and validation
- Implement HMR support for services

### Phase 4: Production Optimization (6-8 weeks)
- Advanced code splitting strategies
- Performance monitoring and optimization
- Production deployment guides and tooling

## Benefits

- ✅ **Unified build pipeline** for server and client RSI applications
- ✅ **Framework integration** with popular SSR solutions
- ✅ **Developer experience** with hot reloading and debugging tools
- ✅ **Production optimization** through code splitting and tree shaking

## Challenges

- ❌ **Complex build configuration** requiring sophisticated tooling
- ❌ **Framework compatibility** may require custom integration for each framework
- ❌ **Bundle size management** with dual-environment code generation
- ❌ **Performance overhead** from build-time analysis and transformation