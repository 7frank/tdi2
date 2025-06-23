// tools/functional-di-transformer.ts - Extension for functional DI

import { 
  Project, 
  SourceFile, 
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  ParameterDeclaration,
  Node,
  SyntaxKind,
  TypeNode
} from 'ts-morph';
import * as path from 'path';

interface FunctionalDIInfo {
  functionName: string;
  filePath: string;
  dependencies: FunctionalDependency[];
  isComponent: boolean;
  originalFunction: string;
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
    
    // Then find and transform functional components with DI
    await this.findFunctionalComponents();
    
    // Generate transformations
    await this.generateTransformations();
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
  }

  private async findFunctionalComponents(): Promise<void> {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
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

    // Look for services parameter
    const servicesParam = parameters.find(param => 
      param.getName() === 'services' || 
      this.hasInjectMarkers(param)
    );

    if (!servicesParam) return null;

    const dependencies = this.extractDependenciesFromParameter(servicesParam);
    if (dependencies.length === 0) return null;

    // Check if it's a React component (returns JSX)
    const returnType = func.getReturnType();
    const isComponent = this.isReactComponent(func, returnType);

    return {
      functionName: funcName,
      filePath: sourceFile.getFilePath(),
      dependencies,
      isComponent,
      originalFunction: func.getFullText()
    };
  }

  private extractFunctionalDIFromArrow(
    declaration: VariableDeclaration, 
    arrowFunc: ArrowFunction, 
    sourceFile: SourceFile
  ): FunctionalDIInfo | null {
    const funcName = declaration.getName();
    const parameters = arrowFunc.getParameters();
    
    if (parameters.length === 0) return null;

    const servicesParam = parameters.find(param => 
      param.getName() === 'services' || 
      this.hasInjectMarkers(param)
    );

    if (!servicesParam) return null;

    const dependencies = this.extractDependenciesFromParameter(servicesParam);
    if (dependencies.length === 0) return null;

    const returnType = arrowFunc.getReturnType();
    const isComponent = this.isReactComponent(arrowFunc, returnType);

    return {
      functionName: funcName,
      filePath: sourceFile.getFilePath(),
      dependencies,
      isComponent,
      originalFunction: declaration.getFullText()
    };
  }

  private hasInjectMarkers(param: ParameterDeclaration): boolean {
    const typeNode = param.getTypeNode();
    if (!typeNode) return false;

    const typeText = typeNode.getText();
    return typeText.includes('Inject<') || typeText.includes('InjectOptional<');
  }

  private extractDependenciesFromParameter(param: ParameterDeclaration): FunctionalDependency[] {
    const dependencies: FunctionalDependency[] = [];
    const typeNode = param.getTypeNode();
    
    if (!typeNode) return dependencies;

    // Parse the type to extract Inject<T> and InjectOptional<T> markers
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
    // Try to map interface names to tokens
    // LoggerInterface -> LOGGER_TOKEN
    // ExampleApiInterface -> EXAMPLE_API_TOKEN
    
    const tokenKey = interfaceType.replace('Interface', '').toUpperCase() + '_TOKEN';
    return this.tokenMap.get(tokenKey) || tokenKey;
  }

  private isReactComponent(func: FunctionDeclaration | ArrowFunction, returnType: any): boolean {
    // Simple heuristic: check if return type contains JSX
    const returnTypeText = returnType.getText();
    return returnTypeText.includes('JSX.Element') || 
           returnTypeText.includes('ReactElement') ||
           returnTypeText.includes('Element') ||
           func.getText().includes('return <') ||
           func.getText().includes('=> <');
  }

  private async generateTransformations(): Promise<void> {
    for (const [key, diInfo] of this.functionalServices) {
      await this.transformFunctionComponent(diInfo);
    }
  }

  private async transformFunctionComponent(diInfo: FunctionalDIInfo): Promise<void> {
    const sourceFile = this.project.getSourceFile(diInfo.filePath);
    if (!sourceFile) return;

    // Generate the transformed function
    const transformedCode = this.generateTransformedFunction(diInfo);
    
    // For now, just log what we would transform
    console.log(`🔄 Would transform ${diInfo.functionName}:`);
    console.log(`📍 Dependencies: ${diInfo.dependencies.map(d => `${d.serviceKey}:${d.token}`).join(', ')}`);
    console.log(`🔧 Generated hooks: ${this.generateUseServiceCalls(diInfo.dependencies)}`);
    
    // TODO: Actually replace the function in the source file
    // This would require careful AST manipulation to preserve formatting
  }

  private generateTransformedFunction(diInfo: FunctionalDIInfo): string {
    const useServiceCalls = this.generateUseServiceCalls(diInfo.dependencies);
    const servicesObject = this.generateServicesObject(diInfo.dependencies);
    
    return `
// Auto-transformed function with DI
function ${diInfo.functionName}(props) {
  ${useServiceCalls}
  
  const services = {
    ${servicesObject}
  };
  
  // Call original function logic with injected services
  return Original${diInfo.functionName}({ ...props, services });
}`;
  }

  private generateUseServiceCalls(dependencies: FunctionalDependency[]): string {
    return dependencies.map(dep => {
      if (dep.isOptional) {
        return `  const ${dep.serviceKey} = useOptionalService('${dep.token}');`;
      } else {
        return `  const ${dep.serviceKey} = useService('${dep.token}');`;
      }
    }).join('\n');
  }

  private generateServicesObject(dependencies: FunctionalDependency[]): string {
    return dependencies.map(dep => `    ${dep.serviceKey}`).join(',\n');
  }

  getTransformationSummary(): { count: number; functions: string[] } {
    return {
      count: this.functionalServices.size,
      functions: Array.from(this.functionalServices.keys())
    };
  }
}