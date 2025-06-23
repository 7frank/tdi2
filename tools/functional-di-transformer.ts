// tools/functional-di-transformer.ts - Real AST transformation for functional DI

import { 
  Project, 
  SourceFile, 
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  Node,
  SyntaxKind,
  TypeNode,
  TypeReferenceNode
} from 'ts-morph';
import * as path from 'path';

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

export class FunctionalDITransformer {
  private project: Project;
  private functionalServices: Map<string, FunctionalDIInfo> = new Map();
  private tokenMap: Map<string, string> = new Map();

  constructor(project: Project) {
    this.project = project;
  }

  async transformFunctionalDI(): Promise<void> {
    // First, collect token exports
    await this.collectTokenExports();
    
    // Then find functional components with DI
    await this.findFunctionalComponents();
    
    // Actually transform the components
    await this.performActualTransformations();
  }

  private async collectTokenExports(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      const variableStatements = sourceFile.getVariableStatements();
      
      for (const varStatement of variableStatements) {
        if (varStatement.isExported()) {
          const declarations = varStatement.getDeclarations();
          for (const declaration of declarations) {
            const name = declaration.getName();
            const initializer = declaration.getInitializer();
            
            if (initializer && Node.isStringLiteral(initializer)) {
              this.tokenMap.set(name, initializer.getLiteralValue());
            } else if (name.endsWith('_TOKEN')) {
              this.tokenMap.set(name, name);
            }
          }
        }
      }
    }

    // Add known token mappings
    this.tokenMap.set('EXAMPLE_API_TOKEN', 'EXAMPLE_API_TOKEN');
    this.tokenMap.set('LOGGER_TOKEN', 'LOGGER_TOKEN');
  }

  private async findFunctionalComponents(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      // Skip generated files and node_modules
      if (sourceFile.getFilePath().includes('generated') || 
          sourceFile.getFilePath().includes('node_modules')) {
        continue;
      }

      // Check function declarations
      const functions = sourceFile.getFunctions();
      for (const func of functions) {
        const diInfo = this.extractFunctionalDI(func, sourceFile);
        if (diInfo) {
          this.functionalServices.set(`${sourceFile.getBaseName()}_${func.getName()}`, diInfo);
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
        const returnType = func.getReturnType();
        const isComponent = this.isReactComponent(func, returnType);

        return {
          functionName: funcName,
          filePath: sourceFile.getFilePath(),
          dependencies,
          isComponent,
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
        const returnType = arrowFunc.getReturnType();
        const isComponent = this.isReactComponent(arrowFunc, returnType);

        return {
          functionName: funcName,
          filePath: sourceFile.getFilePath(),
          dependencies,
          isComponent,
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

    // Check if this is a services parameter with Inject types
    const paramName = param.getName();
    if (paramName !== 'services' && !paramName.includes('services')) {
      // Look for object type with services property
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

    // Direct services parameter
    return this.extractInjectDependencies(typeNode);
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
    // Map interface names to actual tokens
    const mappings: Record<string, string> = {
      'ExampleApiInterface': 'EXAMPLE_API_TOKEN',
      'LoggerService': 'LOGGER_TOKEN',
      'LoggerInterface': 'LOGGER_TOKEN'
    };
    
    return mappings[interfaceType] || this.tokenMap.get(interfaceType) || interfaceType;
  }

  private isReactComponent(func: FunctionDeclaration | ArrowFunction, returnType: any): boolean {
    const returnTypeText = returnType.getText();
    return returnTypeText.includes('JSX.Element') || 
           returnTypeText.includes('ReactElement') ||
           returnTypeText.includes('Element') ||
           func.getText().includes('return <') ||
           func.getText().includes('=> <');
  }

  private async performActualTransformations(): Promise<void> {
    for (const [key, diInfo] of this.functionalServices) {
      await this.transformFunctionComponent(diInfo);
    }
  }

  private async transformFunctionComponent(diInfo: FunctionalDIInfo): Promise<void> {
    const sourceFile = this.project.getSourceFile(diInfo.filePath);
    if (!sourceFile) return;

    console.log(`🔄 Transforming ${diInfo.functionName} with dependencies: ${diInfo.dependencies.map(d => d.serviceKey).join(', ')}`);

    // Add the necessary imports at the top of the file
    this.addDIImports(sourceFile);

    if (Node.isFunctionDeclaration(diInfo.node)) {
      this.transformFunctionDeclaration(diInfo.node, diInfo);
    } else if (Node.isVariableDeclaration(diInfo.node)) {
      this.transformArrowFunction(diInfo.node, diInfo);
    }
  }

  private addDIImports(sourceFile: SourceFile): void {
    // Check if DI imports already exist
    const existingImports = sourceFile.getImportDeclarations();
    const hasDIImport = existingImports.some(imp => 
      imp.getModuleSpecifierValue().includes('./di/') || 
      imp.getModuleSpecifierValue().includes('../di/')
    );

    if (!hasDIImport) {
      // Add DI imports
      const relativePath = this.getRelativeDIPath(sourceFile.getFilePath());
      sourceFile.addImportDeclaration({
        moduleSpecifier: `${relativePath}/di/context`,
        namedImports: ['useService', 'useOptionalService']
      });
    }
  }

  private getRelativeDIPath(filePath: string): string {
    const depth = filePath.split('/').length - filePath.split('/src/')[1].split('/').length;
    return depth > 1 ? '../'.repeat(depth - 1).slice(0, -1) : '.';
  }

  private transformFunctionDeclaration(func: FunctionDeclaration, diInfo: FunctionalDIInfo): void {
    const sourceFile = func.getSourceFile();
    
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

    // Get the original function signature and extract props without services
    const originalParams = func.getParameters();
    const propsParam = originalParams[0]; // Assume first param is props
    const newPropsType = this.extractNonServicesPropsType(propsParam);

    // Get function body content
    const body = func.getBody();
    if (!body) return;
    
    // Extract the function body content, removing destructuring of services
    const bodyText = body.getText();
    const cleanedBody = this.cleanFunctionBody(bodyText, diInfo);

    // Create the complete transformed function
    const transformedFunction = `function ${diInfo.functionName}(props: ${newPropsType}): JSX.Element {
${hookCalls}

${servicesObj}

${cleanedBody}`;

    // Replace the entire function
    func.replaceWithText(transformedFunction);
  }

  private transformArrowFunction(declaration: VariableDeclaration, diInfo: FunctionalDIInfo): void {
    const initializer = declaration.getInitializer();
    if (!Node.isArrowFunction(initializer)) return;

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

    // Get original parameter and extract non-services props
    const originalParams = initializer.getParameters();
    const propsParam = originalParams[0];
    const newPropsType = this.extractNonServicesPropsType(propsParam);

    // Get function body
    const body = initializer.getBody();
    let cleanedBody = '';
    
    if (Node.isBlock(body)) {
      const bodyText = body.getText();
      cleanedBody = this.cleanFunctionBody(bodyText, diInfo);
    } else {
      cleanedBody = `  return ${body.getText()};`;
    }

    // Create transformed arrow function
    const transformedFunction = `const ${diInfo.functionName} = (props: ${newPropsType}) => {
${hookCalls}

${servicesObj}

${cleanedBody}`;

    // Replace the entire variable declaration
    declaration.replaceWithText(transformedFunction);
  }

  private extractNonServicesPropsType(param: ParameterDeclaration): string {
    const typeNode = param.getTypeNode();
    if (!typeNode || !Node.isTypeLiteral(typeNode)) {
      return '{ [key: string]: any }';
    }

    const members = typeNode.getMembers();
    const nonServicesMembers = members.filter(member => {
      if (Node.isPropertySignature(member)) {
        const propName = member.getName();
        return propName !== 'services';
      }
      return true;
    });

    if (nonServicesMembers.length === 0) {
      return '{}';
    }

    const memberTexts = nonServicesMembers.map(member => member.getText());
    return `{\n  ${memberTexts.join(';\n  ')}\n}`;
  }

  private cleanFunctionBody(bodyText: string, diInfo: FunctionalDIInfo): string {
    // Remove the outer braces
    let cleaned = bodyText.slice(1, -1);
    
    // Remove or modify the services destructuring line
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      // Skip lines that destructure services from props
      return !trimmed.includes('const { ') || !trimmed.includes('services } = props');
    }).map(line => {
      // Replace references to props.services with just services
      return line.replace(/props\.services/g, 'services');
    });

    return filteredLines.join('\n');
  }

  private parameterHasInjectMarkers(param: ParameterDeclaration): boolean {
    const typeNode = param.getTypeNode();
    if (!typeNode) return false;

    const typeText = typeNode.getText();
    return typeText.includes('Inject<') || typeText.includes('InjectOptional<');
  }

  private extractNonServicesProps(param: ParameterDeclaration): string {
    const typeNode = param.getTypeNode();
    if (!typeNode || !Node.isTypeLiteral(typeNode)) {
      return '{}';
    }

    const members = typeNode.getMembers();
    const nonServicesMembers = members.filter(member => {
      if (Node.isPropertySignature(member)) {
        const propName = member.getName();
        return propName !== 'services';
      }
      return true;
    });

    if (nonServicesMembers.length === 0) {
      return '{}';
    }

    const memberTexts = nonServicesMembers.map(member => member.getText());
    return `{\n  ${memberTexts.join(';\n  ')}\n}`;
  }

  getTransformationSummary(): { count: number; functions: string[] } {
    return {
      count: this.functionalServices.size,
      functions: Array.from(this.functionalServices.keys())
    };
  }
}