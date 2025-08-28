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

  // Track unique implementation classes to avoid duplicates
  const processedImplementations = new Set<string>();
  const implementationToToken = new Map<string, string>();

  // Process each service in the DI config
  Object.entries(diConfig).forEach(([token, config]: [string, any]) => {
    if (!config || typeof config !== 'object') {
      console.warn(`⚠️  Invalid config for token ${token}:`, config);
      return;
    }

    try {
      const implementationClass = config.implementationClass || token;
      
      // Extract implementation info
      const implementation: InterfaceImplementation = {
        interfaceName: config.interfaceName || token,
        implementationClass,
        filePath: extractFilePath(implementationClass),
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
      
      // Track implementation class to primary token mapping
      if (!implementationToToken.has(implementationClass)) {
        implementationToToken.set(implementationClass, token);
      }

      // Extract dependency info if available - only for unique implementation classes
      if (config.dependencies && Array.isArray(config.dependencies) && config.dependencies.length > 0) {
        // Only create dependency entry if we haven't processed this implementation class yet
        if (!processedImplementations.has(implementationClass)) {
          const constructorParams = config.dependencies.map((depToken: string, index: number) => ({
            paramName: extractParamName(depToken, index),
            interfaceType: extractInterfaceType(depToken),
            isOptional: false, // Default to required - could be enhanced
            sanitizedKey: depToken,
          }));

          const dependency: ServiceDependency = {
            serviceClass: implementationClass,
            interfaceDependencies: config.dependencies,
            filePath: extractFilePath(implementationClass),
            constructorParams,
          };

          dependencies.push([implementationClass, dependency]);
          processedImplementations.add(implementationClass);
        }
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

function extractParamName(depToken: string, index: number = 0): string {
  // Convert token to reasonable parameter name
  let paramName = depToken
    .replace(/Interface$/, '')
    .replace(/Service$/, '')
    .replace(/Type$/, '')
    .replace(/_/g, '')
    .replace(/^([A-Z])/, (match) => match.toLowerCase())
    .replace(/([A-Z])/g, (match, offset) => offset > 0 ? match.toLowerCase() : match);

  // Fallback to generic name if result is empty or invalid
  if (!paramName || paramName.length < 2) {
    paramName = `dep${index}`;
  }

  return paramName;
}

function extractInterfaceType(depToken: string): string {
  // Handle common patterns in the DI config
  
  // Generic patterns with underscores (e.g., CacheInterface_UserData)
  const genericMatch = depToken.match(/^([A-Za-z]+Interface)_(.+)$/);
  if (genericMatch) {
    const [, interfaceName, typeParam] = genericMatch;
    return `${interfaceName}<${typeParam}>`;
  }
  
  // Service type patterns
  if (depToken.endsWith('ServiceType')) {
    return depToken;
  }
  
  // Interface patterns
  if (depToken.endsWith('Interface')) {
    return depToken;
  }
  
  // Service patterns
  if (depToken.endsWith('Service')) {
    return depToken;
  }
  
  // Default: return as-is
  return depToken;
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