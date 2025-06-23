// tools/build-time-di-transformer.ts - Build-time transformation without modifying source

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
import * as path from 'path';
import * as fs from 'fs';

interface FunctionalDIInfo {
  functionName: string;
  filePath: string;
  dependencies: FunctionalDependency[];
  isComponent: boolean;
  originalFunction: string;
  node: FunctionDeclaration | VariableDeclaration;
  sourceFile: SourceFile;
}

interface FunctionalDependency {
  serviceKey: string;
  token: string;
  isOptional: boolean;
  type: string;
}

interface TransformationOptions {
  srcDir?: string;
  outputDir?: string;
  generateDebugFiles?: boolean;
  verbose?: boolean;
}

export class BuildTimeDITransformer {
  private project: Project;
  private functionalServices: Map<string, FunctionalDIInfo> = new Map();
  private tokenMap: Map<string, string> = new Map();
  private transformedFiles: Map<string, string> = new Map(); // Original path -> Transformed content
  private options: TransformationOptions;

  constructor(options: TransformationOptions = {}) {
    this.options = {
      srcDir: './src',
      outputDir: './src/generated',
      generateDebugFiles: false,
      verbose: false,
      ...options
    };

    this.project = new Project({
      tsConfigFilePath: './tsconfig.json',
      useInMemoryFileSystem: true // Don't modify actual files
    });

    // Pre-populate known tokens
    this.tokenMap.set('ExampleApiInterface', 'EXAMPLE_API_TOKEN');
    this.tokenMap.set('LoggerService', 'LOGGER_TOKEN');
  }

  async transformForBuild(): Promise<Map<string, string>> {
    if (this.options.verbose) {
      console.log('🔧 Starting build-time DI transformation...');
    }

    // Add source files to in-memory project
    this.project.addSourceFilesAtPaths(`${this.options.srcDir}/**/*.{ts,tsx}`);

    // Find functional components with DI
    await this.findFunctionalComponents();

    // Transform each file that contains DI components
    await this.transformFiles();

    if (this.options.generateDebugFiles) {
      await this.generateDebugFiles();
    }

    if (this.options.verbose) {
      console.log(`✅ Transformed ${this.transformedFiles.size} files for build`);
    }

    return this.transformedFiles;
  }

  private async findFunctionalComponents(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      // Skip generated files and node_modules
      if (sourceFile.getFilePath().includes('generated') || 
          sourceFile.getFilePath().includes('node_modules')) {
        continue;
      }

      if (this.options.verbose) {
        console.log(`📂 Scanning ${sourceFile.getBaseName()}...`);
      }

      let hasTransformations = false;

      // Check function declarations
      const functions = sourceFile.getFunctions();
      for (const func of functions) {
        const diInfo = this.extractFunctionalDI(func, sourceFile);
        if (diInfo) {
          this.functionalServices.set(`${sourceFile.getFilePath()}_${func.getName()}`, diInfo);
          hasTransformations = true;
          if (this.options.verbose) {
            console.log(`✅ Found function: ${func.getName()} with DI dependencies`);
          }
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
              this.functionalServices.set(`${sourceFile.getFilePath()}_${declaration.getName()}`, diInfo);
              hasTransformations = true;
              if (this.options.verbose) {
                console.log(`✅ Found arrow function: ${declaration.getName()} with DI dependencies`);
              }
            }
          }
        }
      }

      // Mark file for transformation if it has DI components
      if (hasTransformations) {
        this.transformedFiles.set(sourceFile.getFilePath(), ''); // Will be filled during transformation
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
        return {
          functionName: funcName,
          filePath: sourceFile.getFilePath(),
          dependencies,
          isComponent: true,
          originalFunction: func.getFullText(),
          node: func,
          sourceFile
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
        return {
          functionName: funcName,
          filePath: sourceFile.getFilePath(),
          dependencies,
          isComponent: true,
          originalFunction: declaration.getFullText(),
          node: declaration,
          sourceFile
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

  private async transformFiles(): Promise<void> {
    for (const [filePath] of this.transformedFiles) {
      const sourceFile = this.project.getSourceFile(filePath);
      if (!sourceFile) continue;

      if (this.options.verbose) {
        console.log(`🔄 Transforming ${sourceFile.getBaseName()}...`);
      }

      // Create a copy of the source file for transformation
      const transformedContent = this.transformSourceFile(sourceFile);
      this.transformedFiles.set(filePath, transformedContent);
    }
  }

  private transformSourceFile(sourceFile: SourceFile): string {
    // Start with the original content
    let content = sourceFile.getFullText();

    // Add DI imports if needed
    const needsDIImports = Array.from(this.functionalServices.values())
      .some(info => info.sourceFile === sourceFile);

    if (needsDIImports) {
      // Add DI imports at the top (after existing imports)
      const importIndex = content.lastIndexOf('import');
      if (importIndex !== -1) {
        const endOfLastImport = content.indexOf('\n', importIndex);
        const diImports = `import { useService, useOptionalService } from '../di/context';\n`;
        content = content.slice(0, endOfLastImport + 1) + diImports + content.slice(endOfLastImport + 1);
      }
    }

    // Transform each function in this file
    const fileServices = Array.from(this.functionalServices.values())
      .filter(info => info.sourceFile === sourceFile);

    for (const diInfo of fileServices) {
      content = this.transformFunctionInContent(content, diInfo);
    }

    return content;
  }

  private transformFunctionInContent(content: string, diInfo: FunctionalDIInfo): string {
    // Generate the transformed function
    const transformedFunction = this.generateTransformedFunction(diInfo);

    // Replace the original function with the transformed version
    // This is a simple string replacement - in production you'd want more sophisticated AST manipulation
    const originalFunctionText = diInfo.originalFunction;
    
    // Find and replace the original function
    const functionIndex = content.indexOf(originalFunctionText);
    if (functionIndex !== -1) {
      const before = content.slice(0, functionIndex);
      const after = content.slice(functionIndex + originalFunctionText.length);
      content = before + transformedFunction + after;
    }

    return content;
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

    // Extract props type without services
    const propsType = this.extractPropsTypeWithoutServices(diInfo);

    if (Node.isFunctionDeclaration(diInfo.node)) {
      return `// Auto-transformed: DI hooks injected at build time
function ${diInfo.functionName}(props: ${propsType}): JSX.Element {
${hookCalls}

${servicesObj}

  // Original function logic with injected services
  const { ${this.extractDestructuredProps(diInfo)} } = props;
  
${this.extractFunctionBody(diInfo)}
}`;
    } else {
      return `// Auto-transformed: DI hooks injected at build time
const ${diInfo.functionName} = (props: ${propsType}) => {
${hookCalls}

${servicesObj}

  // Original function logic with injected services
  const { ${this.extractDestructuredProps(diInfo)} } = props;
  
${this.extractFunctionBody(diInfo)}
};`;
    }
  }

  private extractPropsTypeWithoutServices(diInfo: FunctionalDIInfo): string {
    // Simple extraction - in production you'd parse the AST more carefully
    const originalText = diInfo.originalFunction;
    const propsMatch = originalText.match(/props:\s*\{\s*([^}]+)\s*\}/);
    
    if (propsMatch) {
      const propsContent = propsMatch[1];
      // Remove services property
      const propsWithoutServices = propsContent
        .split(/[,;]/)
        .filter(prop => !prop.trim().startsWith('services'))
        .join(',');
      
      return `{ ${propsWithoutServices} }`;
    }
    
    return '{ [key: string]: any }';
  }

  private extractDestructuredProps(diInfo: FunctionalDIInfo): string {
    // Extract destructured props from original function
    const originalText = diInfo.originalFunction;
    const destructureMatch = originalText.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*props/);
    
    if (destructureMatch) {
      const destructured = destructureMatch[1];
      // Remove services from destructuring
      return destructured
        .split(',')
        .filter(prop => !prop.trim().startsWith('services'))
        .join(', ');
    }
    
    // Fallback: extract from props type
    return this.extractPropsTypeWithoutServices(diInfo).replace(/[{}]/g, '').replace(/:/g, '');
  }

  private extractFunctionBody(diInfo: FunctionalDIInfo): string {
    // Extract the function body, removing the services destructuring
    const originalText = diInfo.originalFunction;
    
    if (Node.isFunctionDeclaration(diInfo.node)) {
      const bodyMatch = originalText.match(/\{([\s\S]*)\}$/);
      if (bodyMatch) {
        let body = bodyMatch[1];
        // Remove services destructuring line
        body = body.replace(/const\s*\{\s*[^}]*services[^}]*\}\s*=\s*props;\s*\n?/, '');
        return body;
      }
    } else {
      // Arrow function
      const arrowMatch = originalText.match(/=>\s*\{([\s\S]*)\}[;]?$/);
      if (arrowMatch) {
        let body = arrowMatch[1];
        body = body.replace(/const\s*\{\s*[^}]*services[^}]*\}\s*=\s*props;\s*\n?/, '');
        return body;
      }
    }
    
    return '  return <div>Transformation error</div>;';
  }

  private async generateDebugFiles(): Promise<void> {
    if (!this.options.generateDebugFiles) return;

    for (const [originalPath, transformedContent] of this.transformedFiles) {
      const debugPath = originalPath.replace(/\.(ts|tsx)$/, '.di-transformed.$1');
      
      try {
        await fs.promises.writeFile(debugPath, transformedContent, 'utf8');
        if (this.options.verbose) {
          console.log(`📝 Generated debug file: ${debugPath}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to write debug file ${debugPath}:`, error);
      }
    }
  }

  getTransformationSummary(): { 
    count: number; 
    functions: string[]; 
    transformedFiles: string[] 
  } {
    return {
      count: this.functionalServices.size,
      functions: Array.from(this.functionalServices.keys()),
      transformedFiles: Array.from(this.transformedFiles.keys())
    };
  }
}