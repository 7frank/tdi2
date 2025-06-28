// src/components/di-dependency-viewer/diDataProcessor.ts
import type { DIDebugInfo, InterfaceImplementation, ServiceDependency } from './types';

export function processDIConfig(diConfig: any): DIDebugInfo {
  console.log('🔍 Processing DI_CONFIG:', diConfig);
  
  if (!diConfig || typeof diConfig !== 'object') {
    throw new Error('Invalid DI_CONFIG: not an object');
  }

  const implementations: Array<[string, InterfaceImplementation]> = [];
  const dependencies: Array<[string, ServiceDependency]> = [];
  const missingImplementations: string[] = [];
  const circularDependencies: string[] = [];

  // Process each service in the DI config
  Object.entries(diConfig).forEach(([token, config]: [string, any]) => {
    if (!config || typeof config !== 'object') {
      console.warn(`⚠️  Invalid config for token ${token}:`, config);
      return;
    }

    try {
      // Extract implementation info
      const implementation: InterfaceImplementation = {
        interfaceName: config.interfaceName || token,
        implementationClass: config.implementationClass || token,
        filePath: extractFilePath(config.implementationClass || token),
        isGeneric: config.isGeneric || false,
        typeParameters: config.typeParameters || [],
        sanitizedKey: token,
        isClassBased: config.isClassBased || false,
        isInheritanceBased: config.isInheritanceBased || false,
        isStateBased: config.isStateBased || false,
        baseClass: config.baseClass,
        stateType: config.stateType,
        serviceInterface: config.serviceInterface,
        inheritanceChain: config.inheritanceChain || [],
      };

      implementations.push([token, implementation]);

      // Extract dependency info if available
      if (config.dependencies && Array.isArray(config.dependencies) && config.dependencies.length > 0) {
        const constructorParams = config.dependencies.map((depToken: string) => ({
          paramName: extractParamName(depToken),
          interfaceType: extractInterfaceType(depToken),
          isOptional: false, // Default to required - could be enhanced
          sanitizedKey: depToken,
        }));

        const dependency: ServiceDependency = {
          serviceClass: config.implementationClass || token,
          interfaceDependencies: config.dependencies,
          filePath: extractFilePath(config.implementationClass || token),
          constructorParams,
        };

        dependencies.push([config.implementationClass || token, dependency]);
      }

    } catch (error) {
      console.warn(`⚠️  Failed to process config for token ${token}:`, error);
      missingImplementations.push(`${token}: ${error.message}`);
    }
  });

  // Check for missing dependencies
  const availableTokens = new Set(Object.keys(diConfig));
  dependencies.forEach(([serviceClass, dependency]) => {
    dependency.interfaceDependencies.forEach(depToken => {
      if (!availableTokens.has(depToken)) {
        missingImplementations.push(`${serviceClass} → ${depToken}`);
      }
    });
  });

  // Simple circular dependency detection
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  const detectCircular = (token: string, path: string[] = []): void => {
    if (recursionStack.has(token)) {
      const cycle = path.slice(path.indexOf(token)).concat([token]);
      circularDependencies.push(cycle.join(' → '));
      return;
    }
    
    if (visited.has(token)) return;
    
    visited.add(token);
    recursionStack.add(token);
    
    const config = diConfig[token];
    if (config && config.dependencies) {
      config.dependencies.forEach((depToken: string) => {
        detectCircular(depToken, [...path, token]);
      });
    }
    
    recursionStack.delete(token);
  };

  Object.keys(diConfig).forEach(token => {
    if (!visited.has(token)) {
      detectCircular(token);
    }
  });

  const result: DIDebugInfo = {
    implementations,
    dependencies,
    validation: {
      isValid: missingImplementations.length === 0 && circularDependencies.length === 0,
      missingImplementations,
      circularDependencies,
    },
    configHash: generateConfigHash(diConfig),
  };

  console.log('✅ Processed DI data:', result);
  return result;
}

function extractFilePath(className: string): string {
  // Generate a reasonable file path based on class name
  const serviceName = className.replace(/Service$|Impl$/, '');
  return `/src/services/${serviceName}.ts`;
}

function extractParamName(depToken: string): string {
  // Convert token to reasonable parameter name
  return depToken
    .replace(/Interface$/, '')
    .replace(/Service$/, '')
    .replace(/^([A-Z])/, (match) => match.toLowerCase())
    .replace(/([A-Z])/g, (match) => match.toLowerCase());
}

function extractInterfaceType(depToken: string): string {
  // Clean up the token to look like an interface type
  return depToken.replace(/_/g, '<').replace(/([^<>]+)/, '$1>').replace(/></, ', ');
}

function generateConfigHash(diConfig: any): string {
  // Generate a simple hash based on the config keys
  const keys = Object.keys(diConfig).sort().join(',');
  let hash = 0;
  for (let i = 0; i < keys.length; i++) {
    const char = keys.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `config-${Math.abs(hash).toString(36)}`;
}