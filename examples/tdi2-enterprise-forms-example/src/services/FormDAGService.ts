import { Service } from "@tdi2/di-core/decorators";
import type {
  FormNode,
  Condition,
  PatientDemographics,
  InsuranceInformation,
} from "../types/form-models";

export interface FormDAGServiceInterface {
  state: {
    currentNode: string;
    completedNodes: string[];
    availableNodes: string[];
    formNodes: FormNode[];
    formData: {
      demographics?: PatientDemographics;
      insurance?: InsuranceInformation;
      [key: string]: any;
    };
    navigationHistory: string[];
    
    // 🎨 VIEW STATE: Navigation UI feedback (could be in component)
    isNavigating: boolean;
    lastNavigationTime: Date | null;
    progressAnimationActive: boolean;
    completionCelebrationActive: boolean;
  };

  completeNode(nodeId: string): Promise<void>;
  navigateToNode(nodeId: string): boolean;
  getAvailableNodes(): FormNode[];
  canAccessNode(nodeId: string): boolean;
  calculateProgress(): number;
  getNextOptimalNode(): string | null;
  
  // 🎨 VIEW STATE: UI-specific methods
  triggerProgressAnimation(): void;
  celebrateCompletion(): void;
  getNavigationFeedback(): string;
}

@Service()
export class FormDAGService implements FormDAGServiceInterface {
  state = {
    currentNode: "demographics",
    completedNodes: [] as string[],
    availableNodes: ["demographics"] as string[],
    formNodes: [
      {
        id: "demographics",
        title: "Demographics",
        dependencies: [],
        conditions: [],
        isCompleted: false,
        isAvailable: true,
        estimatedTime: 5,
      },
      {
        id: "insurance",
        title: "Insurance Information",
        dependencies: ["demographics"],
        conditions: [],
        isCompleted: false,
        isAvailable: false,
        estimatedTime: 8,
      },
      {
        id: "guardian_consent",
        title: "Guardian Consent",
        dependencies: ["demographics"],
        conditions: [{ field: "demographics.age", operator: "lt", value: 18 }],
        isCompleted: false,
        isAvailable: false,
        estimatedTime: 3,
      },
      {
        id: "medical_history",
        title: "Medical History",
        dependencies: ["demographics"],
        conditions: [],
        isCompleted: false,
        isAvailable: false,
        estimatedTime: 10,
      },
      {
        id: "specialist_referral",
        title: "Specialist Referral",
        dependencies: ["medical_history", "insurance"],
        conditions: [
          {
            field: "insurance.primaryInsurance.planType",
            operator: "in",
            value: ["PPO", "POS"],
          },
        ],
        isCompleted: false,
        isAvailable: false,
        estimatedTime: 6,
      },
      {
        id: "emergency_contacts",
        title: "Emergency Contacts",
        dependencies: ["demographics"],
        conditions: [],
        isCompleted: false,
        isAvailable: false,
        estimatedTime: 4,
      },
      {
        id: "hipaa_consent",
        title: "HIPAA Consent",
        dependencies: ["demographics", "insurance", "medical_history"],
        conditions: [],
        isCompleted: false,
        isAvailable: false,
        estimatedTime: 5,
      },
      {
        id: "financial_responsibility",
        title: "Financial Responsibility",
        dependencies: ["insurance"],
        conditions: [],
        isCompleted: false,
        isAvailable: false,
        estimatedTime: 7,
      },
    ] as FormNode[],
    formData: {} as any,
    navigationHistory: ["demographics"] as string[],
    
    // 🎨 VIEW STATE: Navigation UI feedback
    isNavigating: false,
    lastNavigationTime: null as Date | null,
    progressAnimationActive: false,
    completionCelebrationActive: false,
  };

  async completeNode(nodeId: string): Promise<void> {
    if (!this.state.completedNodes.includes(nodeId)) {
      this.state.completedNodes.push(nodeId);
      
      // 🎨 VIEW STATE: Trigger completion celebration
      this.celebrateCompletion();
    }

    // Update node completion status
    const node = this.state.formNodes.find((n) => n.id === nodeId);
    if (node) {
      node.isCompleted = true;
    }

    // Recalculate available nodes
    this.updateAvailableNodes();
    
    // 🎨 VIEW STATE: Trigger progress animation
    this.triggerProgressAnimation();
  }

  navigateToNode(nodeId: string): boolean {
    if (!this.canAccessNode(nodeId)) {
      return false;
    }

    // 🎨 VIEW STATE: Navigation feedback
    this.state.isNavigating = true;
    this.state.lastNavigationTime = new Date();

    this.state.currentNode = nodeId;
    this.state.navigationHistory.push(nodeId);
    
    // 🎨 VIEW STATE: Reset navigation state after animation
    setTimeout(() => {
      this.state.isNavigating = false;
    }, 500);

    return true;
  }

  getAvailableNodes(): FormNode[] {
    return this.state.formNodes.filter((node) => node.isAvailable);
  }

  canAccessNode(nodeId: string): boolean {
    const node = this.state.formNodes.find((n) => n.id === nodeId);
    if (!node) return false;

    // Check if all dependencies are completed
    const dependenciesMet = node.dependencies.every((depId) =>
      this.state.completedNodes.includes(depId)
    );

    if (!dependenciesMet) return false;

    // Check conditions
    return this.evaluateConditions(node.conditions);
  }

  calculateProgress(): number {
    const totalNodes = this.state.formNodes.length;
    const completedCount = this.state.completedNodes.length;
    return Math.round((completedCount / totalNodes) * 100);
  }

  getNextOptimalNode(): string | null {
    const availableNodes = this.getAvailableNodes().filter(
      (n) => !n.isCompleted
    );
    if (availableNodes.length === 0) return null;

    // Prioritize by shortest estimated time
    const sortedByTime = availableNodes.sort(
      (a, b) => a.estimatedTime - b.estimatedTime
    );
    return sortedByTime[0].id;
  }

  // 🎨 VIEW STATE: UI-specific methods
  triggerProgressAnimation(): void {
    this.state.progressAnimationActive = true;
    setTimeout(() => {
      this.state.progressAnimationActive = false;
    }, 1000);
  }

  celebrateCompletion(): void {
    this.state.completionCelebrationActive = true;
    setTimeout(() => {
      this.state.completionCelebrationActive = false;
    }, 2000);
  }

  getNavigationFeedback(): string {
    const currentNode = this.state.formNodes.find(n => n.id === this.state.currentNode);
    const completedCount = this.state.completedNodes.length;
    const totalNodes = this.state.formNodes.length;
    
    if (completedCount === totalNodes) {
      return "🎉 All forms completed! Ready for submission.";
    }
    
    if (this.state.isNavigating) {
      return `🔄 Navigating to ${currentNode?.title}...`;
    }
    
    const nextNode = this.getNextOptimalNode();
    if (nextNode) {
      const nextNodeObj = this.state.formNodes.find(n => n.id === nextNode);
      return `📋 Current: ${currentNode?.title}. Next: ${nextNodeObj?.title}`;
    }
    
    return `📍 Current: ${currentNode?.title}`;
  }

  private updateAvailableNodes(): void {
    this.state.formNodes.forEach((node) => {
      const wasAvailable = node.isAvailable;
      node.isAvailable = this.canAccessNode(node.id);

      // Update available nodes list
      if (node.isAvailable && !this.state.availableNodes.includes(node.id)) {
        this.state.availableNodes.push(node.id);
      } else if (
        !node.isAvailable &&
        this.state.availableNodes.includes(node.id)
      ) {
        this.state.availableNodes = this.state.availableNodes.filter(
          (id) => id !== node.id
        );
      }
    });
  }

  private evaluateConditions(conditions: Condition[]): boolean {
    return conditions.every((condition) => {
      const value = this.getNestedValue(this.state.formData, condition.field);
      return this.evaluateCondition(condition, value);
    });
  }

  private evaluateCondition(condition: Condition, value: any): boolean {
    switch (condition.operator) {
      case "eq":
        return value === condition.value;
      case "neq":
        return value !== condition.value;
      case "gt":
        return value > condition.value;
      case "lt":
        return value < condition.value;
      case "gte":
        return value >= condition.value;
      case "lte":
        return value <= condition.value;
      case "includes":
        return Array.isArray(value) && value.includes(condition.value);
      case "in":
        return (
          Array.isArray(condition.value) && condition.value.includes(value)
        );
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }
}