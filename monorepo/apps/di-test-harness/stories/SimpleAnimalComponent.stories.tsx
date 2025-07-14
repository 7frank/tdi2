import React, { useState, useEffect } from 'react';
import type { Story } from '@ladle/react';
import { Project } from 'ts-morph';

// Mock transformer - replace with your actual transformer import
// import { FunctionalDIEnhancedTransformer } from '../src/transformer/functional-di-enhanced-transformer';

const ORIGINAL_CODE = `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

export function SimpleAnimalComponent(props: {
  name: string;
  services: {
    animal: Inject<AnimalInterface>;
  };
}) {
  const { name, services } = props;
  
  const handleClick = () => {
    console.log(services.animal.speak());
  };
  
  return (
    <div>
      <h1>{name}</h1>
      <p>Animal: {services.animal.getName()}</p>
      <button onClick={handleClick}>Make Sound</button>
    </div>
  );
}
`.trim();

// Mock transformer class - replace with your actual implementation
class MockTransformer {
  constructor(options: any) {}
  
  async transformForBuild() {
    // Simulate transformation result
    const transformedCode = `
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from '@tdi2/di-core/context';

export function SimpleAnimalComponent(props: {
  name: string;
  services: {
    animal: Inject<AnimalInterface>;
  };
}) {
  const animal = useService('AnimalInterface');
  const services = { animal };
  const { name } = props;
  
  const handleClick = () => {
    console.log(services.animal.speak());
  };
  
  return (
    <div>
      <h1>{name}</h1>
      <p>Animal: {services.animal.getName()}</p>
      <button onClick={handleClick}>Make Sound</button>
    </div>
  );
}
    `.trim();
    
    return new Map([['src/SimpleAnimalComponent.tsx', transformedCode]]);
  }
}

const CodeDiff: React.FC<{ original: string; transformed: string }> = ({ original, transformed }) => {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px', margin: '20px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#d73a49' }}>Original Code</h3>
          <pre style={{ 
            background: '#f6f8fa', 
            padding: '15px', 
            overflow: 'auto', 
            maxHeight: '400px',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            margin: 0
          }}>
            {original}
          </pre>
        </div>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Transformed Code</h3>
          <pre style={{ 
            background: '#f6f8fa', 
            padding: '15px', 
            overflow: 'auto', 
            maxHeight: '400px',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            margin: 0
          }}>
            {transformed}
          </pre>
        </div>
      </div>
    </div>
  );
};

export const SimpleAnimalTransformation: Story = () => {
  const [transformedCode, setTransformedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const runTransformation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Replace MockTransformer with your actual transformer
      const transformer = new MockTransformer({
        srcDir: './src',
        verbose: false,
      });

      const transformedFiles = await transformer.transformForBuild();
      
      if (transformedFiles.size > 0) {
        const transformed = Array.from(transformedFiles.values())[0];
        setTransformedCode(transformed);
      } else {
        setError('No files were transformed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTransformation();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <h1>Simple Animal Component Transformation</h1>
      
      <p>
        This story shows how the functional DI transformer converts a React component 
        with <code>Inject&lt;T&gt;</code> markers into a component that uses DI hooks.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTransformation}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0366d6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isLoading ? 'Transforming...' : 'Run Transformation'}
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#ffeaea', 
          color: '#d73a49', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {transformedCode && (
        <CodeDiff original={ORIGINAL_CODE} transformed={transformedCode} />
      )}

      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          📋 Expected Transformations
        </summary>
        <div style={{ padding: '15px', background: '#f6f8fa', marginTop: '10px', borderRadius: '6px' }}>
          <ul>
            <li>✅ Add DI imports</li>
            <li>✅ Inject service hooks</li>
            <li>✅ Create services object</li>
            <li>✅ Update destructuring</li>
            <li>✅ Preserve original logic</li>
          </ul>
        </div>
      </details>
    </div>
  );
};

SimpleAnimalTransformation.storyName = 'Simple Animal Component';
