// src/components/DiffView.tsx
import React, { useState, useEffect } from 'react';
import { parseDiff, Diff, Hunk, getChangeKey } from 'react-diff-view';
import { diffLines, createTwoFilesPatch } from 'diff';
import 'react-diff-view/style/index.css';

interface DiffViewProps {
  /**
   * Async import function for the original/input file
   */
  originalImport: () => Promise<any>;
  
  /**
   * Async import function for the transformed/output file  
   */
  transformedImport: () => Promise<any>;
  
  /**
   * Optional title for the diff view
   */
  title?: string;
  
  /**
   * Original filename (for display)
   */
  originalFileName?: string;
  
  /**
   * Transformed filename (for display)
   */
  transformedFileName?: string;
  
  /**
   * Diff view type: 'split' (side-by-side) or 'unified' (single column)
   */
  viewType?: 'split' | 'unified';
  
  /**
   * Show/hide line numbers
   */
  showLineNumbers?: boolean;
}

interface LoadingState {
  original: string | null;
  transformed: string | null;
  loading: boolean;
  error: string | null;
}

export function DiffView({
  originalImport,
  transformedImport,
  title = "Code Transformation Diff",
  originalFileName = "original.tsx",
  transformedFileName = "transformed.tsx", 
  viewType = 'split',
  showLineNumbers = true
}: DiffViewProps) {
  const [state, setState] = useState<LoadingState>({
    original: null,
    transformed: null,
    loading: true,
    error: null
  });
  
  const [diffData, setDiffData] = useState<any>(null);

  // Load source code from the async imports
  useEffect(() => {
    const loadSources = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        // Load both sources in parallel
        const [originalResult, transformedResult] = await Promise.allSettled([
          loadSourceFromImport(originalImport),
          loadSourceFromImport(transformedImport)
        ]);
        
        const original = originalResult.status === 'fulfilled' 
          ? originalResult.value 
          : `// Error loading original:\n// ${originalResult.reason}`;
          
        const transformed = transformedResult.status === 'fulfilled'
          ? transformedResult.value
          : `// Error loading transformed:\n// ${transformedResult.reason}`;
        
        setState({
          original,
          transformed,
          loading: false,
          error: null
        });
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    };
    
    loadSources();
  }, [originalImport, transformedImport]);

  // Generate diff when sources are loaded
  useEffect(() => {
    if (state.original && state.transformed) {
      try {
        // Clean up the source strings first
        const cleanOriginal = state.original.trim();
        const cleanTransformed = state.transformed.trim();
        
        // Check if files are identical
        if (cleanOriginal === cleanTransformed) {
          setDiffData({
            oldRevision: originalFileName,
            newRevision: transformedFileName,
            type: 'modify',
            hunks: []
          });
          return;
        }
        
        // Try multiple approaches to fix parseDiff
        let diff = null;
        
        // Approach 1: Simple file names without prefixes
        try {
          const patch1 = createTwoFilesPatch(
            originalFileName,
            transformedFileName,
            cleanOriginal + '\n',
            cleanTransformed + '\n'
          );
          console.log('Approach 1 patch:', patch1);
          const diffFiles1 = parseDiff(patch1);
          if (diffFiles1 && diffFiles1.length > 0 && diffFiles1[0].hunks) {
            diff = diffFiles1[0];
            console.log('Approach 1 SUCCESS');
          }
        } catch (e) {
          console.log('Approach 1 failed:', e);
        }
        
        // Approach 2: If approach 1 failed, try with git-style paths
        if (!diff) {
          try {
            const patch2 = createTwoFilesPatch(
              `a/${originalFileName}`,
              `b/${transformedFileName}`,
              cleanOriginal + '\n',
              cleanTransformed + '\n',
              '',
              '',
              { context: 3 }
            );
            console.log('Approach 2 patch:', patch2);
            const diffFiles2 = parseDiff(patch2);
            if (diffFiles2 && diffFiles2.length > 0 && diffFiles2[0].hunks) {
              diff = diffFiles2[0];
              console.log('Approach 2 SUCCESS');
            }
          } catch (e) {
            console.log('Approach 2 failed:', e);
          }
        }
        
        // Approach 3: Manual diff creation as fallback
        if (!diff) {
          console.log('Using manual diff creation as fallback');
          const changes = diffLines(cleanOriginal, cleanTransformed);
          let oldLineNumber = 1;
          let newLineNumber = 1;
          const manualChanges = [];
          
          for (const change of changes) {
            const lines = change.value.split('\n').filter(line => line !== '');
            
            for (const line of lines) {
              if (change.added) {
                manualChanges.push({
                  type: 'insert',
                  content: line,
                  oldLineNumber: undefined,
                  newLineNumber: newLineNumber++
                });
              } else if (change.removed) {
                manualChanges.push({
                  type: 'delete',
                  content: line,
                  oldLineNumber: oldLineNumber++,
                  newLineNumber: undefined
                });
              } else {
                manualChanges.push({
                  type: 'normal',
                  content: line,
                  oldLineNumber: oldLineNumber++,
                  newLineNumber: newLineNumber++
                });
              }
            }
          }
          
          if (manualChanges.length > 0) {
            diff = {
              oldRevision: originalFileName,
              newRevision: transformedFileName,
              type: 'modify',
              hunks: [{
                oldStart: 1,
                oldLines: oldLineNumber - 1,
                newStart: 1,
                newLines: newLineNumber - 1,
                changes: manualChanges
              }]
            };
            console.log('Manual diff created successfully');
          }
        }
        
        setDiffData(diff);
        
      } catch (error) {
        console.error('Error generating diff:', error);
        setDiffData(null);
      }
    }
  }, [state.original, state.transformed, originalFileName, transformedFileName]);

  if (state.loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🔄</div>
        <div>Loading source files for comparison...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={{ 
        padding: '1rem', 
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe0e0'
      }}>
        <h4 style={{ color: '#d63031', marginTop: 0 }}>
          ⚠️ Error Loading Sources
        </h4>
        <pre style={{ 
          fontSize: '0.9rem',
          backgroundColor: '#f8f9fa',
          padding: '0.5rem',
          borderRadius: '4px'
        }}>
          {state.error}
        </pre>
      </div>
    );
  }

  if (!diffData) {
    return (
      <div style={{ 
        padding: '1rem',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        backgroundColor: '#fff3cd'
      }}>
        <h4 style={{ color: '#856404', marginTop: 0 }}>
          ⚠️ No Diff Available
        </h4>
        <p style={{ color: '#856404', margin: '0 0 1rem 0' }}>
          Could not generate diff from the loaded sources.
        </p>
        <details style={{ color: '#856404' }}>
          <summary style={{ cursor: 'pointer' }}>Debug Info</summary>
          <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Original loaded: {state.original ? 'Yes' : 'No'}
            Transformed loaded: {state.transformed ? 'Yes' : 'No'}
            Original length: {state.original?.length || 0}
            Transformed length: {state.transformed?.length || 0}
          </pre>
        </details>
      </div>
    );
  }

  const hunks = diffData.hunks || [];
  
  // Handle case where files are identical
  if (hunks.length === 0) {
    return (
      <div style={{ 
        padding: '1rem',
        border: '1px solid #28a745',
        borderRadius: '8px',
        backgroundColor: '#d4edda'
      }}>
        <h4 style={{ color: '#155724', marginTop: 0 }}>
          ✅ Files are Identical
        </h4>
        <p style={{ color: '#155724', margin: 0 }}>
          No differences found between the original and transformed files.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h3 style={{ 
          margin: 0,
          color: '#495057',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🔄</span>
          {title}
        </h3>
        <div style={{ 
          display: 'flex',
          gap: '2rem',
          marginTop: '0.5rem',
          fontSize: '0.9rem',
          color: '#6c757d'
        }}>
          <span>📄 {originalFileName}</span>
          <span>➜</span>
          <span>⚡ {transformedFileName}</span>
        </div>
      </div>

      {/* Diff Content */}
      <div style={{ overflow: 'auto', maxHeight: '600px' }}>
        {hunks.length > 0 ? (
          <Diff 
            viewType={viewType}
            diffType={diffData.type || "modify"}
            hunks={hunks}
            renderHunk={(hunk) => {
              // Validate hunk before rendering
              if (!hunk || !hunk.changes) {
                console.warn('Invalid hunk:', hunk);
                return null;
              }
              
              return (
                <Hunk 
                  key={getChangeKey(hunk)}
                  hunk={hunk}
                  showLineNumbers={showLineNumbers}
                />
              );
            }}
          >
            {/* Custom styling can be added here */}
          </Diff>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
            No changes to display
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '0.75rem 1rem',
        borderTop: '1px solid #dee2e6',
        fontSize: '0.85rem',
        color: '#6c757d'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>📊 {hunks.length} change block(s)</span>
          <span>➕ {countChanges(hunks, 'insert')} additions</span>
          <span>➖ {countChanges(hunks, 'delete')} deletions</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Load source code from an async import function
 */
async function loadSourceFromImport(importFn: () => Promise<any>): Promise<string> {
  try {
    // Try to load as a raw text import first (for ?raw imports)
    const module = await importFn();
    
    // If it's a string (raw import), return it directly
    if (typeof module === 'string') {
      return module;
    }
    
    // If it has a default export that's a string
    if (typeof module.default === 'string') {
      return module.default;
    }
    
    // Otherwise, try to get source from the module
    // This could be enhanced to extract source from React components
    return `// Could not extract source code from module
// Module exports: ${Object.keys(module).join(', ')}
// This import may need to use ?raw suffix for text content`;
    
  } catch (error) {
    throw new Error(`Failed to load source: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Count changes of a specific type in hunks
 */
function countChanges(hunks: any[], type: 'insert' | 'delete'): number {
  return hunks.reduce((total, hunk) => {
    return total + hunk.changes.filter((change: any) => change.type === type).length;
  }, 0);
}

/**
 * Enhanced diff view with toggle controls
 */
export function DiffViewWithControls(props: DiffViewProps) {
  const [viewType, setViewType] = useState<'split' | 'unified'>(props.viewType || 'split');
  const [showLineNumbers, setShowLineNumbers] = useState(props.showLineNumbers ?? true);

  return (
    <div>
      {/* Controls */}
      <div style={{ 
        marginBottom: '1rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        padding: '0.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '0.9rem'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <input
            type="checkbox"
            checked={showLineNumbers}
            onChange={(e) => setShowLineNumbers(e.target.checked)}
          />
          Line Numbers
        </label>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewType('split')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: viewType === 'split' ? '#007bff' : 'white',
              color: viewType === 'split' ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Split View
          </button>
          <button
            onClick={() => setViewType('unified')}
            style={{
              padding: '0.25rem 0.75rem', 
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: viewType === 'unified' ? '#007bff' : 'white',
              color: viewType === 'unified' ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Unified View
          </button>
        </div>
      </div>

      <DiffView 
        {...props}
        viewType={viewType}
        showLineNumbers={showLineNumbers}
      />
    </div>
  );
}