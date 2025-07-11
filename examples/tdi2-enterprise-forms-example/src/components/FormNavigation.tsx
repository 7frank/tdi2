import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";
import {
  Alert,
  LoadingButton,
  ProgressBar,
  CollapsibleSection,
  useCollapsibleSections
} from "../components/common";

interface FormNavigationProps {
  services: {
    formDAG: Inject<FormDAGServiceInterface>;
  };
}

export function FormNavigation(props: FormNavigationProps) {
  const {
    services: { formDAG },
  } = props;

  // 🎨 COMPONENT VIEW STATE: UI-only interactions (ephemeral, component-specific)
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
  const [lastClickedNode, setLastClickedNode] = React.useState<string | null>(null);
  const { isExpanded, toggleSection } = useCollapsibleSections(['legend']);

  // Business state from service (reactive via proxy)
  const { formNodes, currentNode, completedNodes, availableNodes, navigationHistory } = formDAG.state;
  
  // 🎨 VIEW STATE from service: Navigation UI coordination
  const { 
    isNavigating, 
    lastNavigationTime, 
    progressAnimationActive, 
    completionCelebrationActive 
  } = formDAG.state;

  const progress = formDAG.calculateProgress();
  const navigationFeedback = formDAG.getNavigationFeedback();

  const getNodeStatus = (nodeId: string) => {
    if (completedNodes.includes(nodeId)) return "completed";
    if (currentNode === nodeId) return "current";
    if (availableNodes.includes(nodeId)) return "available";
    return "disabled";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "current": return "⏳";
      case "available": return "🔓";
      case "disabled": return "🔒";
      default: return "⚪";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#28a745";
      case "current": return "#007bff";
      case "available": return "#6c757d";
      case "disabled": return "#adb5bd";
      default: return "#dee2e6";
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const status = getNodeStatus(nodeId);
    if (status === "available" || status === "completed") {
      // 🎨 COMPONENT VIEW STATE: Visual feedback for click
      setLastClickedNode(nodeId);
      setTimeout(() => setLastClickedNode(null), 300);
      
      formDAG.navigateToNode(nodeId);
    }
  };

  const nextOptimalNode = formDAG.getNextOptimalNode();
  const totalEstimatedTime = formNodes.reduce((sum, node) => sum + node.estimatedTime, 0);
  const completedTime = formNodes
    .filter(node => completedNodes.includes(node.id))
    .reduce((sum, node) => sum + node.estimatedTime, 0);

  const containerStyle: React.CSSProperties = {
    background: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    transform: progressAnimationActive ? "scale(1.01)" : "scale(1)", // 🎨 VIEW STATE from service
    transition: "transform 0.3s ease",
  };

  return (
    <div style={containerStyle}>
      {/* Header with Navigation Feedback */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, fontSize: "18px" }}>Form Progress</h3>
        
        {/* Navigation Status using Alert component */}
        <Alert
          type={isNavigating ? "warning" : completionCelebrationActive ? "success" : "info"}
          title={navigationFeedback}
          variant="subtle"
          size="small"
        />
      </div>

      {/* Progress Bar using our component */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <LoadingButton
            isLoading={false}
            loadingText=""
            variant="info"
            size="small"
            onClick={() => toggleSection('details')}
          >
            {progress}% Complete {isExpanded('details') ? "📊" : "📈"}
          </LoadingButton>
          
          {lastNavigationTime && (
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Last updated: {lastNavigationTime.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <ProgressBar
          progress={progress}
          animated={progressAnimationActive}
          showPercentage={false}
          color={progress > 75 ? "success" : "primary"}
          size="medium"
          pulse={progressAnimationActive}
        />

        {/* Progress Details - Collapsible */}
        <CollapsibleSection
          id="details"
          title=""
          isExpanded={isExpanded('details')}
          onToggle={toggleSection}
          variant="default"
        >
          <div style={{ 
            padding: "8px",
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            fontSize: "12px"
          }}>
            <div>✅ Completed: {completedNodes.length} / {formNodes.length} forms</div>
            <div>⏱️ Time spent: ~{completedTime} minutes</div>
            <div>📊 Estimated remaining: ~{totalEstimatedTime - completedTime} minutes</div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Form Steps Grid */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ margin: 0, fontSize: "16px" }}>Form Steps</h4>
          <LoadingButton
            isLoading={false}
            loadingText=""
            variant="secondary"
            size="small"
            onClick={() => toggleSection('legend')}
          >
            {isExpanded('legend') ? "Hide Legend" : "Show Legend"}
          </LoadingButton>
        </div>
        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {formNodes.map((node) => {
            const status = getNodeStatus(node.id);
            const isClickable = status === "available" || status === "completed";
            const isHovered = hoveredNode === node.id;
            const wasRecentlyClicked = lastClickedNode === node.id;

            return (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  padding: "12px",
                  border: `2px solid ${getStatusColor(status)}`,
                  borderRadius: "8px",
                  background: status === "current" ? "#e3f2fd" : 
                             wasRecentlyClicked ? "#fff3cd" : 
                             isHovered && isClickable ? "#f8f9fa" : "white",
                  cursor: isClickable ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  opacity: status === "disabled" ? 0.6 : 1,
                  transform: isHovered && isClickable ? "translateY(-2px)" : 
                           wasRecentlyClicked ? "scale(0.98)" : "translateY(0)",
                  boxShadow: isHovered && isClickable ? "0 4px 8px rgba(0,0,0,0.1)" : "none",
                  position: "relative" as const,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>
                    {getStatusIcon(status)}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: getStatusColor(status),
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      background: `${getStatusColor(status)}20`,
                      borderRadius: "10px",
                    }}
                  >
                    {status}
                  </span>
                </div>
                
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: status === "disabled" ? "#6c757d" : "#333",
                  }}
                >
                  {node.title}
                </div>
                
                <div style={{ 
                  fontSize: "12px", 
                  color: "#6c757d",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>Est. {node.estimatedTime} min</span>
                  {status === "completed" && (
                    <span style={{ color: "#28a745", fontSize: "10px" }}>
                      ✓ Done
                    </span>
                  )}
                </div>

                {/* Hover tooltip for dependencies */}
                {isHovered && node.dependencies.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#333",
                    color: "white",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    whiteSpace: "nowrap",
                    zIndex: 1000,
                    marginTop: "4px"
                  }}>
                    Requires: {node.dependencies.join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "15px",
          borderTop: "1px solid #dee2e6",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "14px", color: "#6c757d" }}>
            Current: <strong>{formNodes.find((n) => n.id === currentNode)?.title}</strong>
          </span>
          {navigationHistory.length > 1 && (
            <span style={{ fontSize: "11px", color: "#adb5bd" }}>
              Path: {navigationHistory.slice(-3).map(nodeId => 
                formNodes.find(n => n.id === nodeId)?.title
              ).join(" → ")}
              {navigationHistory.length > 3 && "..."}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {nextOptimalNode && nextOptimalNode !== currentNode && (
            <LoadingButton
              isLoading={isNavigating}
              loadingText="Navigating..."
              variant="success"
              onClick={() => handleNodeClick(nextOptimalNode)}
              disabled={isNavigating}
            >
              Next: {formNodes.find((n) => n.id === nextOptimalNode)?.title} →
            </LoadingButton>
          )}
          
          {progress === 100 && (
            <LoadingButton
              isLoading={false}
              loadingText=""
              variant="success"
              onClick={() => formDAG.celebrateCompletion()}
            >
              🎉 All Complete!
            </LoadingButton>
          )}
        </div>
      </div>

      {/* Legend */}
      <CollapsibleSection
        id="legend"
        title="Status Legend"
        isExpanded={isExpanded('legend')}
        onToggle={toggleSection}
        variant="default"
      >
        <div
          style={{
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
            border: "1px solid #dee2e6",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "8px",
              fontSize: "11px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>✅</span> <span>Completed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⏳</span> <span>Current</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🔓</span> <span>Available</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🔒</span> <span>Locked</span>
            </div>
          </div>
          
          <div style={{ 
            marginTop: "8px", 
            paddingTop: "8px", 
            borderTop: "1px solid #f0f0f0",
            fontSize: "10px",
            color: "#adb5bd"
          }}>
            💡 Tip: Hover over locked forms to see their requirements
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}