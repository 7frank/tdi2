// tools/safer-functional-transformer.ts - Safer step-by-step transformation

import { 
  Project, 
  SourceFile, 
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  Node,
  TypeNode
} from 'ts-morph';

interface FunctionalDIInfo {
  functionName: string;
  filePath: string;
  dependencies: FunctionalDependency[];
  isComponent: boolean;
  originalFunction: string;
  node: FunctionDeclaration | VariableDeclaration;
}

interface FunctionalDependency {
  serviceKey: string;
  token: string;
  isOptional: boolean;
  type: string;
}

export class SaferFunctionalDITransformer {
  private project: Project;
  private functionalServices: Map<string, FunctionalDIInfo> = new Map();
  private tokenMap: Map<string, string> = new Map();

  constructor(project: Project) {
    this.project = project;
    // Pre-populate known tokens
    this.tokenMap.set('ExampleApiInterface', 'EXAMPLE_API_TOKEN');
    this.tokenMap.set('LoggerService', 'LOGGER_TOKEN');
  }

  async transformFunctionalDI(): Promise<void> {
    console.log('🔍 Starting safer functional DI transformation...');
    
    // Find functional components with DI
    await this.findFunctionalComponents();
    
    // Transform each one safely
    for (const [key, diInfo] of this.functionalServices) {
      console.log(`🔄 Processing ${diInfo.functionName}...`);
      await this.safelyTransformComponent(diInfo);
    }
  }

  private async findFunctionalComponents(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      // Skip generated files and node_modules
      if (sourceFile.getFilePath().includes('generated') || 
          sourceFile.getFilePath().includes('node_modules')) {
        continue;
      }

      console.log(`📂 Scanning ${sourceFile.getBaseName()}...`);

      // Check function declarations
      const functions = sourceFile.getFunctions();
      for (const func of functions) {
        const diInfo = this.extractFunctionalDI(func, sourceFile);
        if (diInfo) {
          this.functionalServices.set(`${sourceFile.getBaseName()}_${func.getName()}`, diInfo);
          console.log(`✅ Found function: ${func.getName()} with DI dependencies`);
        }
      }
      
      // Check variable declarations with arrow functions
      const variableStatements = sourceFile.getVariableStatements();
      for (const varStatement of variableStatements) {
        const declarations = varStatement.getDeclarations();
        for (const declaration of declarations) {
          const initializer = declaration.getInitializer();
          if (Node.isArrowFunction(initializer)) {
            const diInfo = this.extractFunctionalDIFromArrow(declaration, initializer, sourceFile);
            if (diInfo) {
              this.functionalServices.set(`${sourceFile.getBaseName()}_${declaration.getName()}`, diInfo);
              console.log(`✅ Found arrow function: ${declaration.getName()} with DI dependencies`);
            }
          }
        }
      }
    }
  }

  private extractFunctionalDI(func: FunctionDeclaration, sourceFile: SourceFile): FunctionalDIInfo | null {
    const funcName = func.getName();
    if (!funcName) return null;

    const parameters = func.getParameters();
    if (parameters.length === 0) return null;

    // Look for a parameter with services that has Inject markers
    for (const param of parameters) {
      const dependencies = this.extractDependenciesFromParameter(param);
      if (dependencies.length > 0) {
        console.log(`📋 Dependencies found in ${funcName}:`, dependencies.map(d => d.serviceKey));
        
        return {
          functionName: funcName,
          filePath: sourceFile.getFilePath(),
          dependencies,
          isComponent: true,
          originalFunction: func.getFullText(),
          node: func
        };
      }
    }

    return null;
  }

  private extractFunctionalDIFromArrow(
    declaration: VariableDeclaration, 
    arrowFunc: ArrowFunction, 
    sourceFile: SourceFile
  ): FunctionalDIInfo | null {
    const funcName = declaration.getName();
    const parameters = arrowFunc.getParameters();
    
    if (parameters.length === 0) return null;

    for (const param of parameters) {
      const dependencies = this.extractDependenciesFromParameter(param);
      if (dependencies.length > 0) {
        console.log(`📋 Dependencies found in ${funcName}:`, dependencies.map(d => d.serviceKey));

        return {
          functionName: funcName,
          filePath: sourceFile.getFilePath(),
          dependencies,
          isComponent: true,
          originalFunction: declaration.getFullText(),
          node: declaration
        };
      }
    }

    return null;
  }

  private extractDependenciesFromParameter(param: ParameterDeclaration): FunctionalDependency[] {
    const dependencies: FunctionalDependency[] = [];
    const typeNode = param.getTypeNode();
    
    if (!typeNode) return dependencies;

    // Check if this parameter has a services property with Inject types
    if (Node.isTypeLiteral(typeNode)) {
      const servicesProperty = typeNode.getMembers().find(member => 
        Node.isPropertySignature(member) && member.getName() === 'services'
      );
      
      if (servicesProperty && Node.isPropertySignature(servicesProperty)) {
        const serviceTypeNode = servicesProperty.getTypeNode();
        if (serviceTypeNode) {
          return this.extractInjectDependencies(serviceTypeNode);
        }
      }
    }

    return dependencies;
  }

  private extractInjectDependencies(typeNode: TypeNode): FunctionalDependency[] {
    const dependencies: FunctionalDependency[] = [];

    if (Node.isTypeLiteral(typeNode)) {
      const members = typeNode.getMembers();
      
      for (const member of members) {
        if (Node.isPropertySignature(member)) {
          const propName = member.getName();
          const propTypeNode = member.getTypeNode();
          
          if (propTypeNode) {
            const dependency = this.parseDependencyType(propName, propTypeNode);
            if (dependency) {
              dependencies.push(dependency);
            }
          }
        }
      }
    }

    return dependencies;
  }

  private parseDependencyType(propName: string, typeNode: TypeNode): FunctionalDependency | null {
    const typeText = typeNode.getText();
    
    // Match Inject<SomeInterface> or InjectOptional<SomeInterface>
    const injectMatch = typeText.match(/Inject<([^>]+)>/);
    const optionalMatch = typeText.match(/InjectOptional<([^>]+)>/);
    
    if (injectMatch) {
      const interfaceType = injectMatch[1];
      const token = this.resolveInterfaceToToken(interfaceType);
      
      return {
        serviceKey: propName,
        token,
        isOptional: false,
        type: interfaceType
      };
    }
    
    if (optionalMatch) {
      const interfaceType = optionalMatch[1];
      const token = this.resolveInterfaceToToken(interfaceType);
      
      return {
        serviceKey: propName,
        token,
        isOptional: true,
        type: interfaceType
      };
    }

    return null;
  }

  private resolveInterfaceToToken(interfaceType: string): string {
    const mappings: Record<string, string> = {
      'ExampleApiInterface': 'EXAMPLE_API_TOKEN',
      'LoggerService': 'LOGGER_TOKEN',
      'LoggerInterface': 'LOGGER_TOKEN'
    };
    
    return mappings[interfaceType] || interfaceType;
  }

  private async safelyTransformComponent(diInfo: FunctionalDIInfo): Promise<void> {
    const sourceFile = this.project.getSourceFile(diInfo.filePath);
    if (!sourceFile) return;

    console.log(`🔧 Transforming ${diInfo.functionName} with dependencies: ${diInfo.dependencies.map(d => d.serviceKey).join(', ')}`);

    // Add DI imports
    this.ensureDIImports(sourceFile);

    // Generate the transformed function as a new function alongside the original
    const transformedCode = this.generateTransformedFunction(diInfo);
    
    // Add the transformed function at the end of the file
    sourceFile.addStatements(transformedCode);
    
    console.log(`✅ Added transformed version of ${diInfo.functionName}`);
  }

  private ensureDIImports(sourceFile: SourceFile): void {
    const existingImports = sourceFile.getImportDeclarations();
    const hasDIImport = existingImports.some(imp => 
      imp.getModuleSpecifierValue().includes('di/context')
    );

    if (!hasDIImport) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: '../di/context',
        namedImports: ['useService', 'useOptionalService']
      });
      console.log('📦 Added DI imports');
    }
  }

  private generateTransformedFunction(diInfo: FunctionalDIInfo): string {
    // Generate DI hook calls
    const hookCalls = diInfo.dependencies.map(dep => {
      if (dep.isOptional) {
        return `  const ${dep.serviceKey} = useOptionalService('${dep.token}');`;
      } else {
        return `  const ${dep.serviceKey} = useService('${dep.token}');`;
      }
    }).join('\n');

    // Generate services object
    const servicesObj = `  const services = {\n    ${diInfo.dependencies.map(dep => dep.serviceKey).join(',\n    ')}\n  };`;

    // Create a simple transformed version
    const transformedFunctionName = `${diInfo.functionName}Transformed`;

    if (Node.isFunctionDeclaration(diInfo.node)) {
      return `
// Auto-generated transformed version of ${diInfo.functionName}
function ${transformedFunctionName}(props: { [key: string]: any }): JSX.Element {
${hookCalls}

${servicesObj}

  // Call original function with injected services
  return ${diInfo.functionName}({ ...props, services });
}`;
    } else {
      return `
// Auto-generated transformed version of ${diInfo.functionName}
const ${transformedFunctionName} = (props: { [key: string]: any }) => {
${hookCalls}

${servicesObj}

  // Call original function with injected services
  return ${diInfo.functionName}({ ...props, services });
};`;
    }
  }

  getTransformationSummary(): { count: number; functions: string[] } {
    return {
      count: this.functionalServices.size,
      functions: Array.from(this.functionalServices.keys())
    };
  }
}