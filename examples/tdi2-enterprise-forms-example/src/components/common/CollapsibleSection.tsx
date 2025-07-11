import React from "react";

export interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  headerActions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'card';
  animationDuration?: number;
}

export function CollapsibleSection({
  id,
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  disabled = false,
  headerActions,
  variant = 'default',
  animationDuration = 300
}: CollapsibleSectionProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (disabled) return;
    
    setIsAnimating(true);
    onToggle(id);
    
    // Reset animation state
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return {
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          marginBottom: "20px",
        };
      case 'card':
        return {
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        };
      default:
        return {
          marginBottom: "20px",
        };
    }
  };

  const fieldsetStyle: React.CSSProperties = {
    ...getVariantStyles(),
    opacity: disabled ? 0.6 : 1,
    transition: `opacity ${animationDuration}ms ease`,
  };

  const legendStyle: React.CSSProperties = {
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: "bold",
    padding: "0 10px",
    fontSize: "16px",
    color: disabled ? "#6c757d" : "#333",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    userSelect: "none",
    transition: "color 0.2s ease",
  };

  const contentStyle: React.CSSProperties = {
    padding: variant === 'default' ? "15px" : "15px 20px",
    overflow: "hidden",
    transition: `max-height ${animationDuration}ms ease, opacity ${animationDuration}ms ease`,
    maxHeight: isExpanded ? "none" : "0",
    opacity: isExpanded ? 1 : 0,
  };

  const expandIconStyle: React.CSSProperties = {
    transition: `transform ${animationDuration}ms ease`,
    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
    fontSize: "12px",
    color: "#6c757d",
  };

  return (
    <fieldset style={fieldsetStyle}>
      <legend onClick={handleToggle} style={legendStyle}>
        {icon && <span style={{ fontSize: "18px" }}>{icon}</span>}
        <span style={{ flex: 1 }}>{title}</span>
        
        {headerActions && (
          <span onClick={(e) => e.stopPropagation()} style={{ marginRight: "8px" }}>
            {headerActions}
          </span>
        )}
        
        <span style={expandIconStyle}>
          {isExpanded ? "▼" : "▶"}
        </span>
      </legend>

      {/* Animated content container */}
      <div
        ref={contentRef}
        style={{
          maxHeight: isExpanded ? "none" : "0",
          overflow: "hidden",
          transition: `max-height ${animationDuration}ms ease`,
        }}
      >
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </fieldset>
  );
}

// Hook for managing multiple collapsible sections
export function useCollapsibleSections(initialSections: string[] = []) {
  const [expandedSections, setExpandedSections] = React.useState<string[]>(initialSections);

  const toggleSection = React.useCallback((sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  const expandSection = React.useCallback((sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) ? prev : [...prev, sectionId]
    );
  }, []);

  const collapseSection = React.useCallback((sectionId: string) => {
    setExpandedSections(prev => prev.filter(id => id !== sectionId));
  }, []);

  const expandAll = React.useCallback((sectionIds: string[]) => {
    setExpandedSections(sectionIds);
  }, []);

  const collapseAll = React.useCallback(() => {
    setExpandedSections([]);
  }, []);

  const isExpanded = React.useCallback((sectionId: string) => {
    return expandedSections.includes(sectionId);
  }, [expandedSections]);

  return {
    expandedSections,
    toggleSection,
    expandSection,
    collapseSection,
    expandAll,
    collapseAll,
    isExpanded,
  };
}