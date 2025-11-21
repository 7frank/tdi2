import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { BrowserTransformer } from './transformer';
import { examples, defaultExample, ProjectExample, ProjectFile } from './examples';
import { FileTree } from './components/FileTree';
import { Preview } from './components/Preview';
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

export interface TransformedFile {
  path: string;
  originalCode: string;
  transformedCode: string;
  error?: string;
}

export interface EditedFile {
  path: string;
  content: string;
}

type ViewMode = 'before' | 'after';

function App() {
  const [selectedExample, setSelectedExample] = useState<ProjectExample>(defaultExample);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [transformedFiles, setTransformedFiles] = useState<Record<string, TransformedFile>>({});
  const [editedFiles, setEditedFiles] = useState<Record<string, string>>({}); // Store user edits
  const [viewMode, setViewMode] = useState<ViewMode>('before');
  const [error, setError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const transformerRef = useRef<BrowserTransformer | null>(null);
  const transformTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize transformer
  useEffect(() => {
    transformerRef.current = new BrowserTransformer();
  }, []);

  // Set initial selected file when example changes
  useEffect(() => {
    if (selectedExample.files.length > 0) {
      setSelectedFilePath(selectedExample.files[0].path);
    }
    // Clear edits when example changes
    setEditedFiles({});
  }, [selectedExample]);

  // Transform all files
  const transformAllFiles = useCallback(async () => {
    if (!transformerRef.current || isTransforming) return;

    setIsTransforming(true);
    setError(null);

    const results: Record<string, TransformedFile> = {};

    for (const file of selectedExample.files) {
      try {
        // Use edited content if available, otherwise use original
        const contentToTransform = editedFiles[file.path] ?? file.content;
        const result = await transformerRef.current.transform(contentToTransform, file.path);

        results[file.path] = {
          path: file.path,
          originalCode: contentToTransform,
          transformedCode: result.transformedCode || contentToTransform,
          error: result.error,
        };

        if (result.warnings && result.warnings.length > 0) {
          console.warn(`Warnings for ${file.path}:`, result.warnings);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        const contentToTransform = editedFiles[file.path] ?? file.content;
        results[file.path] = {
          path: file.path,
          originalCode: contentToTransform,
          transformedCode: `// Transformation failed: ${errorMessage}`,
          error: errorMessage,
        };
      }
    }

    setTransformedFiles(results);
    setIsTransforming(false);
  }, [selectedExample.files, editedFiles, isTransforming]);

  // Debounced transform when edits change
  useEffect(() => {
    // Only transform if we have edits
    if (Object.keys(editedFiles).length === 0) return;

    // Clear any pending transformation
    if (transformTimeoutRef.current) {
      clearTimeout(transformTimeoutRef.current);
    }

    // Debounce transformation (500ms delay)
    transformTimeoutRef.current = setTimeout(() => {
      transformAllFiles();
    }, 500);

    // Cleanup on unmount or before next effect
    return () => {
      if (transformTimeoutRef.current) {
        clearTimeout(transformTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedFiles]);

  // Transform immediately when example changes (no debounce)
  useEffect(() => {
    transformAllFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExample]);

  // Load edited files from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = atob(hash);
        const data = JSON.parse(decoded);
        if (data.edits) {
          setEditedFiles(data.edits);
        }
      } catch (e) {
        console.warn('Failed to load edits from URL:', e);
      }
    }
  }, []);

  // Save edited files to URL hash
  useEffect(() => {
    if (Object.keys(editedFiles).length > 0) {
      const data = { edits: editedFiles };
      const encoded = btoa(JSON.stringify(data));
      window.location.hash = encoded;
    } else {
      window.location.hash = '';
    }
  }, [editedFiles]);

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

  // Handle code changes with debounced transformation
  const handleCodeChange = (value: string | undefined) => {
    if (!selectedFilePath || !value) return;

    // Update edited files immediately
    setEditedFiles(prev => ({
      ...prev,
      [selectedFilePath]: value,
    }));

    // Debounce transformation (will trigger via useEffect)
    if (transformTimeoutRef.current) {
      clearTimeout(transformTimeoutRef.current);
    }
  };

  // Generate DI_CONFIG.ts content using the actual transformer logic
  const generateDIConfig = (): string => {
    if (!transformerRef.current) {
      return `// Transformer not initialized
export const DI_CONFIG = {};
export const SERVICE_TOKENS = {};
export const INTERFACE_IMPLEMENTATIONS = {};
`;
    }

    return transformerRef.current.generateDIConfig();
  };

  // Get files to display based on view mode
  const getDisplayFiles = (): ProjectFile[] => {
    if (viewMode === 'before') {
      return selectedExample.files;
    } else {
      // In "after" view, show transformed files + generated files
      const transformedFilesList: ProjectFile[] = selectedExample.files.map(file => ({
        ...file,
        path: file.path,
        content: transformedFiles[file.path]?.transformedCode || file.content,
      }));

      // Add generated DI_CONFIG file
      const diConfigFile: ProjectFile = {
        path: 'src/.tdi2/DI_CONFIG.ts',
        language: 'typescript',
        content: generateDIConfig(),
      };

      return [...transformedFilesList, diConfigFile];
    }
  };

  const displayFiles = getDisplayFiles();

  const getCurrentFile = (): ProjectFile | null => {
    if (!selectedFilePath) return null;

    // Check if it's a generated file
    const generatedFile = displayFiles.find((f) => f.path === selectedFilePath);
    if (generatedFile && selectedFilePath.includes('.tdi2/')) {
      return generatedFile;
    }

    // Otherwise, look in original files
    return selectedExample.files.find((f) => f.path === selectedFilePath) || null;
  };

  const getCurrentTransformedFile = (): TransformedFile | null => {
    if (!selectedFilePath) return null;
    return transformedFiles[selectedFilePath] || null;
  };

  const currentFile = getCurrentFile();
  const currentTransformed = getCurrentTransformedFile();

  // Get current code based on view mode
  const currentCode = viewMode === 'before'
    ? (editedFiles[selectedFilePath || ''] ?? currentFile?.content ?? '')
    : (currentFile?.path.includes('.tdi2/')
        ? currentFile.content // Show generated file as-is
        : (currentTransformed?.transformedCode ?? ''));

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
          <div className="view-mode-toggle">
            <button
              className={`toggle-button ${viewMode === 'before' ? 'active' : ''}`}
              onClick={() => setViewMode('before')}
            >
              📝 Before
            </button>
            <button
              className={`toggle-button ${viewMode === 'after' ? 'active' : ''}`}
              onClick={() => setViewMode('after')}
            >
              ✨ After
            </button>
          </div>
          <FileTree
            example={{
              ...selectedExample,
              files: displayFiles,
            }}
            selectedFile={selectedFilePath}
            onFileSelect={handleFileSelect}
          />
          <div className="sidebar-info">
            <p className="info-description">{selectedExample.description}</p>
            <p className="info-stats">
              {displayFiles.length} file{displayFiles.length !== 1 ? 's' : ''}
              {viewMode === 'after' && ' (transformed)'}
            </p>
          </div>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="editor-panel">
          <div className="editor-header">
            <span className="editor-file-path">
              {currentFile?.path || 'No file selected'}
            </span>
            {isTransforming && (
              <span className="transforming-indicator">⚡ Transforming...</span>
            )}
            {currentFile?.path.includes('.tdi2/') && (
              <span className="editor-mode-badge generated">⚙️ Generated</span>
            )}
            {viewMode === 'before' && !currentFile?.path.includes('.tdi2/') && (
              <span className="editor-mode-badge">Editable</span>
            )}
            {viewMode === 'after' && !currentFile?.path.includes('.tdi2/') && (
              <span className="editor-mode-badge readonly">Read-only</span>
            )}
          </div>
          <div className="editor-wrapper">
            <Editor
              key={`${viewMode}-${currentFile?.path}`}
              height="100%"
              language={currentLanguage}
              path={`${viewMode}:${currentFile?.path}`}
              theme="vs-dark"
              value={currentCode}
              onChange={viewMode === 'before' ? handleCodeChange : undefined}
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

        {/* Right Panel - Live Preview (conditional) */}
        {showPreview && (
          <Preview
            example={selectedExample}
            transformedFiles={transformedFiles}
            onClose={() => setShowPreview(false)}
          />
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
