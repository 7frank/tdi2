import { useMemo } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import type { ProjectExample } from '../examples';
import type { TransformedFile } from '../App';
import { generateSandpackFiles } from '../preview/projectGenerator';

interface PreviewProps {
  example: ProjectExample;
  transformedFiles: Record<string, TransformedFile>;
  diConfigContent: string;
  onClose: () => void;
}

export function Preview({ example, transformedFiles, diConfigContent, onClose }: PreviewProps) {
  console.log('🎬 Preview component rendering');
  console.log('   Example:', example.name);
  console.log('   Transformed files:', Object.keys(transformedFiles));
  console.log('   DI Config length:', diConfigContent.length);
  console.log('   DI Config preview:', diConfigContent.substring(0, 200));

  // Generate Sandpack file structure from transformed files
  const files = useMemo(() => {
    console.log('📦 Generating Sandpack files...');
    const generatedFiles = generateSandpackFiles(example, transformedFiles, diConfigContent);
    console.log('📦 Generated files:', Object.keys(generatedFiles));
    if (generatedFiles['/src/.tdi2/DI_CONFIG.ts']) {
      console.log('📦 DI_CONFIG in Sandpack:', generatedFiles['/src/.tdi2/DI_CONFIG.ts'].code.substring(0, 200));
    }
    return generatedFiles;
  }, [example, transformedFiles, diConfigContent]);

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <div className="preview-title">
          <span className="preview-icon">▶️</span>
          <span>Live Preview</span>
        </div>
        <button className="preview-close" onClick={onClose} title="Close preview">
          ✕
        </button>
      </div>

      <div className="preview-content">
        <Sandpack
          template="react-ts"
          theme="dark"
          files={files}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            showInlineErrors: true,
            closableTabs: false,
            editorHeight: '100%',
            editorWidthPercentage: 0, // Completely hide the editor/file panel
            autorun: true,
            autoReload: true,
            layout: 'preview', // Only show preview, no code editor
          }}
          customSetup={{
            dependencies: {
              '@tdi2/di-core': '3.3.0',
              valtio: '^2.1.2',
            },
          }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
