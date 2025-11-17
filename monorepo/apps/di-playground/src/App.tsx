import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { BrowserTransformer } from './transformer';
import { examples, defaultCode, Example } from './examples';
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

function App() {
  const [inputCode, setInputCode] = useState(defaultCode);
  const [outputCode, setOutputCode] = useState('// Transformed code will appear here...');
  const [error, setError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [selectedExample, setSelectedExample] = useState(0);
  const transformerRef = useRef<BrowserTransformer | null>(null);

  // Initialize transformer
  useEffect(() => {
    transformerRef.current = new BrowserTransformer();
  }, []);

  // Auto-transform when input changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleTransform();
    }, 500);

    return () => clearTimeout(timer);
  }, [inputCode]);

  const handleTransform = useCallback(async () => {
    if (!transformerRef.current) return;

    setIsTransforming(true);
    setError(null);

    try {
      // Use the ACTUAL TDI2 transformer (not a demo!)
      const result = await transformerRef.current.transform(inputCode, 'playground.tsx');

      if (result.success && result.transformedCode) {
        setOutputCode(result.transformedCode);
        if (result.warnings && result.warnings.length > 0) {
          console.warn('Transformation warnings:', result.warnings);
        }
        if (result.stats) {
          console.info('Transformation stats:', result.stats);
        }
      } else {
        setError(result.error || 'Transformation failed');
        setOutputCode('// Transformation failed. See error message above.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setOutputCode('// Transformation failed. See error message above.');
    } finally {
      setIsTransforming(false);
    }
  }, [inputCode]);

  const handleExampleChange = (index: number) => {
    setSelectedExample(index);
    setInputCode(examples[index].code);
  };

  const handleReset = () => {
    setInputCode(examples[selectedExample].code);
  };

  const handleShare = () => {
    // TODO: Implement share functionality (URL encoding)
    alert('Share functionality coming soon!');
  };

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
            value={selectedExample}
            onChange={(e) => handleExampleChange(parseInt(e.target.value))}
          >
            {examples.map((example, index) => (
              <option key={index} value={index}>
                {example.name}
              </option>
            ))}
          </select>
          <button className="playground-button secondary" onClick={handleReset}>
            Reset
          </button>
          <button className="playground-button" onClick={handleTransform}>
            Transform
          </button>
          <button className="playground-button secondary" onClick={handleShare}>
            Share
          </button>
        </div>
      </header>

      <div className="playground-content">
        <div className="editor-panel">
          <div className="editor-header">
            Input Code (TypeScript/React)
            <span style={{ marginLeft: '10px', fontSize: '11px', color: '#666' }}>
              {examples[selectedExample].description}
            </span>
          </div>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              language="typescript"
              path="playground.tsx"
              theme="vs-dark"
              value={inputCode}
              onChange={(value) => setInputCode(value || '')}
              beforeMount={configureMonaco}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>        </div>

        <div className="resizer" />

        <div className="editor-panel">
          <div className="editor-header">
            Transformed Code (TDI2 Enhanced)
            {isTransforming && (
              <span style={{ marginLeft: '10px', fontSize: '11px', color: '#0e639c' }}>
                ⚡ Transforming...
              </span>
            )}
          </div>
          <div className="editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={outputCode}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: true,
                tabSize: 2,
              }}
            />
          </div>
        </div>
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
