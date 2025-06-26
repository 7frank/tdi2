// comprehensive-debug.ts - Deep debug of the interface resolution

import { Project, SyntaxKind, Node } from 'ts-morph';

async function comprehensiveDebug() {
  console.log('🔍 Comprehensive Debug of Interface Resolution...');
  
  const project = new Project({ tsConfigFilePath: './tsconfig.json' });
  project.addSourceFilesAtPaths('./src/**/*.{ts,tsx}');
  
  console.log('\n📁 All TypeScript files found:');
  const allFiles = project.getSourceFiles();
  for (const file of allFiles) {
    if (!file.getFilePath().includes('node_modules') && !file.getFilePath().includes('.d.ts')) {
      console.log(`  ${file.getBaseName()}`);
    }
  }
  
  console.log('\n🔍 Detailed Service Analysis:');
  
  for (const sourceFile of allFiles) {
    if (sourceFile.getFilePath().includes('node_modules') || sourceFile.getFilePath().includes('.d.ts')) {
      continue;
    }
    
    const classes = sourceFile.getClasses();
    if (classes.length === 0) continue;
    
    console.log(`\n📄 File: ${sourceFile.getBaseName()}`);
    
    for (const classDecl of classes) {
      const className = classDecl.getName() || 'unnamed';
      console.log(`\n  🏷️  Class: ${className}`);
      
      // 1. Check decorators in detail
      const decorators = classDecl.getDecorators();
      console.log(`    Decorators (${decorators.length}):`);
      
      let hasServiceDecorator = false;
      for (const decorator of decorators) {
        const decoratorText = decorator.getText();
        console.log(`      Text: "${decoratorText}"`);
        
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const expressionText = expression.getExpression().getText();
          console.log(`      Call Expression: "${expressionText}"`);
          hasServiceDecorator = hasServiceDecorator || 
            (expressionText === 'Service' || 
             expressionText === 'AutoWireService' ||
             expressionText.includes('Service'));
        } else if (Node.isIdentifier(expression)) {
          const expressionText = expression.getText();
          console.log(`      Identifier: "${expressionText}"`);
          hasServiceDecorator = hasServiceDecorator || 
            (expressionText === 'Service' || 
             expressionText === 'AutoWireService' ||
             expressionText.includes('Service'));
        }
      }
      
      console.log(`    Has Service Decorator: ${hasServiceDecorator}`);
      
      // 2. Check heritage clauses in detail
      const heritageClauses = classDecl.getHeritageClauses();
      console.log(`    Heritage clauses (${heritageClauses.length}):`);
      
      let implementedInterfaces: string[] = [];
      for (const heritage of heritageClauses) {
        const token = heritage.getToken();
        const tokenName = SyntaxKind[token];
        const heritageText = heritage.getText();
        
        console.log(`      Token: ${token} (${tokenName})`);
        console.log(`      Full text: "${heritageText}"`);
        
        // Multiple ways to check for implements
        const isImplementsClause = 
          token === SyntaxKind.ImplementsKeyword || 
          heritageText.includes('implements')
        
        console.log(`      Is Implements Clause: ${isImplementsClause}`);
        
        if (isImplementsClause) {
          const typeNodes = heritage.getTypeNodes();
          console.log(`      Type nodes (${typeNodes.length}):`);
          
          for (const typeNode of typeNodes) {
            const typeName = typeNode.getText();
            console.log(`        Type: "${typeName}"`);
            implementedInterfaces.push(typeName);
          }
        }
      }
      
      console.log(`    Implemented Interfaces: [${implementedInterfaces.join(', ')}]`);
      
      // 3. Check if this would be detected by our logic
      if (hasServiceDecorator && implementedInterfaces.length > 0) {
        console.log(`    ✅ SHOULD BE DETECTED as interface implementation`);
        for (const interfaceName of implementedInterfaces) {
          const sanitizedKey = interfaceName.replace(/[^\w\s]/gi, '_');
          console.log(`      ${interfaceName} -> ${className} (key: ${sanitizedKey})`);
        }
      } else {
        console.log(`    ❌ Will NOT be detected:`);
        if (!hasServiceDecorator) console.log(`      - Missing service decorator`);
        if (implementedInterfaces.length === 0) console.log(`      - No implemented interfaces`);
      }
      
      // 4. Check constructor for dependencies
      const constructors = classDecl.getConstructors();
      if (constructors.length > 0) {
        const constructor = constructors[0];
        const params = constructor.getParameters();
        console.log(`    Constructor parameters (${params.length}):`);
        
        for (const param of params) {
          const paramName = param.getName();
          const paramType = param.getTypeNode()?.getText() || 'unknown';
          const decorators = param.getDecorators();
          
          let hasInjectDecorator = false;
          for (const decorator of decorators) {
            const expression = decorator.getExpression();
            if (Node.isCallExpression(expression)) {
              const expressionText = expression.getExpression().getText();
              hasInjectDecorator = hasInjectDecorator ||
                (expressionText === 'Inject' || 
                 expressionText === 'AutoWireInject' ||
                 expressionText === 'Autowired' ||
                 expressionText.includes('Inject'));
            } else if (Node.isIdentifier(expression)) {
              const expressionText = expression.getText();
              hasInjectDecorator = hasInjectDecorator ||
                (expressionText === 'Inject' || 
                 expressionText === 'AutoWireInject' ||
                 expressionText === 'Autowired' ||
                 expressionText.includes('Inject'));
            }
          }
          
          console.log(`      ${paramName}: ${paramType} [${decorators.map(d => d.getText()).join(', ')}] hasInject: ${hasInjectDecorator}`);
        }
      }
    }
  }
  
  console.log('\n🧪 Manual Interface Resolution Test:');
  
  // Let's manually test the exact logic from InterfaceResolver
  const manualInterfaces = new Map();
  const manualDependencies = new Map();
  
  for (const sourceFile of allFiles) {
    if (sourceFile.getFilePath().includes('node_modules') || sourceFile.getFilePath().includes('.d.ts')) {
      continue;
    }
    
    const classes = sourceFile.getClasses();
    for (const classDecl of classes) {
      const className = classDecl.getName();
      if (!className) continue;
      
      // Test service detection
      const hasServiceDecorator = classDecl.getDecorators().some(decorator => {
        const expression = decorator.getExpression();
        if (Node.isCallExpression(expression)) {
          const expressionText = expression.getExpression().getText();
          return expressionText === 'Service' || 
                 expressionText === 'AutoWireService' ||
                 expressionText.includes('Service');
        } else if (Node.isIdentifier(expression)) {
          const expressionText = expression.getText();
          return expressionText === 'Service' || 
                 expressionText === 'AutoWireService' ||
                 expressionText.includes('Service');
        }
        return false;
      });
      
      if (!hasServiceDecorator) continue;
      
      // Test interface detection
      const heritageClauses = classDecl.getHeritageClauses();
      for (const heritage of heritageClauses) {
        const token = heritage.getToken();
        const isImplementsClause = token === SyntaxKind.ImplementsKeyword || heritage.getText().startsWith('implements');
        
        if (isImplementsClause) {
          for (const type of heritage.getTypeNodes()) {
            const fullType = type.getText();
            const sanitizedKey = fullType.replace(/[^\w\s]/gi, '_');
            
            console.log(`✅ Found: ${fullType} -> ${className} (key: ${sanitizedKey})`);
            manualInterfaces.set(sanitizedKey, { interfaceName: fullType, implementationClass: className });
          }
        }
      }
    }
  }
  
  console.log(`\n📊 Manual Results: Found ${manualInterfaces.size} interface implementations`);
  for (const [key, impl] of manualInterfaces) {
    console.log(`  ${key}: ${impl.interfaceName} -> ${impl.implementationClass}`);
  }
}

comprehensiveDebug().catch(console.error);