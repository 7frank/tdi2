// Container Analytics Bridge - Provides analytics functionality for DIContainer instances
// This module bridges the gap between the core DIContainer and analytics tools

import { CompileTimeDIContainer } from '@tdi2/di-core';
import { DIAnalytics } from '../analytics/index.js';
import type { GraphVisualizationOptions } from '../analytics/types.js';

/**
 * Get dependency graph for a container instance
 * Uses analytics module for comprehensive analysis
 */
export function getContainerDependencyGraph(container: CompileTimeDIContainer): any {
  const analytics = new DIAnalytics({ verbose: false });
  
  // Convert container state to DI config format for analysis
  const diConfig = container.exportConfiguration();
  return analytics.analyzeConfiguration(diConfig).graph;
}

/**
 * Validate container configuration
 * Returns comprehensive validation results
 */
export function validateContainerConfiguration(container: CompileTimeDIContainer): any {
  const analytics = new DIAnalytics({ verbose: false });
  
  const diConfig = container.exportConfiguration();
  return analytics.validate(diConfig, 'all');
}

/**
 * Get resolution path for a service token from a container
 * Useful for debugging why services aren't resolving
 */
export function getContainerResolutionPath(container: CompileTimeDIContainer, token: string): any {
  const analytics = new DIAnalytics({ verbose: false });
  
  const diConfig = container.exportConfiguration();
  return analytics.traceService(token, diConfig);
}

/**
 * Find circular dependencies in container
 */
export function findContainerCircularDependencies(container: CompileTimeDIContainer): string[][] {
  const analytics = new DIAnalytics({ verbose: false });
  
  const diConfig = container.exportConfiguration();
  const analysis = analytics.analyzeConfiguration(diConfig);
  return analysis.summary.circularDependencies;
}

/**
 * Generate visual representation of container dependency graph
 * Supports DOT format for visualization tools like Graphviz
 */
export function visualizeContainerGraph(
  container: CompileTimeDIContainer, 
  options: GraphVisualizationOptions
): string {
  const analytics = new DIAnalytics({ verbose: false });
  const diConfig = container.exportConfiguration();
  
  return analytics.visualizeGraph(options, diConfig);
}

/**
 * Get container health report
 * Provides quick overview of container status
 */
export function getContainerHealthReport(container: CompileTimeDIContainer): {
  status: 'healthy' | 'warning' | 'error';
  score: number;
  summary: string;
  issues: {
    critical: number;
    warnings: number;
    info: number;
  };
  recommendations: string[];
} {
  const analytics = new DIAnalytics({ verbose: false });
  
  const diConfig = container.exportConfiguration();
  return analytics.getHealthReport(diConfig);
}

/**
 * Comprehensive container analysis
 * Returns all analytics data for a container instance
 */
export function analyzeContainer(container: CompileTimeDIContainer, verbose: boolean = false) {
  const analytics = new DIAnalytics({ verbose, includePerformance: true });
  
  const diConfig = container.exportConfiguration();
  return analytics.analyzeConfiguration(diConfig);
}

/**
 * Find problematic services in a container
 * Useful for identifying configuration gaps
 */
export function findContainerProblematicServices(container: CompileTimeDIContainer): {
  unresolved: string[];
  circular: string[];
  orphaned: string[];
  scopeIssues: string[];
} {
  const analytics = new DIAnalytics({ verbose: false });
  
  const diConfig = container.exportConfiguration();
  return analytics.findProblematicServices(diConfig);
}