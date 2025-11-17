import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { BrowserTransformer } from './transformer';
import { examples, defaultCode, Example } from './examples';

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
              theme="vs-dark"
              value={inputCode}
              onChange={(value) => setInputCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </div>

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
