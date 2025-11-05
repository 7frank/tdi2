// apps/legacy/src/__tests__/dev-vs-test.test.ts
import { describe, it, expect } from "bun:test";
import path from "path";
import { IntegratedInterfaceResolver } from "@tdi2/di-core/tools";
import { ConfigManager } from "@tdi2/di-core/tools";

describe("Dev Server vs Test Environment Comparison", () => {
  it("should replicate the exact dev server configuration", async () => {
    console.log("🚀 Replicating EXACT dev server configuration...");
    
    // Use the EXACT same configuration as the dev server
    const configManager = new ConfigManager({
      srcDir: path.resolve(__dirname, "../"),
      outputDir: path.resolve(__dirname, "../generated"),
      enableFunctionalDI: false, // This matches the first phase in dev logs
      verbose: true,
    });
    
    const resolver = new IntegratedInterfaceResolver({
      verbose: true,
      srcDir: path.resolve(__dirname, "../"),
      enableInheritanceDI: true,
      enableStateDI: true,
    });
    
    console.log("📁 Source directory:", path.resolve(__dirname, "../"));
    console.log("🏗️  Config hash:", configManager.getConfigHash());
    
    await resolver.scanProject();
    
    const implementations = resolver.getInterfaceImplementations();
    const dependencies = resolver.getServiceDependencies();
    
    console.log("📊 EXACT Results:");
    console.log(`  - Interface implementations: ${implementations.size}`);
    console.log(`  - Services with dependencies: ${dependencies.size}`);
    
    // List all found services
    console.log("📝 Found services:");
    for (const [key, impl] of implementations) {
      console.log(`  ✅ ${impl.implementationClass} implements ${impl.interfaceName}`);
    }
    
    // List services with dependencies
    console.log("🔗 Services with dependencies:");
    for (const [className, dep] of dependencies) {
      console.log(`  🔗 ${className} depends on: [${dep.interfaceDependencies.join(', ')}]`);
    }
    
    // The dev server shows 0 implementations but 4 services with dependencies
    // This suggests services are being found but not registered as implementations
    console.log("\n🤔 Analysis:");
    console.log(`Expected from dev logs: 0 implementations, 4 services with dependencies`);
    console.log(`Actual test results: ${implementations.size} implementations, ${dependencies.size} services with dependencies`);
    
    if (implementations.size === 0 && dependencies.size === 4) {
      console.log("✅ Test matches dev server behavior - reproducing the bug!");
    } else if (implementations.size > 0) {
      console.log("❌ Test shows working behavior - not reproducing the bug");
      console.log("This means the issue might be in the transformer phase, not the scanning phase");
    }
  });

  it("should check if services have @Service decorators but aren't being registered", async () => {
    console.log("🔍 Checking individual service processing...");
    
    const resolver = new IntegratedInterfaceResolver({
      verbose: true,
      srcDir: path.resolve(__dirname, "../"),
    });
    
    // Let's manually check what happens with specific services
    const testServices = [
      'TDILoggerService',
      'ExampleApiService', 
      'UserApiServiceImpl',
      'TodoService2'
    ];
    
    // Scan first
    await resolver.scanProject();
    
    console.log("🔍 Checking specific services:");
    for (const serviceName of testServices) {
      const impl = resolver.getImplementationByClass(serviceName);
      if (impl) {
        console.log(`  ✅ ${serviceName} -> registered as ${impl.interfaceName}`);
      } else {
        console.log(`  ❌ ${serviceName} -> NOT REGISTERED`);
      }
    }
    
    // Check if dependencies exist for these services
    const dependencies = resolver.getServiceDependencies();
    for (const serviceName of testServices) {
      const dep = dependencies.get(serviceName);
      if (dep) {
        console.log(`  🔗 ${serviceName} -> has dependencies: [${dep.interfaceDependencies.join(', ')}]`);
      } else {
        console.log(`  ⚫ ${serviceName} -> no dependencies found`);
      }
    }
  });

  it("should test the enhanced service validator directly", async () => {
    console.log("🔍 Testing EnhancedServiceValidator directly...");
    
    // Import the validator components
    const { Project } = await import("ts-morph");
    const { EnhancedServiceValidator } = await import("../../../../packages/di-core/tools/interface-resolver/enhanced-service-validator");
    
    const project = new Project({
      useInMemoryFileSystem: false,
      tsConfigFilePath: path.resolve(__dirname, "../../tsconfig.json"),
    });
    
    project.addSourceFilesAtPaths(path.resolve(__dirname, "../**/*.{ts,tsx}"));
    
    const validator = new EnhancedServiceValidator(true); // verbose = true
    
    let servicesFound = 0;
    let servicesWithValidDecorators = 0;
    let servicesRejectedByValidator = 0;
    
    for (const sourceFile of project.getSourceFiles()) {
      if (sourceFile.getFilePath().includes('node_modules')) continue;
      
      for (const classDecl of sourceFile.getClasses()) {
        const className = classDecl.getName();
        if (!className) continue;
        
        servicesFound++;
        
        // Test the validator
        const hasDecorator = validator.hasServiceDecorator(classDecl);
        if (hasDecorator) {
          servicesWithValidDecorators++;
          console.log(`  ✅ ${className} -> has valid @Service decorator`);
        } else {
          servicesRejectedByValidator++;
          console.log(`  ❌ ${className} -> rejected by validator`);
        }
      }
    }
    
    console.log("📊 Validator Results:");
    console.log(`  - Total classes found: ${servicesFound}`);
    console.log(`  - Classes with valid decorators: ${servicesWithValidDecorators}`);
    console.log(`  - Classes rejected by validator: ${servicesRejectedByValidator}`);
    
    // This should help us see if the validator is rejecting everything
    expect(servicesWithValidDecorators).toBeGreaterThan(0);
  });

  it("should show the difference between simple and enhanced decorator detection", async () => {
    console.log("🔍 Comparing simple vs enhanced decorator detection...");
    
    const { Project, SyntaxKind } = await import("ts-morph");
    const { EnhancedServiceValidator } = await import("../../../../packages/di-core/tools/interface-resolver/enhanced-service-validator");
    
    const project = new Project({
      useInMemoryFileSystem: false,
      tsConfigFilePath: path.resolve(__dirname, "../../tsconfig.json"),
    });
    
    project.addSourceFilesAtPaths(path.resolve(__dirname, "../**/*.{ts,tsx}"));
    
    const validator = new EnhancedServiceValidator(true);
    
    const testServices = ['TDILoggerService', 'ExampleApiService', 'UserApiServiceImpl', 'TodoService2'];
    
    for (const serviceClassName of testServices) {
      let foundClass: any = null;
      
      // Find the class
      for (const sourceFile of project.getSourceFiles()) {
        for (const classDecl of sourceFile.getClasses()) {
          if (classDecl.getName() === serviceClassName) {
            foundClass = classDecl;
            break;
          }
        }
        if (foundClass) break;
      }
      
      if (!foundClass) {
        console.log(`❌ ${serviceClassName} -> CLASS NOT FOUND`);
        continue;
      }
      
      console.log(`\n🔍 Testing ${serviceClassName}:`);
      
      // Simple detection
      const simpleDetection = foundClass.getDecorators().some((decorator: any) => {
        const text = decorator.getExpression().getText();
        return text === 'Service' || text === 'Service()' || text.includes('Service');
      });
      
      // Enhanced detection
      const enhancedDetection = validator.hasServiceDecorator(foundClass);
      
      console.log(`  Simple detection: ${simpleDetection ? '✅' : '❌'}`);
      console.log(`  Enhanced detection: ${enhancedDetection ? '✅' : '❌'}`);
      
      // Show decorators
      const decorators = foundClass.getDecorators();
      console.log(`  Decorators (${decorators.length}):`);
      for (const decorator of decorators) {
        const text = decorator.getExpression().getText();
        console.log(`    - @${text}`);
      }
      
      if (simpleDetection && !enhancedDetection) {
        console.log(`  🚨 MISMATCH: Simple found it, Enhanced rejected it!`);
      }
    }
  });
});