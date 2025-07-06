// apps/legacy/src/__tests__/integrated-resolver.test.ts
import { describe, it, expect,beforeEach } from "bun:test";
import path from "path";
import { IntegratedInterfaceResolver } from "@tdi2/di-core/tools";

describe("IntegratedInterfaceResolver Test", () => {
  let resolver: IntegratedInterfaceResolver;

  beforeEach(() => {
    resolver = new IntegratedInterfaceResolver({
      verbose: true,
      srcDir: path.resolve(__dirname, "../"),
      enableInheritanceDI: true,
      enableStateDI: true,
      sourceConfig: {
        validateSources: false // Disable source validation
      }
    });
  });

  it("should scan project and find service implementations", async () => {
    console.log("🚀 Starting IntegratedInterfaceResolver scan...");
    
    await resolver.scanProject();
    
    const implementations = resolver.getInterfaceImplementations();
    const dependencies = resolver.getServiceDependencies();
    
    console.log(`📊 Results:`);
    console.log(`  - Implementations found: ${implementations.size}`);
    console.log(`  - Services with dependencies: ${dependencies.size}`);
    
    console.log(`📝 Implementation details:`);
    for (const [key, impl] of implementations) {
      console.log(`  - ${impl.implementationClass} -> ${impl.interfaceName} (${impl.sanitizedKey})`);
    }
    
    console.log(`🔗 Dependency details:`);
    for (const [className, dep] of dependencies) {
      console.log(`  - ${className} depends on: [${dep.interfaceDependencies.join(', ')}]`);
    }
    
    // Basic expectations
    expect(implementations.size).toBeGreaterThan(0);
    
    // Should find key services
    const implementationClasses = Array.from(implementations.values()).map(i => i.implementationClass);
    expect(implementationClasses).toContain('TDILoggerService');
    expect(implementationClasses).toContain('ExampleApiService');
  });

  it("should resolve specific implementations", async () => {
    await resolver.scanProject();
    
    // Test resolving LoggerInterface
    const loggerImpl = resolver.resolveImplementation('LoggerInterface');
    console.log(`🔍 LoggerInterface resolves to: ${loggerImpl?.implementationClass || 'NOT FOUND'}`);
    
    // Test resolving ExampleApiInterface  
    const apiImpl = resolver.resolveImplementation('ExampleApiInterface');
    console.log(`🔍 ExampleApiInterface resolves to: ${apiImpl?.implementationClass || 'NOT FOUND'}`);
    
    // Should find implementations
    expect(loggerImpl).toBeDefined();
    expect(apiImpl).toBeDefined();
  });

  it("should validate dependencies", async () => {
    await resolver.scanProject();
    
    const validation = resolver.validateDependencies();
    
    console.log(`📋 Validation results:`);
    console.log(`  - Is valid: ${validation.isValid}`);
    console.log(`  - Missing implementations: ${validation.missingImplementations.length}`);
    console.log(`  - Circular dependencies: ${validation.circularDependencies.length}`);
    
    if (validation.missingImplementations.length > 0) {
      console.log(`❌ Missing implementations:`);
      validation.missingImplementations.forEach(missing => {
        console.log(`    - ${missing}`);
      });
    }
    
    if (validation.circularDependencies.length > 0) {
      console.log(`🔄 Circular dependencies:`);
      validation.circularDependencies.forEach(circular => {
        console.log(`    - ${circular}`);
      });
    }
    
    // Should have found some implementations even if there are missing ones
    const implementations = resolver.getInterfaceImplementations();
    expect(implementations.size).toBeGreaterThan(0);
  });

  it("should show debug information about what it found", async () => {
    await resolver.scanProject();
    
    const debugInfo = resolver.getEnhancedDebugInfo();
    
    console.log(`🔍 Enhanced Debug Info:`);
    console.log(`  - Interface count: ${debugInfo.interfaceCount}`);
    console.log(`  - Dependency count: ${debugInfo.dependencyCount}`);
    console.log(`  - Registration types:`, debugInfo.registrationTypes);
    console.log(`  - Source config:`, debugInfo.sourceConfig);
    console.log(`  - Resolution samples:`, debugInfo.resolutionSamples);
    
    expect(debugInfo.interfaceCount).toBeGreaterThan(0);
  });

  it("should demonstrate the exact issue vs working baseline", async () => {
    console.log("🔍 Testing with source validation DISABLED...");
    
    const resolverWithoutValidation = new IntegratedInterfaceResolver({
      verbose: true,
      srcDir: path.resolve(__dirname, "../"),
      sourceConfig: {
        validateSources: false
      }
    });
    
    await resolverWithoutValidation.scanProject();
    const implsWithoutValidation = resolverWithoutValidation.getInterfaceImplementations();
    
    console.log(`📊 Without source validation: ${implsWithoutValidation.size} implementations`);
    
    console.log("🔍 Testing with source validation ENABLED...");
    
    const resolverWithValidation = new IntegratedInterfaceResolver({
      verbose: true,
      srcDir: path.resolve(__dirname, "../"),
      sourceConfig: {
        validateSources: true
      }
    });
    
    await resolverWithValidation.scanProject();
    const implsWithValidation = resolverWithValidation.getInterfaceImplementations();
    
    console.log(`📊 With source validation: ${implsWithValidation.size} implementations`);
    
    // Should show the difference
    expect(implsWithoutValidation.size).toBeGreaterThan(implsWithValidation.size);
    
    console.log(`💡 Difference: ${implsWithoutValidation.size - implsWithValidation.size} implementations lost due to source validation`);
  });
});