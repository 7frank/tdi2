import React, { useState } from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";

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
  const [showLegend, setShowLegend] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [lastClickedNode, setLastClickedNode] = useState<string | null>(null);

  // Business state from service (reactive via proxy)
  const { formNodes, currentNode, completedNodes, availableNodes, navigationHistory } = formDAG.state;
  
  // 🎨 VIEW STATE from service: Navigation UI coordination
  const { 
    isNavigating, 
    lastNavigationTime, 
    progressAnimationActive, 
    completionCelebrationActive 
  } = formDAG.state;

  // 🔧 UPDATED: Use smart progress calculation
  const progress = formDAG.calculateProgress();
  const navigationFeedback = formDAG.getNavigationFeedback();
  const completionStatus = formDAG.getCompletionStatus();
  const applicableForms = formDAG.getApplicableForms();

  const getNodeStatus = (nodeId: string) => {
    const applicableForm = applicableForms.find(f => f.id === nodeId);
    
    // If form is not applicable to current scenario, mark as not applicable
    if (!applicableForm) return "not_applicable";
    
    if (completedNodes.includes(nodeId)) return "completed";
    if (currentNode === nodeId) return "current";
    if (availableNodes.includes(nodeId)) return "available";
    return "disabled";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "current":
        return "⏳";
      case "available":
        return "🔓";
      case "disabled":
        return "🔒";
      case "not_applicable":
        return "⚪";
      default:
        return "⚪";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#28a745";
      case "current":
        return "#007bff";
      case "available":
        return "#6c757d";
      case "disabled":
        return "#adb5bd";
      case "not_applicable":
        return "#e9ecef";
      default:
        return "#dee2e6";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "current":
        return "Current";
      case "available":
        return "Available";
      case "disabled":
        return "Locked";
      case "not_applicable":
        return "N/A";
      default:
        return "Unknown";
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

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId); // 🎨 COMPONENT VIEW STATE
  };

  const nextOptimalNode = formDAG.getNextOptimalNode();
  const totalEstimatedTime = applicableForms.reduce((sum, node) => sum + node.estimatedTime, 0);
  const completedTime = applicableForms
    .filter(node => completedNodes.includes(node.id))
    .reduce((sum, node) => sum + node.estimatedTime, 0);

  // 🔧 NEW: Get progress message based on completion status
  const getProgressMessage = () => {
    switch(completionStatus) {
      case 'completed':
        return "🎉 Patient onboarding completed!";
      case 'ready_for_submit':
        return "✅ Ready for final submission";
      case 'in_progress':
        const completedApplicable = completedNodes.filter(nodeId => 
          applicableForms.some(form => form.id === nodeId)
        );
        return `${progress}% Complete (${completedApplicable.length}/${applicableForms.length} applicable forms)`;
    }
  };

  return (
    <div
      style={{
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
        transform: progressAnimationActive ? "scale(1.01)" : "scale(1)", // 🎨 VIEW STATE from service
        transition: "transform 0.3s ease",
      }}
    >
      {/* Header with Navigation Feedback */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, fontSize: "18px" }}>Form Progress</h3>
        
        {/* Navigation Status Indicator */}
        <div style={{
          padding: "6px 12px",
          background: isNavigating ? "#fff3cd" : 
                     completionStatus === 'completed' ? "#d4edda" : 
                     completionStatus === 'ready_for_submit' ? "#d1ecf1" : "#e3f2fd", // 🎨 VIEW STATE from service
          border: `1px solid ${isNavigating ? "#ffeaa7" : 
                              completionStatus === 'completed' ? "#c3e6cb" : 
                              completionStatus === 'ready_for_submit' ? "#bee5eb" : "#b3d9ff"}`,
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "bold",
          color: isNavigating ? "#856404" : 
                 completionStatus === 'completed' ? "#155724" : 
                 completionStatus === 'ready_for_submit' ? "#0c5460" : "#0d47a1",
          transform: completionCelebrationActive ? "scale(1.05)" : "scale(1)", // 🎨 VIEW STATE from service
          transition: "all 0.3s ease"
        }}>
          {navigationFeedback}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{ fontSize: "14px", fontWeight: "bold", color: "#007bff", cursor: "pointer" }}
            onClick={() => setShowProgressDetails(!showProgressDetails)} // 🎨 COMPONENT VIEW STATE
          >
            {getProgressMessage()}
            {showProgressDetails ? " 📊" : " 📈"}
          </span>
          
          {lastNavigationTime && (
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              Last updated: {lastNavigationTime.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div
          style={{
            width: "100%",
            height: "12px",
            background: "#e9ecef",
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: `linear-gradient(90deg, #007bff, ${progress === 100 ? "#28a745" : progress > 75 ? "#20c997" : "#17a2b8"})`,
              transition: "width 0.5s ease",
              borderRadius: "6px",
            }}
          />
          
          {/* Progress pulse animation */}
          {progressAnimationActive && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${progress}%`,
              height: "100%",
              background: "rgba(255, 255, 255, 0.3)",
              animation: "progressPulse 0.6s ease-out"
            }} />
          )}
        </div>

        {/* 🔧 UPDATED: Progress Details with applicable forms info */}
        {showProgressDetails && (
          <div style={{
            marginTop: "8px",
            padding: "12px",
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            fontSize: "12px"
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <div>📋 <strong>Applicable Forms:</strong> {applicableForms.length}</div>
                <div>✅ <strong>Completed:</strong> {completedNodes.filter(nodeId => 
                  applicableForms.some(form => form.id === nodeId)
                ).length}</div>
                <div>⏱️ <strong>Time Invested:</strong> ~{completedTime} minutes</div>
              </div>
              <div>
                <div>🎯 <strong>Completion Status:</strong> {completionStatus}</div>
                <div>📊 <strong>Progress:</strong> {progress}%</div>
                <div>⏳ <strong>Est. Remaining:</strong> ~{totalEstimatedTime - completedTime} minutes</div>
              </div>
            </div>
            
            {/* Show why some forms are not applicable */}
            {formNodes.length > applicableForms.length && (
              <div style={{ 
                marginTop: "10px", 
                paddingTop: "10px", 
                borderTop: "1px solid #f0f0f0",
                color: "#6c757d",
                fontSize: "11px"
              }}>
                💡 <strong>Note:</strong> Some forms are not applicable to your scenario (e.g., Guardian Consent for adults, Specialist Referral for HMO plans)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Steps Grid */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ margin: 0, fontSize: "16px" }}>Form Steps</h4>
          <button
            onClick={() => setShowLegend(!showLegend)} // 🎨 COMPONENT VIEW STATE
            style={{
              background: "none",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: "11px",
              color: "#6c757d"
            }}
          >
            {showLegend ? "Hide Legend" : "Show Legend"}
          </button>
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
            const isHovered = hoveredNode === node.id; // 🎨 COMPONENT VIEW STATE
            const wasRecentlyClicked = lastClickedNode === node.id; // 🎨 COMPONENT VIEW STATE

            return (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => handleNodeHover(node.id)}
                onMouseLeave={() => handleNodeHover(null)}
                style={{
                  padding: "12px",
                  border: `2px solid ${getStatusColor(status)}`,
                  borderRadius: "8px",
                  background: status === "current" ? "#e3f2fd" : 
                             status === "not_applicable" ? "#f8f9fa" :
                             wasRecentlyClicked ? "#fff3cd" : 
                             isHovered && isClickable ? "#f8f9fa" : "white", // 🎨 COMPONENT VIEW STATE
                  cursor: isClickable ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  opacity: status === "disabled" || status === "not_applicable" ? 0.6 : 1,
                  transform: isHovered && isClickable ? "translateY(-2px)" : 
                           wasRecentlyClicked ? "scale(0.98)" : "translateY(0)", // 🎨 COMPONENT VIEW STATE
                  boxShadow: isHovered && isClickable ? "0 4px 8px rgba(0,0,0,0.1)" : "none",
                  position: "relative"
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
                    {getStatusLabel(status)}
                  </span>
                </div>
                
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: status === "disabled" || status === "not_applicable" ? "#6c757d" : "#333",
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
                  {status === "not_applicable" && (
                    <span style={{ color: "#6c757d", fontSize: "10px" }}>
                      N/A
                    </span>
                  )}
                </div>

                {/* Hover tooltip */}
                {isHovered && (
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
                    {status === "not_applicable" ? "Not required for your scenario" :
                     status === "disabled" && node.dependencies.length > 0 ? `Requires: ${node.dependencies.join(", ")}` :
                     status === "available" ? "Click to navigate" :
                     status === "completed" ? "Click to review" :
                     "Current form"}
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
            <button
              onClick={() => {
                handleNodeClick(nextOptimalNode);
              }}
              disabled={isNavigating} // 🎨 VIEW STATE from service
              style={{
                padding: "8px 16px",
                background: isNavigating ? "#6c757d" : 
                           completionStatus === 'ready_for_submit' ? "#17a2b8" : "#28a745", // 🎨 VIEW STATE from service
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isNavigating ? "not-allowed" : "pointer",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isNavigating ? (
                <>
                  <span style={{ 
                    width: "12px", 
                    height: "12px", 
                    border: "2px solid transparent", 
                    borderTop: "2px solid #fff", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite" 
                  }} />
                  Navigating...
                </>
              ) : (
                <>
                  {nextOptimalNode === 'final_submit' ? '🎯 Review & Submit' : 
                   `Next: ${formNodes.find((n) => n.id === nextOptimalNode)?.title}`}
                  →
                </>
              )}
            </button>
          )}
          
          {completionStatus === 'completed' && (
            <button
              style={{
                padding: "8px 16px",
                background: "linear-gradient(45deg, #28a745, #20c997)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                transform: completionCelebrationActive ? "scale(1.05)" : "scale(1)", // 🎨 VIEW STATE from service
                transition: "transform 0.3s ease"
              }}
              onClick={() => formDAG.celebrateCompletion()}
            >
              🎉 Registration Complete!
            </button>
          )}
          
          {completionStatus === 'ready_for_submit' && !nextOptimalNode && (
            <button
              onClick={() => formDAG.navigateToNode('final_submit')}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(45deg, #007bff, #0056b3)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(0, 123, 255, 0.3)"
              }}
            >
              🎯 Final Submission
            </button>
          )}
        </div>
      </div>

      {/* 🔧 UPDATED: Legend with not applicable status */}
      {showLegend && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
            border: "1px solid #dee2e6",
          }}
        >
          <div
            style={{ fontSize: "12px", color: "#6c757d", marginBottom: "10px" }}
          >
            <strong>Status Legend:</strong>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⚪</span> <span>Not Applicable</span>
            </div>
          </div>
          
          <div style={{ 
            marginTop: "8px", 
            paddingTop: "8px", 
            borderTop: "1px solid #f0f0f0",
            fontSize: "10px",
            color: "#adb5bd"
          }}>
            💡 <strong>Smart Progress:</strong> Only applicable forms count toward 100% completion
            <br />
            🎯 <strong>Examples:</strong> Guardian Consent (minors only), Specialist Referral (PPO/POS plans only)
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes progressPulse {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}