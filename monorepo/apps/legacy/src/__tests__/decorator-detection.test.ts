// apps/legacy/src/__tests__/decorator-detection.test.ts
import { describe, it, expect } from "bun:test";
import { Project, SyntaxKind } from "ts-morph";
import path from "path";

describe("Decorator Detection - Baseline Test", () => {
  it("should detect @Service decorators in actual source files", () => {
    const project = new Project({
      useInMemoryFileSystem: false,
      tsConfigFilePath: path.resolve(__dirname, "../../tsconfig.json"),
    });

    // Add the actual source files
    project.addSourceFilesAtPaths(path.resolve(__dirname, "../**/*.{ts,tsx}"));
    
    const sourceFiles = project.getSourceFiles();
    const servicesFound: Array<{ className: string, fileName: string, hasDecorator: boolean }> = [];
    
    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();
      
      for (const classDecl of classes) {
        const className = classDecl.getName();
        if (!className) continue;
        
        // Expected services that should have @Service decorator
        const expectedServices = [
          'TDILoggerService',
          'ConsoleLoggerService', 
          'ExampleApiService',
          'ConsoleLogger',
          'MemoryCache',
          'UserApiServiceImpl',
          'MockUserApiService',
          'AppStateService',
          'NotificationService',
          'TodoRepository',
          'TodoService2'
        ];
        
        if (expectedServices.includes(className)) {
          // Get all decorators and log them for debugging
          const decorators = classDecl.getDecorators();
          console.log(`🔍 ${className} has ${decorators.length} decorators:`);
          
          let hasServiceDecorator = false;
          
          for (const decorator of decorators) {
            try {
              const expression = decorator.getExpression();
              let decoratorName = '';
              
              // Handle different AST node types using SyntaxKind constants
              if (expression.getKind() === SyntaxKind.CallExpression) { // @Service()
                const expr = (expression as any).getExpression();
                if (expr.getKind() === SyntaxKind.Identifier) {
                  decoratorName = expr.getText();
                }
              } else if (expression.getKind() === SyntaxKind.Identifier) { // @Service
                decoratorName = expression.getText();
              } else if (expression.getKind() === SyntaxKind.PropertyAccessExpression) { // @DI.Service
                decoratorName = expression.getText();
              } else {
                // Try to get text directly for other cases
                decoratorName = expression.getText();
              }
              
              console.log(`  - @${decoratorName} (kind: ${SyntaxKind[expression.getKind()]}, text: "${expression.getText()}")`);
              
              if (decoratorName === 'Service' || 
                  decoratorName.includes('Service')) {
                hasServiceDecorator = true;
              }
            } catch (error) {
              console.log(`  - Error reading decorator: ${error}`);
            }
          }
          
          servicesFound.push({
            className,
            fileName: sourceFile.getBaseName(),
            hasDecorator: hasServiceDecorator
          });
        }
      }
    }
    
    console.log('🔍 Services found in source code:');
    servicesFound.forEach(service => {
      console.log(`  ${service.hasDecorator ? '✅' : '❌'} ${service.className} in ${service.fileName}`);
    });
    
    // Should find the key services
    expect(servicesFound.length).toBeGreaterThan(5);
    
    // All found services should have decorators
    const servicesWithDecorators = servicesFound.filter(s => s.hasDecorator);
    expect(servicesWithDecorators.length).toBeGreaterThan(5);
    
    // Specifically check for TDILoggerService
    const tdiLogger = servicesFound.find(s => s.className === 'TDILoggerService');
    expect(tdiLogger).toBeDefined();
    expect(tdiLogger?.hasDecorator).toBe(true);
    
    // Specifically check for ExampleApiService  
    const exampleApi = servicesFound.find(s => s.className === 'ExampleApiService');
    expect(exampleApi).toBeDefined();
    expect(exampleApi?.hasDecorator).toBe(true);
  });

  it("should detect @Inject decorators in constructor parameters", () => {
    const project = new Project({
      useInMemoryFileSystem: false,
      tsConfigFilePath: path.resolve(__dirname, "../../tsconfig.json"),
    });

    project.addSourceFilesAtPaths(path.resolve(__dirname, "../**/*.{ts,tsx}"));
    
    const sourceFiles = project.getSourceFiles();
    const injectionsFound: Array<{ className: string, paramName: string, hasInject: boolean }> = [];
    
    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();
      
      for (const classDecl of classes) {
        const className = classDecl.getName();
        if (!className) continue;
        
        const constructors = classDecl.getConstructors();
        if (constructors.length === 0) continue;
        
        const constructor = constructors[0];
        const parameters = constructor.getParameters();
        
        for (const param of parameters) {
          const paramName = param.getName();
          const decorators = param.getDecorators();
          
          // Check common parameter names that should have @Inject
          const commonInjectParams = ['logger', 'cache', 'todoRepository', 'notificationService'];
          
          if (decorators.length > 0 || commonInjectParams.includes(paramName)) {
            console.log(`🔍 ${className}.${paramName} has ${decorators.length} decorators:`);
            
            let hasInjectDecorator = false;
            
            for (const decorator of decorators) {
              try {
                const expression = decorator.getExpression();
                let decoratorName = '';
                
                // Handle different AST node types using SyntaxKind constants
                if (expression.getKind() === SyntaxKind.CallExpression) { // @Inject()
                  const expr = (expression as any).getExpression();
                  if (expr.getKind() === SyntaxKind.Identifier) {
                    decoratorName = expr.getText();
                  }
                } else if (expression.getKind() === SyntaxKind.Identifier) { // @Inject
                  decoratorName = expression.getText();
                } else if (expression.getKind() === SyntaxKind.PropertyAccessExpression) { // @DI.Inject
                  decoratorName = expression.getText();
                } else {
                  // Try to get text directly for other cases
                  decoratorName = expression.getText();
                }
                
                console.log(`    - @${decoratorName} (kind: ${SyntaxKind[expression.getKind()]}, text: "${expression.getText()}")`);
                
                if (decoratorName === 'Inject' || decoratorName.includes('Inject')) {
                  hasInjectDecorator = true;
                }
              } catch (error) {
                console.log(`    - Error reading decorator: ${error}`);
              }
            }
            
            injectionsFound.push({
              className,
              paramName,
              hasInject: hasInjectDecorator
            });
          }
        }
      }
    }
    
    console.log('🔍 Injections found in constructors:');
    injectionsFound.forEach(injection => {
      console.log(`  ${injection.hasInject ? '✅' : '❌'} ${injection.className}.${injection.paramName}`);
    });
    
    // Should find some injections
    expect(injectionsFound.length).toBeGreaterThan(0);
    
    // Should find injections with decorators
    const injectionsWithDecorators = injectionsFound.filter(i => i.hasInject);
    expect(injectionsWithDecorators.length).toBeGreaterThan(0);
  });
});