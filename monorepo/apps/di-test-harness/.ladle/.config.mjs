// .ladle/config.mjs - Fixed config for forcing DI plugin execution
import { defineConfig } from "@ladle/react";
import react from "@vitejs/plugin-react";
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";

// this is actually required for class based inject to work properly with vite
const compilerOptions = { experimentalDecorators: true };

// Force DI transformation since Ladle might not trigger buildStart
const forceDiTransformation = () => {
  return {
    name: 'force-di-transformation',
    async buildStart() {
      console.log("🔧 Forcing DI transformation for Ladle...");
      
      try {
        // Manually run transformation since Ladle might not trigger the plugin
        const { EnhancedDITransformer } = await import("@tdi2/di-core/tools");
        
        const transformer = new EnhancedDITransformer({
          srcDir: "./src",
          outputDir: "./src/.tdi2",
          verbose: true,
          enableFunctionalDI: true,
          enableInterfaceResolution: true,
          generateDebugFiles: true,
        });
        
        console.log("🏃 Running DI transformation...");
        const result = await transformer.transform();
        
        console.log("✅ DI transformation completed for Ladle");
        console.log(`  - Candidates: ${result.summary.totalCandidates}`);
        console.log(`  - Successful: ${result.summary.successfulTransformations}`);
        console.log(`  - Duration: ${result.summary.performance.duration}ms`);
        
        if (result.errors.length > 0) {
          console.warn("⚠️  DI Errors:", result.errors.map(e => e.message));
        }
        
      } catch (error) {
        console.error("❌ Failed to run DI transformation:", error);
        console.log("💡 Falling back to manual DI setup...");
      }
    },
    
    // Also try on config resolved in case buildStart doesn't work
    async configResolved() {
      console.log("🔧 DI transformation on configResolved...");
    }
  };
};

// Wrap the original DI plugin with debug logging
const debugDiPlugin = () => {
  console.log("🔧 Creating diEnhancedPlugin...");
  
  const plugin = diEnhancedPlugin({
    verbose: true,
    watch: true,
    enableFunctionalDI: true,
    enableInterfaceResolution: true,
    generateDebugFiles: true,
    cleanOldConfigs: true,
    keepConfigCount: 3,
  });
  
  console.log("✅ diEnhancedPlugin created:", plugin.name);
  
  // Wrap the plugin to see when methods are called
  return {
    ...plugin,
    name: `debug-${plugin.name}`,
    async buildStart(...args) {
      console.log(`🚀 ${plugin.name} buildStart called`);
      return plugin.buildStart?.(...args);
    },
    async configResolved(config) {
      console.log(`⚙️ ${plugin.name} configResolved called`);
      return plugin.configResolved?.(config);
    },
    async load(id) {
      if (id.includes('di-config') || id.includes('.tdi2')) {
        console.log(`📁 ${plugin.name} load called for:`, id);
      }
      return plugin.load?.(id);
    },
    async resolveId(id) {
      if (id.includes('di-config') || id.includes('.tdi2')) {
        console.log(`🔍 ${plugin.name} resolveId called for:`, id);
      }
      return plugin.resolveId?.(id);
    }
  };
};

export default defineConfig({
  stories: "src/**/*.stories.{js,jsx,ts,tsx}",
  viteConfig: {
    plugins: [
      // Add forced transformation first (in case other hooks don't work)
      forceDiTransformation(),
      // Then add the debug-wrapped original plugin
      debugDiPlugin(),
      react(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        tsconfigRaw: { compilerOptions },
      },
    },
    build: {
      // Ensure DI transformation runs before build
      target: "es2020",
    },
    // Add debug logging for Vite itself
    logLevel: 'info',
    clearScreen: false,
  },
});