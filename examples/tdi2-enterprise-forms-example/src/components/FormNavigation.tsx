import type { Inject } from "@tdi2/di-core/markers";
import type { FormDAGServiceInterface } from "../services/FormDAGService";

interface FormNavigationProps {
  services: {
    formDAG: Inject<FormDAGServiceInterface>;
  };
}

export function FormNavigation(p: FormNavigationProps) {
  const { services } = p;
  const { formDAG } = services;
  const { formNodes, currentNode, completedNodes, availableNodes } =
    formDAG.state;
  const progress = formDAG.calculateProgress();

  const getNodeStatus = (nodeId: string) => {
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
      default:
        return "#dee2e6";
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const status = getNodeStatus(nodeId);
    if (status === "available" || status === "completed") {
      formDAG.navigateToNode(nodeId);
    }
  };

  const nextOptimalNode = formDAG.getNextOptimalNode();

  return (
    <div
      style={{
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
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
          <h3 style={{ margin: 0, fontSize: "18px" }}>Form Progress</h3>
          <span
            style={{ fontSize: "14px", fontWeight: "bold", color: "#007bff" }}
          >
            {progress}% Complete
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#e9ecef",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #007bff, #28a745)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Form Steps */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>Form Steps</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          {formNodes.map((node) => {
            const status = getNodeStatus(node.id);
            const isClickable =
              status === "available" || status === "completed";

            return (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                style={{
                  padding: "12px",
                  border: `2px solid ${getStatusColor(status)}`,
                  borderRadius: "6px",
                  background: status === "current" ? "#e3f2fd" : "white",
                  cursor: isClickable ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  opacity: status === "disabled" ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>
                    {getStatusIcon(status)}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: getStatusColor(status),
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    {status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  {node.title}
                </div>
                <div style={{ fontSize: "12px", color: "#6c757d" }}>
                  Est. {node.estimatedTime} min
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "15px",
          borderTop: "1px solid #dee2e6",
        }}
      >
        <div>
          <span style={{ fontSize: "14px", color: "#6c757d" }}>
            Current:{" "}
            <strong>
              {formNodes.find((n) => n.id === currentNode)?.title}
            </strong>
          </span>
        </div>

        {nextOptimalNode && nextOptimalNode !== currentNode && (
          <button
            onClick={() => formDAG.navigateToNode(nextOptimalNode)}
            style={{
              padding: "8px 16px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Next: {formNodes.find((n) => n.id === nextOptimalNode)?.title}
          </button>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "15px",
          padding: "10px",
          background: "#fff",
          borderRadius: "4px",
          border: "1px solid #dee2e6",
        }}
      >
        <div
          style={{ fontSize: "12px", color: "#6c757d", marginBottom: "8px" }}
        >
          <strong>Legend:</strong>
        </div>
        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>✅</span> <span>Completed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>⏳</span> <span>Current</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>🔓</span> <span>Available</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>🔒</span> <span>Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
