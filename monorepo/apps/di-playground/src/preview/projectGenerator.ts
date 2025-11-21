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
 * Generate Sandpack file structure with browser-transformed code
 *
 * NOTE: We use pre-transformed code (not the Vite plugin in Sandpack) because:
 * - Vite plugins with complex AST transformations don't work well in Sandpack
 * - The @tdi2/vite-plugin-di package may not be available in Sandpack
 * - Browser transformation is already working and tested
 *
 * This still provides educational value:
 * - Editor shows original → transformed side-by-side
 * - Preview shows the working result
 * - Structure matches real TDI2 projects (with DI_CONFIG)
 */
export function generateSandpackFiles(
  example: ProjectExample,
  transformedFiles: Record<string, TransformedFile>,
  diConfigContent: string
): SandpackFiles {
  const files: SandpackFiles = {};

  // Add package.json (simple React, no Vite plugin)
  files['/package.json'] = {
    code: JSON.stringify(
      {
        name: 'tdi2-playground-preview',
        version: '1.0.0',
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

  // Add the generated DI_CONFIG.ts (from browser transformer)
  files['/src/.tdi2/DI_CONFIG.ts'] = {
    code: diConfigContent,
    hidden: true,
    readOnly: true,
  };

  // Generate main entry point
  files['/src/index.tsx'] = {
    code: generateMainEntry(example),
    hidden: true,
    readOnly: true,
  };

  // Add TRANSFORMED component files (from browser transformer)
  for (const file of example.files) {
    const transformed = transformedFiles[file.path];

    // Only include files that were successfully transformed OR are services
    if (transformed || file.path.includes('services/')) {
      const sandpackPath = `/src/${file.path.replace(/^src\//, '')}`;
      files[sandpackPath] = {
        code: transformed?.transformedCode || file.content,
        active: file === example.files[0],
      };
    }
  }

  return files;
}

/**
 * Generate index.tsx entry point (like real TDI2 projects)
 */
function generateMainEntry(
  example: ProjectExample
): string {
  // Find the main component (first component file or first .tsx file)
  const mainComponent = findMainComponent(example);

  return `import React from 'react';
import { createRoot } from 'react-dom/client';
import { CompileTimeDIContainer } from '@tdi2/di-core/container';
import { DIProvider } from '@tdi2/di-core/context';
import { DI_CONFIG } from './.tdi2/DI_CONFIG';
import ${mainComponent.componentName} from './${mainComponent.path}';

// Create and configure DI container
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG);

console.log('🔧 TDI2 Playground - DI Container initialized');
console.log('📋 Example: ${example.name}');
console.log('📦 Registered services:', container.getRegisteredTokens());

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
