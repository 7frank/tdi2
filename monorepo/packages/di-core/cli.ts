// example-usage.ts - Demonstrates usage of refactored transformers with shared logic

import { EnhancedDITransformer } from "./tools/enhanced-di-transformer";
import { FunctionalDIEnhancedTransformer } from "./tools/functional-di-enhanced-transformer/functional-di-enhanced-transformer";
import { DependencyTreeBuilder } from "./tools/dependency-tree-builder";
import { ConfigManager } from "./tools/config-manager";

// Example: Using the refactored class-based transformer
async function useClassBasedTransformer() {
  console.log(
    "🚀 Using refactored class-based transformer with shared logic..."
  );

  const transformer = new EnhancedDITransformer({
    srcDir: "./src",
    verbose: true,
    enableInterfaceResolution: true,
  });

  try {
    const result = await transformer.transform();

    console.log("✅ Class-based transformation completed:");
    console.log(`  - Candidates: ${result.summary.totalCandidates}`);
    console.log(`  - Successful: ${result.summary.successfulTransformations}`);
    console.log(
      `  - Dependencies resolved: ${result.summary.dependenciesResolved}`
    );
    console.log(`  - Duration: ${result.summary.performance.duration}ms`);

    // Access shared components
    const typeResolver = transformer.getTypeResolver();
    const serviceRegistry = transformer.getServiceRegistry();
    const interfaceResolver = transformer.getInterfaceResolver();

    console.log("\n📊 Shared component statistics:");
    console.log(
      `  - Available types: ${typeResolver.getAvailableTypes().length}`
    );
    console.log(
      `  - Registry validation: ${(await serviceRegistry.validateRegistry()).isValid ? "✅" : "❌"}`
    );
    console.log(
      `  - Interface implementations: ${interfaceResolver.getInterfaceImplementations().size}`
    );

    if (result.errors.length > 0) {
      console.warn(
        "\n⚠️  Errors:",
        result.errors.map((e) => e.message)
      );
    }

    if (result.warnings.length > 0) {
      console.warn(
        "\n⚠️  Warnings:",
        result.warnings.map((w) => w.message)
      );
    }
  } catch (error) {
    console.error("❌ Class-based transformation failed:", error);
  }
}

// Example: Using the refactored functional component transformer
async function useFunctionalTransformer() {
  console.log(
    "🎯 Using refactored functional transformer with shared logic..."
  );

  const transformer = new FunctionalDIEnhancedTransformer({
    srcDir: "./src",
    verbose: true,
    generateDebugFiles: true,
  });

  try {
    const result = await transformer.transform();

    console.log("✅ Functional transformation completed:");
    console.log(`  - Candidates: ${result.summary.totalCandidates}`);
    console.log(`  - Successful: ${result.summary.successfulTransformations}`);
    console.log(`  - Functions: ${result.summary.byType.function}`);
    console.log(`  - Arrow functions: ${result.summary.byType.arrowFunction}`);
    console.log(`  - Duration: ${result.summary.performance.duration}ms`);

    // Access shared components (same as class-based)
    const typeResolver = transformer.getTypeResolver();
    const serviceRegistry = transformer.getServiceRegistry();

    console.log("\n📊 Shared resolution strategies:");
    const strategies = result.summary.byResolutionStrategy;
    console.log(`  - Interface-based: ${strategies.interface}`);
    console.log(`  - Inheritance-based: ${strategies.inheritance}`);
    console.log(`  - State-based: ${strategies.state}`);
    console.log(`  - Class-based: ${strategies.class}`);
    console.log(`  - Not found: ${strategies.notFound}`);
  } catch (error) {
    console.error("❌ Functional transformation failed:", error);
  }
}


await useClassBasedTransformer();
await useFunctionalTransformer();