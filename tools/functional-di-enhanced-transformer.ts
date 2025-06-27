// tools/functional-di-enhanced-transformer.ts - FINAL FIX for interface reference support

import { 
  Project, 
  SourceFile, 
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  Node,
  TypeNode,
  InterfaceDeclaration,
  TypeAliasDeclaration
} from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigManager } from './config-manager';
import { InterfaceResolver, type InterfaceImplementation } from "./interface-resolver/interface-resolver";

interface FunctionalDependency {
  serviceKey: string;
  interfaceType: string;
  sanitizedKey: string;
  isOptional: boolean;
  resolvedImplementation?: InterfaceImplementation;
}

interface TransformationOptions {
  srcDir?: string;
  outputDir?: string;
  generateDebugFiles?: boolean;
  verbose?: boolean;
  customSuffix?: string;
}

export class FunctionalDIEnhancedTransformer {
  private project: Project;
  private interfaceResolver: InterfaceResolver;
  private transformedFiles: Map<string, string> = new Map();
  private options: TransformationOptions;
  private transformationCount = 0;
  private configManager: ConfigManager;

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
      useInMemoryFileSystem: false
    });

    // Initialize ConfigManager
    this.configManager = new ConfigManager({
      srcDir: this.options.srcDir!,
      outputDir: this.options.outputDir!,
      enableFunctionalDI: true,
      verbose: this.options.verbose!,
      customSuffix: this.options.customSuffix
    });

    // Initialize InterfaceResolver
    this.interfaceResolver = new InterfaceResolver({
      verbose: this.options.verbose,
      srcDir: this.options.srcDir
    });
  }

  async transformForBuild(): Promise<Map<string, string>> {
    if (this.options.verbose) {
      console.log('🎯 Starting interface-based functional DI transformation...');
    }

    // First, scan for interface implementations
    await this.interfaceResolver.scanProject();

    // Validate dependencies
    const validation = this.interfaceResolver.validateDependencies();
    if (!validation.isValid) {
      console.warn('⚠️  Some dependencies may not be resolvable:');
      if (validation.missingImplementations.length > 0) {
        console.warn('Missing implementations:', validation.missingImplementations);
      }
      // Continue with transformation even if some dependencies are missing
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
      console.log(`🏗️  Config directory: ${this.configManager.getConfigDir()}`);
      
      // Show resolved interfaces
      const implementations = this.interfaceResolver.getInterfaceImplementations();
      if (implementations.size > 0) {
        console.log('\n📋 Available Interface Implementations:');
        for (const [key, impl] of implementations) {
          console.log(`  ${impl.interfaceName} -> ${impl.implementationClass}`);
        }
      }
    }

    return this.transformedFiles;
  }

  private shouldSkipFile(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();
    return filePath.includes('generated') || 
           filePath.includes('node_modules') ||
           filePath.includes('.d.ts') ||
           filePath.includes('.tdi2');
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
    const dependencies = this.extractDependenciesFromParameter(firstParam, sourceFile);
    if (dependencies.length === 0) return false;

    // Resolve implementations for dependencies
    const resolvedDependencies = this.resolveDependencies(dependencies, func.getName() || 'anonymous');

    // Add DI imports if needed
    this.ensureDIImports(sourceFile);

    // Prepend DI code to function body
    this.prependDICodeToFunction(func, resolvedDependencies);

    // Remove services from parameter type (if it's inline type literal)
    this.removeServicesFromParameterType(firstParam, sourceFile);

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
    const dependencies = this.extractDependenciesFromParameter(firstParam, sourceFile);
    if (dependencies.length === 0) return false;

    // Resolve implementations for dependencies
    const resolvedDependencies = this.resolveDependencies(dependencies, declaration.getName());

    // Add DI imports if needed
    this.ensureDIImports(sourceFile);

    // Prepend DI code to arrow function body
    this.prependDICodeToArrowFunction(arrowFunc, resolvedDependencies);

    // Remove services from parameter type (if it's inline type literal)
    this.removeServicesFromParameterType(firstParam, sourceFile);

    return true;
  }

  // FIXED: Enhanced method to handle both inline type literals AND interface references
  private extractDependenciesFromParameter(param: ParameterDeclaration, sourceFile: SourceFile): FunctionalDependency[] {
    const typeNode = param.getTypeNode();
    if (!typeNode) return [];

    if (this.options.verbose) {
      console.log(`🔍 Analyzing parameter type: ${typeNode.getKindName()}`);
    }

    // Case 1: Inline type literal - props: { services: {...} }
    if (Node.isTypeLiteral(typeNode)) {
      if (this.options.verbose) {
        console.log('📝 Found inline type literal');
      }
      return this.extractFromTypeLiteral(typeNode);
    }

    // Case 2: Type reference - props: TodoAppProps
    if (Node.isTypeReference(typeNode)) {
      if (this.options.verbose) {
        console.log('📝 Found type reference');
      }
      return this.extractFromTypeReference(typeNode, sourceFile);
    }

    return [];
  }

  // Extract dependencies from inline type literal
  private extractFromTypeLiteral(typeNode: any): FunctionalDependency[] {
    const servicesProperty = typeNode.getMembers().find((member: any) => 
      Node.isPropertySignature(member) && member.getName() === 'services'
    );
    
    if (!servicesProperty || !Node.isPropertySignature(servicesProperty)) {
      if (this.options.verbose) {
        console.log('⚠️  No services property found in type literal');
      }
      return [];
    }

    const serviceTypeNode = servicesProperty.getTypeNode();
    if (!serviceTypeNode || !Node.isTypeLiteral(serviceTypeNode)) {
      if (this.options.verbose) {
        console.log('⚠️  Services property is not a type literal');
      }
      return [];
    }

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

    if (this.options.verbose) {
      console.log(`📋 Found ${dependencies.length} dependencies in type literal`);
    }

    return dependencies;
  }

  // FIXED: Extract dependencies from type reference (interface/type alias)
  private extractFromTypeReference(typeNode: any, sourceFile: SourceFile): FunctionalDependency[] {
    const typeName = typeNode.getTypeName().getText();
    
    if (this.options.verbose) {
      console.log(`🔍 Resolving type reference: ${typeName}`);
    }

    // Find the interface or type alias declaration
    const typeDeclaration = this.findTypeDeclaration(typeName, sourceFile);
    if (!typeDeclaration) {
      if (this.options.verbose) {
        console.log(`❌ Could not find declaration for type: ${typeName}`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Found type declaration: ${typeDeclaration.getKindName()}`);
    }

    // Extract services property from the type declaration
    if (Node.isInterfaceDeclaration(typeDeclaration)) {
      return this.extractFromInterfaceDeclaration(typeDeclaration);
    }

    if (Node.isTypeAliasDeclaration(typeDeclaration)) {
      return this.extractFromTypeAliasDeclaration(typeDeclaration);
    }

    return [];
  }

  // Find interface or type alias declaration in the source file or imported files
  private findTypeDeclaration(typeName: string, sourceFile: SourceFile): InterfaceDeclaration | TypeAliasDeclaration | undefined {
    // First, look in the current source file
    const localInterface = sourceFile.getInterface(typeName);
    if (localInterface) {
      if (this.options.verbose) {
        console.log(`✅ Found interface ${typeName} in current file`);
      }
      return localInterface;
    }

    const localTypeAlias = sourceFile.getTypeAlias(typeName);
    if (localTypeAlias) {
      if (this.options.verbose) {
        console.log(`✅ Found type alias ${typeName} in current file`);
      }
      return localTypeAlias;
    }

    // Then, look in imported files
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const namedImports = importDeclaration.getNamedImports();
      const isTypeImported = namedImports.some(namedImport => 
        namedImport.getName() === typeName
      );

      if (isTypeImported) {
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
        if (this.options.verbose) {
          console.log(`🔍 Looking for ${typeName} in imported module: ${moduleSpecifier}`);
        }
        
        const importedFile = this.resolveImportedFile(moduleSpecifier, sourceFile);
        
        if (importedFile) {
          const importedInterface = importedFile.getInterface(typeName);
          if (importedInterface) {
            if (this.options.verbose) {
              console.log(`✅ Found interface ${typeName} in imported file`);
            }
            return importedInterface;
          }

          const importedTypeAlias = importedFile.getTypeAlias(typeName);
          if (importedTypeAlias) {
            if (this.options.verbose) {
              console.log(`✅ Found type alias ${typeName} in imported file`);
            }
            return importedTypeAlias;
          }
        }
      }
    }

    return undefined;
  }

  // Resolve imported file path
  private resolveImportedFile(moduleSpecifier: string, sourceFile: SourceFile): SourceFile | undefined {
    try {
      const currentDir = path.dirname(sourceFile.getFilePath());
      
      let resolvedPath: string;
      if (moduleSpecifier.startsWith('.')) {
        // Relative import
        resolvedPath = path.resolve(currentDir, moduleSpecifier);
      } else {
        // Absolute import (from src root)
        resolvedPath = path.resolve(this.options.srcDir!, moduleSpecifier);
      }

      // Try different extensions
      const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        const importedFile = this.project.getSourceFile(fullPath);
        if (importedFile) {
          if (this.options.verbose) {
            console.log(`✅ Resolved import: ${moduleSpecifier} -> ${fullPath}`);
          }
          return importedFile;
        }
      }

      if (this.options.verbose) {
        console.log(`❌ Could not resolve import: ${moduleSpecifier}`);
      }
      return undefined;
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Failed to resolve import: ${moduleSpecifier}`, error);
      }
      return undefined;
    }
  }

  // Extract dependencies from interface declaration
  private extractFromInterfaceDeclaration(interfaceDecl: InterfaceDeclaration): FunctionalDependency[] {
    const servicesProperty = interfaceDecl.getProperties().find(prop => 
      prop.getName() === 'services'
    );

    if (!servicesProperty) {
      if (this.options.verbose) {
        console.log(`⚠️  No services property found in interface ${interfaceDecl.getName()}`);
      }
      return [];
    }

    const serviceTypeNode = servicesProperty.getTypeNode();
    if (!serviceTypeNode || !Node.isTypeLiteral(serviceTypeNode)) {
      if (this.options.verbose) {
        console.log(`⚠️  Services property in interface ${interfaceDecl.getName()} is not a type literal`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from interface ${interfaceDecl.getName()}`);
    }

    return this.extractFromTypeLiteral(serviceTypeNode);
  }

  // Extract dependencies from type alias declaration
  private extractFromTypeAliasDeclaration(typeAlias: TypeAliasDeclaration): FunctionalDependency[] {
    const typeNode = typeAlias.getTypeNode();
    if (!typeNode || !Node.isTypeLiteral(typeNode)) {
      if (this.options.verbose) {
        console.log(`⚠️  Type alias ${typeAlias.getName()} is not a type literal`);
      }
      return [];
    }

    if (this.options.verbose) {
      console.log(`✅ Extracting dependencies from type alias ${typeAlias.getName()}`);
    }

    return this.extractFromTypeLiteral(typeNode);
  }

  private parseDependencyType(propName: string, typeNode: TypeNode): FunctionalDependency | null {
    const typeText = typeNode.getText();
    
    const injectMatch = typeText.match(/Inject<([^>]+)>/);
    const optionalMatch = typeText.match(/InjectOptional<([^>]+)>/);
    
    let interfaceType: string;
    let isOptional: boolean;

    if (injectMatch) {
      interfaceType = injectMatch[1];
      isOptional = false;
    } else if (optionalMatch) {
      interfaceType = optionalMatch[1];
      isOptional = true;
    } else {
      // Not a DI marker type
      return null;
    }

    // ENHANCED: Use the same key sanitization as the interface resolver
    const sanitizedKey = this.interfaceResolver.getInterfaceResolver ? 
      this.interfaceResolver.resolveImplementation(interfaceType)?.sanitizedKey || this.sanitizeKey(interfaceType) :
      this.sanitizeKey(interfaceType);

    if (this.options.verbose) {
      console.log(`🔗 Found dependency: ${propName} -> ${interfaceType} (${isOptional ? 'optional' : 'required'})`);
    }

    return {
      serviceKey: propName,
      interfaceType,
      sanitizedKey,
      isOptional
    };
  }

  private resolveDependencies(
    dependencies: FunctionalDependency[], 
    componentName: string
  ): FunctionalDependency[] {
    const resolved: FunctionalDependency[] = [];

    for (const dependency of dependencies) {
      const implementation = this.interfaceResolver.resolveImplementation(dependency.interfaceType);
      
      if (implementation) {
        dependency.resolvedImplementation = implementation;
        // CRITICAL: Use the implementation's sanitized key, not our own
        dependency.sanitizedKey = implementation.sanitizedKey;
        resolved.push(dependency);
        
        if (this.options.verbose) {
          console.log(`🔗 ${componentName}: ${dependency.interfaceType} -> ${implementation.implementationClass}`);
        }
      } else {
        if (dependency.isOptional) {
          // Optional dependency, continue without implementation
          resolved.push(dependency);
          
          if (this.options.verbose) {
            console.log(`⚠️  ${componentName}: Optional dependency ${dependency.interfaceType} not found`);
          }
        } else {
          // Required dependency missing - warn but continue
          console.warn(`⚠️  ${componentName}: Required dependency ${dependency.interfaceType} not found`);
          resolved.push(dependency); // Include anyway for error handling at runtime
        }
      }
    }

    return resolved;
  }

  // ENHANCED: Better key sanitization that matches the interface resolver
  private sanitizeKey(type: string): string {
    // Handle AsyncState<T> pattern specifically
    const asyncStateMatch = type.match(/^AsyncState<(.+)>$/);
    if (asyncStateMatch) {
      const stateType = asyncStateMatch[1];
      return `AsyncState_${this.sanitizeKey(stateType)}`;
    }

    return type
      .replace(/<([^>]+)>/g, "_$1") // CacheInterface<UserServiceState> -> CacheInterface_UserServiceState
      .replace(/[^\w]/g, "_") // Replace special chars
      .replace(/_+/g, "_") // Remove multiple underscores
      .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
  }

  // Calculate correct relative import path based on file location
  private ensureDIImports(sourceFile: SourceFile): void {
    const existingImports = sourceFile.getImportDeclarations();
    const hasDIImport = existingImports.some(imp => 
      imp.getModuleSpecifierValue().includes('di/context')
    );

    if (!hasDIImport) {
      // Calculate relative path from current file to DI context
      const currentFilePath = sourceFile.getFilePath();
      const srcDir = path.resolve(this.options.srcDir!);
      const diContextPath = path.join(srcDir, 'di', 'context');
      
      // Calculate relative path
      const currentFileDir = path.dirname(currentFilePath);
      const relativePath = path.relative(currentFileDir, diContextPath)
        .replace(/\\/g, '/'); // Normalize to forward slashes
      
      // Ensure the path starts with ./ or ../
      const normalizedPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      if (this.options.verbose) {
        console.log(`📦 Adding DI import to ${sourceFile.getBaseName()}: ${normalizedPath}`);
      }

      sourceFile.addImportDeclaration({
        moduleSpecifier: normalizedPath,
        namedImports: ['useService', 'useOptionalService']
      });
    }
  }

  private prependDICodeToFunction(func: FunctionDeclaration, dependencies: FunctionalDependency[]): void {
    const body = func.getBody();
    if (!body || !Node.isBlock(body)) return;

    // Remove services from destructuring first
    this.removeServicesFromDestructuring(body);

    // Generate DI hook calls
    const diStatements: string[] = [];
    
    for (const dep of dependencies) {
      if (dep.resolvedImplementation) {
        // CRITICAL: Use the resolved implementation's sanitized key
        const token = dep.resolvedImplementation.sanitizedKey;
        const hookName = dep.isOptional ? 'useOptionalService' : 'useService';
        diStatements.push(`    const ${dep.serviceKey} = ${hookName}('${token}');`);
      } else if (dep.isOptional) {
        // Optional dependency that couldn't be resolved
        diStatements.push(`    const ${dep.serviceKey} = undefined; // Optional dependency not found`);
      } else {
        // Required dependency that couldn't be resolved - will throw at runtime
        diStatements.push(`    const ${dep.serviceKey} = useService('${dep.sanitizedKey}'); // Warning: implementation not found`);
      }
    }

    // Generate services object
    const serviceKeys = dependencies.map(dep => dep.serviceKey).join(', ');
    diStatements.push(`    const services = { ${serviceKeys} };`);

    // Insert at the beginning of the function body
    for (let i = diStatements.length - 1; i >= 0; i--) {
      body.insertStatements(0, diStatements[i]);
    }
  }

  private prependDICodeToArrowFunction(arrowFunc: ArrowFunction, dependencies: FunctionalDependency[]): void {
    const body = arrowFunc.getBody();
    if (!Node.isBlock(body)) return;

    // Remove services from destructuring first
    this.removeServicesFromDestructuring(body);

    // Generate DI hook calls (same logic as function)
    const diStatements: string[] = [];
    
    for (const dep of dependencies) {
      if (dep.resolvedImplementation) {
        const token = dep.resolvedImplementation.sanitizedKey;
        const hookName = dep.isOptional ? 'useOptionalService' : 'useService';
        diStatements.push(`    const ${dep.serviceKey} = ${hookName}('${token}');`);
      } else if (dep.isOptional) {
        diStatements.push(`    const ${dep.serviceKey} = undefined; // Optional dependency not found`);
      } else {
        diStatements.push(`    const ${dep.serviceKey} = useService('${dep.sanitizedKey}'); // Warning: implementation not found`);
      }
    }

    // Generate services object
    const serviceKeys = dependencies.map(dep => dep.serviceKey).join(', ');
    diStatements.push(`    const services = { ${serviceKeys} };`);

    // Insert at the beginning of the function body
    for (let i = diStatements.length - 1; i >= 0; i--) {
      body.insertStatements(0, diStatements[i]);
    }
  }

  // FIXED: Enhanced method to handle both inline types and interface references
  private removeServicesFromParameterType(param: ParameterDeclaration, sourceFile: SourceFile): void {
    const typeNode = param.getTypeNode();
    if (!typeNode) return;

    // Case 1: Inline type literal - can remove services property
    if (Node.isTypeLiteral(typeNode)) {
      const members = typeNode.getMembers();
      for (const member of members) {
        if (Node.isPropertySignature(member) && member.getName() === 'services') {
          member.remove();
          break;
        }
      }
      return;
    }

    // Case 2: Type reference - need to create a new interface without services
    if (Node.isTypeReference(typeNode)) {
      const typeName = typeNode.getTypeName().getText();
      
      // For now, we'll comment out the services parameter rather than modifying the interface
      // This prevents breaking other components that use the same interface
      if (this.options.verbose) {
        console.log(`⚠️  Cannot remove services from interface ${typeName}, keeping parameter for compatibility`);
      }
      return;
    }
  }

  private removeServicesFromDestructuring(body: any): void {
    const statements = body.getStatements();
    
    for (const statement of statements) {
      if (Node.isVariableStatement(statement)) {
        const declarations = statement.getDeclarationList().getDeclarations();
        
        for (const declaration of declarations) {
          const nameNode = declaration.getNameNode();
          
          if (Node.isObjectBindingPattern(nameNode)) {
            const initializer = declaration.getInitializer();
            
            if (initializer && Node.isIdentifier(initializer) && initializer.getText() === 'props') {
              const elements = nameNode.getElements();
              const nonServicesElements: string[] = [];
              
              for (const element of elements) {
                if (Node.isBindingElement(element)) {
                  const propertyName = element.getPropertyNameNode();
                  const name = element.getNameNode();
                  
                  let elementName = '';
                  if (propertyName && Node.isIdentifier(propertyName)) {
                    elementName = propertyName.getText();
                  } else if (Node.isIdentifier(name)) {
                    elementName = name.getText();
                  }
                  
                  if (elementName !== 'services') {
                    nonServicesElements.push(element.getText());
                  }
                }
              }
              
              if (nonServicesElements.length > 0 && nonServicesElements.length < elements.length) {
                const newDestructuring = `const { ${nonServicesElements.join(', ')} } = props;`;
                statement.replaceWithText(newDestructuring);
              } else if (nonServicesElements.length === 0) {
                statement.remove();
              }
            }
          }
        }
      }
    }
  }

  private async generateDebugFiles(): Promise<void> {
    if (!this.options.generateDebugFiles) return;

    const transformedDir = this.configManager.getTransformedDir();
    
    if (!fs.existsSync(transformedDir)) {
      fs.mkdirSync(transformedDir, { recursive: true });
    }

    for (const [originalPath, transformedContent] of this.transformedFiles) {
      try {
        const relativePath = path.relative(path.resolve(this.options.srcDir!), originalPath);
        const debugPath = path.join(transformedDir, relativePath.replace(/\.(ts|tsx)$/, '.di-transformed.$1'));
        
        const debugDir = path.dirname(debugPath);
        if (!fs.existsSync(debugDir)) {
          await fs.promises.mkdir(debugDir, { recursive: true });
        }
        
        const debugContent = `// Auto-generated transformed file - do not edit
// Original: ${relativePath}
// Config: ${this.configManager.getConfigHash()}
// Generated: ${new Date().toISOString()}

${transformedContent}`;
        
        await fs.promises.writeFile(debugPath, debugContent, 'utf8');
        
        if (this.options.verbose) {
          console.log(`📝 Generated debug file: ${path.relative(process.cwd(), debugPath)}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to write debug file for ${originalPath}:`, error);
      }
    }
  }

  getTransformationSummary(): { 
    count: number; 
    functions: string[]; 
    transformedFiles: string[];
    resolvedDependencies: number;
  } {
    const implementations = this.interfaceResolver.getInterfaceImplementations();
    
    return {
      count: this.transformationCount,
      functions: [],
      transformedFiles: Array.from(this.transformedFiles.keys()),
      resolvedDependencies: implementations.size
    };
  }

  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getInterfaceResolver(): InterfaceResolver {
    return this.interfaceResolver;
  }
}