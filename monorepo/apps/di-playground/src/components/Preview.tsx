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
  // Generate Sandpack file structure from transformed files
  const files = useMemo(() => {
    return generateSandpackFiles(example, transformedFiles, diConfigContent);
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
          template="vite-react-ts"
          theme="dark"
          files={files}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            showInlineErrors: true,
            closableTabs: false,
            editorHeight: '100%',
            editorWidthPercentage: 0, // Hide editor, only show preview
            autorun: true,
            autoReload: true,
          }}
        />
      </div>

      <div className="preview-info">
        <div className="preview-info-item">
          <span className="preview-info-label">Example:</span>
          <span className="preview-info-value">{example.name}</span>
        </div>
        <div className="preview-info-item">
          <span className="preview-info-label">Files transformed:</span>
          <span className="preview-info-value">{Object.keys(transformedFiles).length}</span>
        </div>
      </div>
    </div>
  );
}
