import React from "react";

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationErrorsProps {
  errors: ValidationError[];
  title?: string;
  showIcon?: boolean;
  groupByField?: boolean;
  maxVisible?: number;
  collapsible?: boolean;
  variant?: 'inline' | 'summary' | 'tooltip' | 'sidebar';
  onErrorClick?: (error: ValidationError) => void;
  className?: string;
}

export function ValidationErrors({
  errors,
  title = "Please fix the following errors:",
  showIcon = true,
  groupByField = false,
  maxVisible,
  collapsible = false,
  variant = 'summary',
  onErrorClick,
  className = ""
}: ValidationErrorsProps) {
  const [isExpanded, setIsExpanded] = React.useState(!collapsible);
  const [showAll, setShowAll] = React.useState(false);

  if (!errors || errors.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: ValidationError['severity']) => {
    const icons = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[severity];
  };

  const getSeverityColor = (severity: ValidationError['severity']) => {
    const colors = {
      error: "#721c24",
      warning: "#856404",
      info: "#0d47a1",
    };
    return colors[severity];
  };

  const getVariantStyles = () => {
    const variants = {
      inline: {
        background: "#f8d7da",
        border: "1px solid #f5c6cb",
        borderRadius: "4px",
        padding: "8px 12px",
        fontSize: "12px",
        marginTop: "5px",
      },
      summary: {
        background: "#f8d7da",
        border: "1px solid #f5c6cb",
        borderRadius: "8px",
        padding: "15px",
        marginTop: "20px",
      },
      tooltip: {
        background: "#333",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "10px 12px",
        fontSize: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        position: "absolute" as const,
        zIndex: 1000,
        maxWidth: "300px",
      },
      sidebar: {
        background: "#fff8f8",
        border: "1px solid #f5c6cb",
        borderRadius: "8px",
        padding: "20px",
        position: "sticky" as const,
        top: "20px",
        maxHeight: "400px",
        overflowY: "auto" as const,
      },
    };
    return variants[variant];
  };

  const processErrors = () => {
    if (groupByField) {
      const grouped = errors.reduce((acc, error) => {
        const field = error.field || 'general';
        if (!acc[field]) acc[field] = [];
        acc[field].push(error);
        return acc;
      }, {} as Record<string, ValidationError[]>);
      return grouped;
    }
    
    const visibleErrors = maxVisible && !showAll 
      ? errors.slice(0, maxVisible) 
      : errors;
    
    return { general: visibleErrors };
  };

  const errorGroups = processErrors();
  const totalErrors = errors.length;
  const hasMoreErrors = maxVisible && totalErrors > maxVisible && !showAll;

  const containerStyle: React.CSSProperties = {
    ...getVariantStyles(),
    ...(variant === 'tooltip' && { color: "white" }),
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: variant === 'inline' ? "12px" : "14px",
    fontWeight: "bold",
    color: variant === 'tooltip' ? "white" : "#721c24",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: errorGroups.general?.length > 0 ? "10px" : "0",
  };

  const errorListStyle: React.CSSProperties = {
    margin: "0",
    paddingLeft: variant === 'inline' ? "15px" : "20px",
    fontSize: variant === 'inline' ? "11px" : "12px",
    color: variant === 'tooltip' ? "rgba(255,255,255,0.9)" : "#721c24",
  };

  const errorItemStyle: React.CSSProperties = {
    marginBottom: "4px",
    cursor: onErrorClick ? "pointer" : "default",
    transition: "color 0.2s ease",
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: "12px",
  };

  const fieldTitleStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: variant === 'tooltip' ? "white" : "#495057",
    marginBottom: "4px",
    textTransform: "capitalize" as const,
  };

  const toggleButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: variant === 'tooltip' ? "rgba(255,255,255,0.8)" : "#007bff",
    cursor: "pointer",
    fontSize: "12px",
    marginTop: "8px",
    textDecoration: "underline",
    padding: "0",
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\./g, ' → ');
  };

  const renderErrors = (errorList: ValidationError[], fieldName?: string) => (
    <ul style={errorListStyle}>
      {errorList.map((error, index) => (
        <li
          key={`${error.field}-${index}`}
          style={errorItemStyle}
          onClick={() => onErrorClick?.(error)}
          onMouseEnter={(e) => {
            if (onErrorClick) {
              e.currentTarget.style.color = variant === 'tooltip' ? "white" : "#007bff";
            }
          }}
          onMouseLeave={(e) => {
            if (onErrorClick) {
              e.currentTarget.style.color = variant === 'tooltip' ? "rgba(255,255,255,0.9)" : "#721c24";
            }
          }}
        >
          <span style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
            {showIcon && (
              <span style={{ fontSize: "10px", marginTop: "1px" }}>
                {getSeverityIcon(error.severity)}
              </span>
            )}
            <span style={{ flex: 1 }}>
              {!groupByField && fieldName !== 'general' && (
                <strong>{formatFieldName(error.field)}: </strong>
              )}
              {error.message}
              {error.code && variant !== 'inline' && (
                <span style={{ 
                  fontSize: "10px", 
                  opacity: 0.7, 
                  marginLeft: "4px",
                  fontFamily: "monospace" 
                }}>
                  ({error.code})
                </span>
              )}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div style={containerStyle} className={className} role="alert">
      {/* Header with title and collapse toggle */}
      <div style={titleStyle}>
        {showIcon && (
          <span style={{ fontSize: variant === 'inline' ? "14px" : "18px" }}>
            ❌
          </span>
        )}
        <span style={{ flex: 1 }}>
          {title}
          {variant !== 'inline' && (
            <span style={{ fontWeight: "normal", marginLeft: "8px" }}>
              ({totalErrors} {totalErrors === 1 ? 'error' : 'errors'})
            </span>
          )}
        </span>
        
        {collapsible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: variant === 'tooltip' ? "white" : "#721c24",
              padding: "0",
            }}
            aria-label={isExpanded ? "Collapse errors" : "Expand errors"}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
      </div>

      {/* Error content */}
      {isExpanded && (
        <>
          {groupByField ? (
            // Grouped by field
            Object.entries(errorGroups).map(([fieldName, fieldErrors]) => (
              <div key={fieldName} style={fieldGroupStyle}>
                {fieldName !== 'general' && (
                  <div style={fieldTitleStyle}>
                    {formatFieldName(fieldName)}
                  </div>
                )}
                {renderErrors(fieldErrors, fieldName)}
              </div>
            ))
          ) : (
            // Simple list
            renderErrors(errorGroups.general || [])
          )}

          {/* Show more/less toggle */}
          {hasMoreErrors && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={toggleButtonStyle}
            >
              {showAll 
                ? `Show less (hiding ${totalErrors - maxVisible!} errors)` 
                : `Show all ${totalErrors} errors`
              }
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Preset validation error variants
export const InlineValidationErrors = (props: Omit<ValidationErrorsProps, 'variant'>) => (
  <ValidationErrors {...props} variant="inline" showIcon={false} />
);

export const SummaryValidationErrors = (props: Omit<ValidationErrorsProps, 'variant'>) => (
  <ValidationErrors {...props} variant="summary" groupByField={true} collapsible={true} />
);

export const TooltipValidationErrors = (props: Omit<ValidationErrorsProps, 'variant'>) => (
  <ValidationErrors {...props} variant="tooltip" maxVisible={3} />
);

export const SidebarValidationErrors = (props: Omit<ValidationErrorsProps, 'variant'>) => (
  <ValidationErrors {...props} variant="sidebar" groupByField={true} maxVisible={10} />
);