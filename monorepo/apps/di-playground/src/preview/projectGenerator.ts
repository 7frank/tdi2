import type { ProjectExample } from '../examples';

export interface TransformedFile {
  path: string;
  originalCode: string;
  transformedCode: string;
  error?: string;
}

export interface SandpackFiles {
  [key: string]: {
    code: string;
    hidden?: boolean;
    active?: boolean;
    readOnly?: boolean;
  };
}

/**
 * Generate Sandpack file structure from transformed files
 */
export function generateSandpackFiles(
  example: ProjectExample,
  transformedFiles: Record<string, TransformedFile>
): SandpackFiles {
  const files: SandpackFiles = {};

  // Add package.json
  files['/package.json'] = {
    code: JSON.stringify(
      {
        name: 'tdi2-playground-preview',
        version: '1.0.0',
        main: '/src/index.tsx',
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          '@tdi2/di-core': '3.3.0',
          valtio: '^2.1.2',
        },
      },
      null,
      2
    ),
    hidden: true,
  };

  // Add index.html
  files['/index.html'] = {
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TDI2 Playground - ${example.name}</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    #root {
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    hidden: true,
  };

  // Generate main entry point with DI bootstrap
  files['/src/index.tsx'] = {
    code: generateMainEntry(example),
    hidden: true,
    readOnly: true,
  };

  // Add all transformed files
  for (const file of example.files) {
    const transformed = transformedFiles[file.path];
    if (transformed) {
      const sandpackPath = `/src/${file.path.replace(/^src\//, '')}`;
      files[sandpackPath] = {
        code: transformed.transformedCode,
        active: file === example.files[0], // First file is active
      };
    }
  }

  return files;
}

/**
 * Generate main.tsx entry point with DI container setup
 */
function generateMainEntry(
  example: ProjectExample
): string {
  // Extract services from example files
  const services = extractServices(example);

  // Find the main component (first component file or first .tsx file)
  const mainComponent = findMainComponent(example);

  return `import React from 'react';
import { createRoot } from 'react-dom/client';
import { CompileTimeDIContainer } from '@tdi2/di-core/container';
import { DIProvider } from '@tdi2/di-core/context';

// Import services
${services.map((s) => `import { ${s.className} } from './${s.path}';`).join('\n')}

// Import main component
import ${mainComponent.componentName} from './${mainComponent.path}';

// Create DI configuration
const DI_CONFIG = {
  services: [
${services.map((s) => `    { token: '${s.interface}', implementation: ${s.className} },`).join('\n')}
  ]
};

// Create and configure DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

console.log('🔧 TDI2 Playground - DI Container initialized');
console.log('📋 Example: ${example.name}');
console.log('📦 Registered services:', container.getRegisteredTokens());

// Render the application
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DIProvider container={container}>
      <${mainComponent.componentName} />
    </DIProvider>
  </React.StrictMode>
);
`;
}

/**
 * Extract service information from example files
 */
function extractServices(example: ProjectExample): Array<{
  className: string;
  interface: string;
  path: string;
}> {
  const services: Array<{ className: string; interface: string; path: string }> = [];

  for (const file of example.files) {
    // Only look at service files
    if (!file.path.includes('services/')) continue;

    // Extract service class name and interface from content
    const classMatch = file.content.match(/export class (\w+) implements (\w+)/);
    if (classMatch) {
      const [, className, interfaceName] = classMatch;
      services.push({
        className,
        interface: interfaceName,
        path: file.path.replace(/^src\//, ''),
      });
    }
  }

  return services;
}

/**
 * Find the main component to render
 */
function findMainComponent(example: ProjectExample): {
  componentName: string;
  path: string;
} {
  // Look for component files
  const componentFiles = example.files.filter((f) =>
    f.path.includes('components/')
  );

  if (componentFiles.length > 0) {
    const file = componentFiles[0];
    // Extract component name from file
    const nameMatch =
      file.content.match(/export default (\w+)/) ||
      file.content.match(/function (\w+)\s*\(/);

    return {
      componentName: nameMatch ? nameMatch[1] : 'App',
      path: file.path.replace(/^src\//, ''),
    };
  }

  // Fallback: use first .tsx file
  const tsxFile = example.files.find((f) => f.path.endsWith('.tsx'));
  if (tsxFile) {
    const nameMatch =
      tsxFile.content.match(/export default (\w+)/) ||
      tsxFile.content.match(/function (\w+)\s*\(/);

    return {
      componentName: nameMatch ? nameMatch[1] : 'App',
      path: tsxFile.path.replace(/^src\//, ''),
    };
  }

  // Last resort
  return {
    componentName: 'App',
    path: 'components/App.tsx',
  };
}
