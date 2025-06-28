// src/components/DIExampleCard.tsx - Card component for DI examples

import React from 'react';

interface DIExampleCardProps {
  title: string;
  description: string;
  diPattern: string;
  children: React.ReactNode;
  variant?: 'interface' | 'class' | 'generic' | 'async' | 'observable';
}

const variantStyles = {
  interface: {
    border: '2px solid #4CAF50',
    backgroundColor: '#f8f9fa',
    accentColor: '#4CAF50',
  },
  class: {
    border: '2px solid #2196F3',
    backgroundColor: '#e3f2fd',
    accentColor: '#2196F3',
  },
  generic: {
    border: '2px solid #9C27B0',
    backgroundColor: '#f3e5f5',
    accentColor: '#9C27B0',
  },
  async: {
    border: '2px solid #FF9800',
    backgroundColor: '#fff3e0',
    accentColor: '#FF9800',
  },
  observable: {
    border: '2px solid #E91E63',
    backgroundColor: '#fce4ec',
    accentColor: '#E91E63',
  },
};

export function DIExampleCard({ 
  title, 
  description, 
  diPattern, 
  children, 
  variant = 'interface' 
}: DIExampleCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      style={{
        border: styles.border,
        borderRadius: '12px',
        margin: '16px 0',
        backgroundColor: styles.backgroundColor,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: styles.accentColor,
          color: 'white',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>
          {description}
        </p>
        <div
          style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: '500',
          }}
        >
          {diPattern}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>
        {children}
      </div>

      {/* Footer with DI indicator */}
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          fontSize: '11px',
          color: '#666',
          fontFamily: 'monospace',
        }}
      >
        🔧 Powered by TDI2 Interface-Based Dependency Injection
      </div>
    </div>
  );
}