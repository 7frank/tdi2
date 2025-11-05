// src/utils/StoryErrorBoundary.tsx
import React from 'react';

interface StoryErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface StoryErrorBoundaryProps {
  children: React.ReactNode;
  storyName?: string;
}

export class StoryErrorBoundary extends React.Component<StoryErrorBoundaryProps, StoryErrorBoundaryState> {
  constructor(props: StoryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): StoryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Story Error (${this.props.storyName || 'Unknown'}):`, error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '24px', 
          border: '2px solid #ff6b6b', 
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          margin: '16px',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#d63031', marginTop: 0 }}>
            ⚠️ Story Error: {this.props.storyName || 'Unknown Story'}
          </h2>
          <details style={{ marginBottom: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details
            </summary>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.message}
            </pre>
          </details>
          
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Stack Trace
            </summary>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '10px',
              maxHeight: '200px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
            <strong>💡 Tip:</strong> This story has a compilation error. 
            Check the DI transformation output or fix the component manually.
            Other stories should still work normally.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper function to wrap stories
export function withStoryErrorBoundary<T extends Record<string, any>>(
  stories: T, 
  storyName?: string
): T {
  const wrappedStories = {} as T;
  
  Object.entries(stories).forEach(([key, Story]) => {
    if (typeof Story === 'function') {
      wrappedStories[key as keyof T] = ((props: any) => (
        <StoryErrorBoundary storyName={storyName || key}>
          <Story {...props} />
        </StoryErrorBoundary>
      )) as T[keyof T];
    } else {
      wrappedStories[key as keyof T] = Story;
    }
  });
  
  return wrappedStories;
}