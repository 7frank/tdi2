import React, { useState, useEffect } from 'react';
import type { Story } from '@ladle/react';

const ORIGINAL_CODE = `
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

export function MultiAnimalComponent(props: {
  shopName: string;
  services: {
    dog: Inject<AnimalInterface>;
    cat: Inject<AnimalInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const { shopName, services } = props;
  
  const showPets = () => {
    services.logger?.log('Showing pets');
    console.log('Dog says:', services.dog.speak());
    console.log('Cat says:', services.cat.speak());
  };
  
  return (
    <div>
      <h1>{shopName}</h1>
      <button onClick={showPets}>Show All Pets</button>
    </div>
  );
}
`.trim();

class MockTransformer {
  async transformForBuild() {
    const transformedCode = `
import React from 'react';
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from '@tdi2/di-core/context';

export function MultiAnimalComponent(props: {
  shopName: string;
  services: {
    dog: Inject<AnimalInterface>;
    cat: Inject<AnimalInterface>;
    logger?: InjectOptional<LoggerInterface>;
  };
}) {
  const dog = useService('AnimalInterface');
  const cat = useService('AnimalInterface');
  const logger = useOptionalService('LoggerInterface');
  const services = { dog, cat, logger };
  const { shopName } = props;
  
  const showPets = () => {
    services.logger?.log('Showing pets');
    console.log('Dog says:', services.dog.speak());
    console.log('Cat says:', services.cat.speak());
  };
  
  return (
    <div>
      <h1>{shopName}</h1>
      <button onClick={showPets}>Show All Pets</button>
    </div>
  );
}
    `.trim();
    
    return new Map([['src/MultiAnimalComponent.tsx', transformedCode]]);
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

export const MultiAnimalTransformation: Story = () => {
  const [transformedCode, setTransformedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runTransformation = async () => {
    setIsLoading(true);
    
    try {
      const transformer = new MockTransformer();
      const transformedFiles = await transformer.transformForBuild();
      
      if (transformedFiles.size > 0) {
        const transformed = Array.from(transformedFiles.values())[0];
        setTransformedCode(transformed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTransformation();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <h1>Multi-Animal Component Transformation</h1>
      
      <p>
        This story demonstrates transformation of a component with multiple services 
        including both required and optional dependencies.
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

      {transformedCode && (
        <CodeDiff original={ORIGINAL_CODE} transformed={transformedCode} />
      )}

      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          📋 Key Features Demonstrated
        </summary>
        <div style={{ padding: '15px', background: '#f6f8fa', marginTop: '10px', borderRadius: '6px' }}>
          <ul>
            <li>✅ Multiple required services (dog, cat)</li>
            <li>✅ Optional service handling (logger?)</li>
            <li>✅ Individual hook calls for each service</li>
            <li>✅ Combined services object creation</li>
            <li>✅ Proper destructuring update</li>
          </ul>
        </div>
      </details>
    </div>
  );
};

MultiAnimalTransformation.storyName = 'Multi-Animal Component';
