import React from 'react';
import type { ValidationError, ValidationWarning } from '../types/ValidationTypes';

interface ValidationDisplayProps {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  className?: string;
}

export function ValidationDisplay({ 
  errors, 
  warnings, 
  className = '' 
}: ValidationDisplayProps) {
  
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  const renderValidationItem = (
    item: ValidationError | ValidationWarning, 
    type: 'error' | 'warning',
    index: number
  ) => {
    const isError = type === 'error';
    const icon = isError ? '❌' : '⚠️';
    const itemClass = isError ? 'validation-error' : 'validation-warning';

    return (
      <div key={`${type}-${index}`} className={`validation-item ${itemClass}`}>
        <div className="validation-header">
          <span className="validation-icon">{icon}</span>
          <span className="validation-message">{item.message}</span>
        </div>
        
        {item.field && (
          <div className="validation-field">
            <strong>Field:</strong> {item.field}
          </div>
        )}
        
        {item.code && (
          <div className="validation-code">
            <strong>Code:</strong> {item.code}
          </div>
        )}
        
        {item.suggestion && (
          <div className="validation-suggestion">
            <strong>Suggestion:</strong> {item.suggestion}
          </div>
        )}
        
        {item.serverResponse && (
          <div className="validation-server-details">
            <details>
              <summary>Server Details</summary>
              <pre>{JSON.stringify(item.serverResponse, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  const groupedErrors = groupValidationsByCategory(errors);
  const groupedWarnings = groupValidationsByCategory(warnings);

  return (
    <div className={`validation-display ${className}`}>
      {errors.length > 0 && (
        <div className="validation-section errors">
          <h4 className="validation-section-title">
            <span className="section-icon">❌</span>
            Errors ({errors.length})
          </h4>
          <div className="validation-summary">
            Please correct the following errors before proceeding:
          </div>
          
          {Object.entries(groupedErrors).map(([category, categoryErrors]) => (
            <div key={category} className="validation-category">
              {category !== 'general' && (
                <h5 className="category-title">{category}</h5>
              )}
              {categoryErrors.map((error, index) => 
                renderValidationItem(error, 'error', index)
              )}
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="validation-section warnings">
          <h4 className="validation-section-title">
            <span className="section-icon">⚠️</span>
            Warnings ({warnings.length})
          </h4>
          <div className="validation-summary">
            The following items need attention but won't prevent submission:
          </div>
          
          {Object.entries(groupedWarnings).map(([category, categoryWarnings]) => (
            <div key={category} className="validation-category">
              {category !== 'general' && (
                <h5 className="category-title">{category}</h5>
              )}
              {categoryWarnings.map((warning, index) => 
                renderValidationItem(warning, 'warning', index)
              )}
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="validation-actions">
          <button 
            className="action-button highlight-errors"
            onClick={() => highlightFirstError()}
          >
            🎯 Jump to First Error
          </button>
          
          <button 
            className="action-button auto-fix"
            onClick={() => attemptAutoFix()}
            disabled={!hasAutoFixableErrors(errors)}
          >
            🔧 Auto-fix Common Issues
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function groupValidationsByCategory(
  items: (ValidationError | ValidationWarning)[]
): Record<string, (ValidationError | ValidationWarning)[]> {
  return items.reduce((groups, item) => {
    const category = item.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, (ValidationError | ValidationWarning)[]>);
}

function highlightFirstError(): void {
  const firstErrorField = document.querySelector('.form-field input.error, .form-field select.error');
  if (firstErrorField) {
    firstErrorField.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    (firstErrorField as HTMLElement).focus();
  }
}

function hasAutoFixableErrors(errors: ValidationError[]): boolean {
  const autoFixableCodes = [
    'PHONE_FORMAT',
    'ZIP_FORMAT', 
    'NAME_CASE',
    'EMAIL_TRIM'
  ];
  
  return errors.some(error => 
    autoFixableCodes.includes(error.code || '')
  );
}

function attemptAutoFix(): void {
  // This would be implemented by the validation service
  // For now, just show a message
  console.log('Auto-fix attempted - implementation would be in validation service');
}