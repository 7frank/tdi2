// src/components/DICardBody.tsx - Separates explanation from implementation

import React from 'react';

interface DICardBodyProps {
  pattern: string;
  explanation: string;
  dependencies?: Array<{
    name: string;
    type: 'required' | 'optional';
    resolvedTo: string;
  }>;
  codeExample?: string;
  children: React.ReactNode;
  variant?: 'interface' | 'class' | 'generic' | 'async' | 'observable';
}

const variantColors = {
  interface: '#4CAF50',
  class: '#2196F3', 
  generic: '#9C27B0',
  async: '#FF9800',
  observable: '#E91E63',
};

export function DICardBody({ 
  pattern, 
  explanation, 
  dependencies = [],
  codeExample,
  children, 
  variant = 'interface' 
}: DICardBodyProps) {
  const accentColor = variantColors[variant];

  return (
    <div>
      {/* Explanation Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: `2px solid ${accentColor}20`
        }}>
          <span style={{ 
            backgroundColor: accentColor,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            marginRight: '12px'
          }}>
            PATTERN
          </span>
          <code style={{ 
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: '600',
            color: accentColor
          }}>
            {pattern}
          </code>
        </div>
        
        <p style={{ 
          margin: '0 0 16px 0', 
          lineHeight: '1.6',
          color: '#555',
          fontSize: '14px'
        }}>
          {explanation}
        </p>

        {/* Dependencies Table */}
        {dependencies.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '13px', 
              fontWeight: '600',
              color: '#333',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Dependencies
            </h4>
            <div style={{ 
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              {dependencies.map((dep, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '8px 12px',
                    borderBottom: index < dependencies.length - 1 ? '1px solid #e9ecef' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: dep.type === 'required' ? '#dc3545' : '#6c757d',
                      marginRight: '8px'
                    }} />
                    <code style={{ 
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#495057'
                    }}>
                      {dep.name}
                    </code>
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '10px',
                      color: '#6c757d',
                      textTransform: 'uppercase'
                    }}>
                      {dep.type}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#6c757d' }}>→</span>
                    <code style={{ 
                      marginLeft: '6px',
                      fontSize: '11px',
                      color: accentColor,
                      fontWeight: '600'
                    }}>
                      {dep.resolvedTo}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code Example */}
        {codeExample && (
          <details style={{ marginBottom: '16px' }}>
            <summary style={{ 
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: accentColor,
              marginBottom: '8px'
            }}>
              📝 View Code Example
            </summary>
            <pre style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '12px',
              margin: '8px 0 0 0',
              fontSize: '11px',
              lineHeight: '1.4',
              overflow: 'auto',
              color: '#495057'
            }}>
              <code>{codeExample}</code>
            </pre>
          </details>
        )}
      </div>

      {/* Implementation Section */}
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: `2px solid ${accentColor}20`
        }}>
          <span style={{ 
            backgroundColor: '#28a745',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            marginRight: '12px'
          }}>
            LIVE DEMO
          </span>
          <span style={{ 
            fontSize: '12px',
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            Interactive implementation below
          </span>
        </div>

        {/* Implementation Container */}
        <div style={{
          backgroundColor: 'white',
          border: `2px solid ${accentColor}30`,
          borderRadius: '8px',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60px',
            height: '60px',
            background: `linear-gradient(45deg, ${accentColor}10, transparent)`,
            borderRadius: '0 8px 0 60px',
            pointerEvents: 'none'
          }} />
          
          {/* The actual component implementation */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}