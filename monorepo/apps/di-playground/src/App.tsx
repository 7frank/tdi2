import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { BrowserTransformer } from './transformer';
import { examples, defaultExample, ProjectExample, ProjectFile } from './examples';
import { FileTree } from './components/FileTree';
import type * as Monaco from 'monaco-editor';

// Configure Monaco editor with type definitions
const configureMonaco = (monaco: typeof Monaco) => {
  // Add React type definitions
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare module 'react' {
      export function useState<T>(initialValue: T): [T, (value: T) => void];
      export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
      export function useCallback<T extends Function>(callback: T, deps: any[]): T;
      export const FC: any;
      export const ReactNode: any;
      export default React;
      const React: any;
    }`,
    'file:///node_modules/@types/react/index.d.ts'
  );

  // Add @tdi2/di-core type definitions
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare module '@tdi2/di-core' {
      export type Inject<T> = T;
      export type InjectOptional<T> = T | undefined;
      export function Service(): ClassDecorator;
      export const Container: any;
    }`,
    'file:///node_modules/@tdi2/di-core/index.d.ts'
  );

  // Configure compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  // Set diagnostics options to reduce noise
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    diagnosticCodesToIgnore: [
      1259, // Top-level 'await' expressions are only allowed when the 'module' option is set to 'esnext' or 'system'
      2792, // Cannot find module (we handle this with extra libs)
    ],
  });
};

interface TransformedFile {
  path: string;
  originalCode: string;
  transformedCode: string;
  error?: string;
}

type ViewMode = 'before' | 'after';

function App() {
  const [selectedExample, setSelectedExample] = useState<ProjectExample>(defaultExample);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [transformedFiles, setTransformedFiles] = useState<Record<string, TransformedFile>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('before');
  const [error, setError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const transformerRef = useRef<BrowserTransformer | null>(null);

  // Initialize transformer
  useEffect(() => {
    transformerRef.current = new BrowserTransformer();
  }, []);

  // Set initial selected file when example changes
  useEffect(() => {
    if (selectedExample.files.length > 0) {
      setSelectedFilePath(selectedExample.files[0].path);
    }
  }, [selectedExample]);

  // Transform all files when example changes
  useEffect(() => {
    transformAllFiles();
  }, [selectedExample]);

  const transformAllFiles = useCallback(async () => {
    if (!transformerRef.current) return;

    setIsTransforming(true);
    setError(null);

    const results: Record<string, TransformedFile> = {};

    for (const file of selectedExample.files) {
      try {
        const result = await transformerRef.current.transform(file.content, file.path);

        results[file.path] = {
          path: file.path,
          originalCode: file.content,
          transformedCode: result.transformedCode || file.content,
          error: result.error,
        };

        if (result.warnings && result.warnings.length > 0) {
          console.warn(`Warnings for ${file.path}:`, result.warnings);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        results[file.path] = {
          path: file.path,
          originalCode: file.content,
          transformedCode: `// Transformation failed: ${errorMessage}`,
          error: errorMessage,
        };
      }
    }

    setTransformedFiles(results);
    setIsTransforming(false);
  }, [selectedExample]);

  const handleExampleChange = (index: number) => {
    setSelectedExample(examples[index]);
    setShowPreview(false);
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFilePath(filePath);
  };

  const handleRun = () => {
    setShowPreview(true);
  };

  const getCurrentFile = (): ProjectFile | null => {
    if (!selectedFilePath) return null;
    return selectedExample.files.find((f) => f.path === selectedFilePath) || null;
  };

  const getCurrentTransformedFile = (): TransformedFile | null => {
    if (!selectedFilePath) return null;
    return transformedFiles[selectedFilePath] || null;
  };

  const currentFile = getCurrentFile();
  const currentTransformed = getCurrentTransformedFile();
  const currentCode = viewMode === 'before'
    ? currentFile?.content || ''
    : currentTransformed?.transformedCode || '';
  const currentLanguage = currentFile?.language || 'typescript';
  const exampleIndex = examples.findIndex(ex => ex.name === selectedExample.name);

  return (
    <div className="playground-container">
      <header className="playground-header">
        <div className="playground-title">
          <span>🎮</span>
          <span>TDI2 Playground</span>
        </div>
        <div className="playground-controls">
          <select
            className="playground-select"
            value={exampleIndex}
            onChange={(e) => handleExampleChange(parseInt(e.target.value))}
          >
            {examples.map((example, index) => (
              <option key={index} value={index}>
                {example.name}
              </option>
            ))}
          </select>
          <button
            className="playground-button"
            onClick={handleRun}
            disabled={isTransforming}
          >
            {showPreview ? '🔄 Refresh' : '▶️ Run'}
          </button>
          {showPreview && (
            <button
              className="playground-button secondary"
              onClick={() => setShowPreview(false)}
            >
              ✕ Close Preview
            </button>
          )}
        </div>
      </header>

      <div className="playground-content">
        {/* Left Panel - File Tree */}
        <div className="sidebar-panel">
          <FileTree
            example={selectedExample}
            selectedFile={selectedFilePath}
            onFileSelect={handleFileSelect}
          />
          <div className="sidebar-info">
            <p className="info-description">{selectedExample.description}</p>
            <p className="info-stats">
              {selectedExample.files.length} file{selectedExample.files.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="editor-panel">
          <div className="editor-tabs">
            <button
              className={`editor-tab ${viewMode === 'before' ? 'active' : ''}`}
              onClick={() => setViewMode('before')}
            >
              📝 Before Transformation
            </button>
            <button
              className={`editor-tab ${viewMode === 'after' ? 'active' : ''}`}
              onClick={() => setViewMode('after')}
            >
              ✨ After Transformation
            </button>
            {isTransforming && (
              <span className="transforming-indicator">⚡ Transforming...</span>
            )}
          </div>
          <div className="editor-header">
            {currentFile?.path || 'No file selected'}
          </div>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={currentLanguage}
              path={currentFile?.path}
              theme="vs-dark"
              value={currentCode}
              beforeMount={configureMonaco}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: viewMode === 'after',
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* Right Panel - Preview (conditional) */}
        {showPreview && (
          <div className="preview-panel">
            <div className="preview-header">
              Preview
            </div>
            <div className="preview-content">
              <div className="preview-placeholder">
                <div className="preview-icon">🚧</div>
                <h3>Preview Coming Soon</h3>
                <p>Interactive preview will render the transformed component here.</p>
                <div className="preview-info">
                  <p>Files transformed: {Object.keys(transformedFiles).length}</p>
                  <p>Current example: {selectedExample.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-panel">
          <div className="error-title">❌ Transformation Error</div>
          <div className="error-message">{error}</div>
        </div>
      )}
    </div>
  );
}

export default App;
