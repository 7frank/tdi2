// prepare-ladle.mjs - Prepare DI configuration for Ladle
import { EnhancedDITransformer } from "@tdi2/di-core/tools";
import { existsSync, mkdirSync } from 'fs';

console.log("🔧 Preparing DI configuration for Ladle...");

try {
  // Ensure .tdi2 directory exists
  if (!existsSync('./src/.tdi2')) {
    mkdirSync('./src/.tdi2', { recursive: true });
    console.log("📁 Created .tdi2 directory");
  }

  // Run transformation
  const transformer = new EnhancedDITransformer({
    srcDir: "./src",
    outputDir: "./src/.tdi2",
    verbose: true,
    enableFunctionalDI: true,
    enableInterfaceResolution: true,
    generateDebugFiles: true,
    cleanOldConfigs: false, // Don't clean for Ladle
    keepConfigCount: 1,
  });

  console.log("🏃 Running DI transformation...");
  const result = await transformer.transform();

  console.log("✅ DI transformation completed!");
  console.log(`  - Config generated: ${result.configHash}`);
  console.log(`  - Candidates found: ${result.summary.totalCandidates}`);
  console.log(`  - Successfully transformed: ${result.summary.successfulTransformations}`);
  console.log(`  - Duration: ${result.summary.performance.duration}ms`);

  if (result.errors.length > 0) {
    console.warn("⚠️  Errors encountered:");
    result.errors.forEach(error => console.warn(`  - ${error.message}`));
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️  Warnings:");
    result.warnings.forEach(warning => console.warn(`  - ${warning.message}`));
  }

  console.log("\n🎯 Ladle is ready! You can now run:");
  console.log("  npm run dev");

} catch (error) {
  console.error("❌ Failed to prepare DI configuration:");
  console.error(error);
  
  console.log("\n💡 Fallback options:");
  console.log("1. Copy config from main app:");
  console.log("   cp -r ../legacy/src/.tdi2/ ./src/");
  console.log("2. Create mock services manually");
  
  process.exit(1);
}