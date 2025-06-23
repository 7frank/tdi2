// tools/build-time-di-transformer.ts - Simple AST transformer

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

interface FunctionalDependency {
  serviceKey: string;
  token: string;
  isOptional: boolean;
}

interface TransformationOptions {
  srcDir?: string;
  outputDir?: string;
  generateDebugFiles?: boolean;
  verbose?: boolean;
}

export class BuildTimeDITransformer {
  private project: Project;
  private tokenMap: Map<string, string> = new Map();
  private transformedFiles: Map<string, string> = new Map();
  private options: TransformationOptions;
  private transformationCount = 0;

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
      useInMemoryFileSystem: false // Use in-memory for clean transformation
    });

    // Token mappings
    this.tokenMap.set('ExampleApiInterface', 'EXAMPLE_API_TOKEN');
    this.tokenMap.set('LoggerService', 'LOGGER_TOKEN');
  }

  async transformForBuild(): Promise<Map<string, string>> {
    if (this.options.verbose) {
      console.log('🔧 Starting simple AST transformation...');
    }

    // Add source files
    this.project.addSourceFilesAtPaths(`${this.options.srcDir}/**/*.{ts,tsx}`);

    // Transform each file
    for (const sourceFile of this.project.getSourceFiles()) {
      if (this.shouldSkipFile(sourceFile)) continue;

      if (this.transformSourceFile(sourceFile)) {
        // File was transformed, save the result
        this.transformedFiles.set(sourceFile.getFilePath(), sourceFile.getFullText());
      }
    }

    if (this.options.generateDebugFiles) {
      await this.generateDebugFiles();
    }

    if (this.options.verbose) {
      console.log(`✅ Transformed ${this.transformationCount} functions in ${this.transformedFiles.size} files`);
    }

    return this.transformedFiles;
  }

  private shouldSkipFile(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();
    return filePath.includes('generated') || 
           filePath.includes('node_modules') ||
           filePath.includes('.d.ts');
  }

  private transformSourceFile(sourceFile: SourceFile): boolean {
    let hasTransformations = false;

    if (this.options.verbose) {
      console.log(`📂 Processing ${sourceFile.getBaseName()}...`);
    }

    // Transform function declarations
    for (const func of sourceFile.getFunctions()) {
      if (this.transformFunction(func, sourceFile)) {
        hasTransformations = true;
        this.transformationCount++;
        
        if (this.options.verbose) {
          console.log(`✅ Transformed function: ${func.getName()}`);
        }
      }
    }

    // Transform arrow functions in variable declarations
    for (const varStatement of sourceFile.getVariableStatements()) {
      for (const declaration of varStatement.getDeclarations()) {
        const initializer = declaration.getInitializer();
        if (Node.isArrowFunction(initializer)) {
          if (this.transformArrowFunction(declaration, initializer, sourceFile)) {
            hasTransformations = true;
            this.transformationCount++;
            
            if (this.options.verbose) {
              console.log(`✅ Transformed arrow function: ${declaration.getName()}`);
            }
          }
        }
      }
    }

    return hasTransformations;
  }

  private transformFunction(func: FunctionDeclaration, sourceFile: SourceFile): boolean {
    const parameters = func.getParameters();
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const dependencies = this.extractDependenciesFromParameter(firstParam);
    if (dependencies.length === 0) return false;

    // Add DI imports if needed
    this.ensureDIImports(sourceFile);

    // Prepend DI code to function body
    this.prependDICodeToFunction(func, dependencies);

    // Remove services from parameter type
    this.removeServicesFromParameterType(firstParam);

    return true;
  }

  private transformArrowFunction(
    declaration: VariableDeclaration, 
    arrowFunc: ArrowFunction, 
    sourceFile: SourceFile
  ): boolean {
    const parameters = arrowFunc.getParameters();
    if (parameters.length === 0) return false;

    const firstParam = parameters[0];
    const dependencies = this.extractDependenciesFromParameter(firstParam);
    if (dependencies.length === 0) return false;

    // Add DI imports if needed
    this.ensureDIImports(sourceFile);

    // Prepend DI code to arrow function body
    this.prependDICodeToArrowFunction(arrowFunc, dependencies);

    // Remove services from parameter type
    this.removeServicesFromParameterType(firstParam);

    return true;
  }

  private extractDependenciesFromParameter(param: ParameterDeclaration): FunctionalDependency[] {
    const typeNode = param.getTypeNode();
    if (!typeNode || !Node.isTypeLiteral(typeNode)) return [];

    const servicesProperty = typeNode.getMembers().find(member => 
      Node.isPropertySignature(member) && member.getName() === 'services'
    );
    
    if (!servicesProperty || !Node.isPropertySignature(servicesProperty)) return [];

    const serviceTypeNode = servicesProperty.getTypeNode();
    if (!serviceTypeNode || !Node.isTypeLiteral(serviceTypeNode)) return [];

    const dependencies: FunctionalDependency[] = [];

    for (const member of serviceTypeNode.getMembers()) {
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

    return dependencies;
  }

  private parseDependencyType(propName: string, typeNode: TypeNode): FunctionalDependency | null {
    const typeText = typeNode.getText();
    
    const injectMatch = typeText.match(/Inject<([^>]+)>/);
    const optionalMatch = typeText.match(/InjectOptional<([^>]+)>/);
    
    if (injectMatch) {
      const interfaceType = injectMatch[1];
      return {
        serviceKey: propName,
        token: this.resolveInterfaceToToken(interfaceType),
        isOptional: false
      };
    }
    
    if (optionalMatch) {
      const interfaceType = optionalMatch[1];
      return {
        serviceKey: propName,
        token: this.resolveInterfaceToToken(interfaceType),
        isOptional: true
      };
    }

    return null;
  }

  private resolveInterfaceToToken(interfaceType: string): string {
    return this.tokenMap.get(interfaceType) || `${interfaceType.toUpperCase()}_TOKEN`;
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
    }
  }

  private prependDICodeToFunction(func: FunctionDeclaration, dependencies: FunctionalDependency[]): void {
    const body = func.getBody();
    if (!body || !Node.isBlock(body)) return;

    // Generate DI hook calls
    const diStatements: string[] = [];
    
    for (const dep of dependencies) {
      const hookName = dep.isOptional ? 'useOptionalService' : 'useService';
      diStatements.push(`const ${dep.serviceKey} = ${hookName}('${dep.token}');`);
    }

    // Generate services object
    const serviceKeys = dependencies.map(dep => dep.serviceKey).join(', ');
    diStatements.push(`const services = { ${serviceKeys} };`);

    // Insert at the beginning of the function body
    for (let i = diStatements.length - 1; i >= 0; i--) {
      body.insertStatements(0, diStatements[i]);
    }
  }

  private prependDICodeToArrowFunction(arrowFunc: ArrowFunction, dependencies: FunctionalDependency[]): void {
    const body = arrowFunc.getBody();
    if (!Node.isBlock(body)) return;

    // Generate DI hook calls
    const diStatements: string[] = [];
    
    for (const dep of dependencies) {
      const hookName = dep.isOptional ? 'useOptionalService' : 'useService';
      diStatements.push(`const ${dep.serviceKey} = ${hookName}('${dep.token}');`);
    }

    // Generate services object
    const serviceKeys = dependencies.map(dep => dep.serviceKey).join(', ');
    diStatements.push(`const services = { ${serviceKeys} };`);

    // Insert at the beginning of the function body
    for (let i = diStatements.length - 1; i >= 0; i--) {
      body.insertStatements(0, diStatements[i]);
    }
  }

  private removeServicesFromParameterType(param: ParameterDeclaration): void {
    const typeNode = param.getTypeNode();
    if (!typeNode || !Node.isTypeLiteral(typeNode)) return;

    // Find and remove the services property
    const members = typeNode.getMembers();
    for (const member of members) {
      if (Node.isPropertySignature(member) && member.getName() === 'services') {
        member.remove();
        break;
      }
    }
  }

  private async generateDebugFiles(): Promise<void> {
    if (!this.options.generateDebugFiles) return;

    for (const [originalPath, transformedContent] of this.transformedFiles) {
      try {
        const relativePath = path.relative(process.cwd(), originalPath);
        const debugPath = relativePath.replace(/\.(ts|tsx)$/, '.di-transformed.$1');
        
        const debugDir = path.dirname(debugPath);
        if (!fs.existsSync(debugDir)) {
          await fs.promises.mkdir(debugDir, { recursive: true });
        }
        
        await fs.promises.writeFile(debugPath, transformedContent, 'utf8');
        
        if (this.options.verbose) {
          console.log(`📝 Generated debug file: ${debugPath}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to write debug file for ${originalPath}:`, error);
      }
    }
  }

  getTransformationSummary(): { 
    count: number; 
    functions: string[]; 
    transformedFiles: string[] 
  } {
    return {
      count: this.transformationCount,
      functions: [], // Could track function names if needed
      transformedFiles: Array.from(this.transformedFiles.keys())
    };
  }
}