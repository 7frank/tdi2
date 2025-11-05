#!/usr/bin/env bun

// Demo script showing the new analytics capabilities
// Run with: bun analytics-demo.ts

import { DIAnalytics, CompileTimeDIContainer } from './src/index.js';

console.log('🚀 TDI2 Analytics Demo\n');

// Demo 1: Basic DI Analytics
console.log('📊 Demo 1: Basic Analytics');
console.log('═'.repeat(40));

const analytics = new DIAnalytics({ verbose: true });

// Mock DI configuration (similar to what would be generated)
const mockDIConfig = {
  'UserService': {
    implementationClass: 'UserService',
    scope: 'singleton',
    dependencies: ['DatabaseService', 'CacheService'],
    registrationType: 'class',
    isClassBased: true,
    isAutoResolved: true
  },
  'DatabaseService': {
    implementationClass: 'DatabaseService',
    scope: 'singleton',
    dependencies: ['ConfigService'],
    registrationType: 'class',
    isClassBased: true,
    isAutoResolved: true
  },
  'CacheService': {
    implementationClass: 'CacheService',
    scope: 'singleton',
    dependencies: [],
    registrationType: 'class',
    isClassBased: true,
    isAutoResolved: true
  },
  'ConfigService': {
    implementationClass: 'ConfigService',
    scope: 'singleton',
    dependencies: [],
    registrationType: 'class',
    isClassBased: true,
    isAutoResolved: true
  },
  'EmailService': {
    implementationClass: 'EmailService',
    scope: 'transient',
    dependencies: ['ConfigService'],
    registrationType: 'class',
    isClassBased: true,
    isAutoResolved: true
  }
};

// Analyze the configuration
const analysis = analytics.analyzeConfiguration(mockDIConfig);

console.log(`✅ Analysis completed:`);
console.log(`   Services: ${analysis.graph.nodes.size}`);
console.log(`   Dependencies: ${analysis.summary.totalServices}`);
console.log(`   Validation: ${analysis.validation.isValid ? 'VALID' : 'INVALID'}`);
console.log(`   Coupling Score: ${(analysis.summary.couplingAnalysis.couplingScore * 100).toFixed(1)}%`);

// Demo 2: Graph Visualization
console.log('\n📈 Demo 2: ASCII Graph Visualization');
console.log('═'.repeat(40));

const asciiGraph = analytics.visualizeGraph({ 
  format: 'ascii',
  maxDepth: 5 
}, mockDIConfig);

console.log(asciiGraph);

// Demo 3: JSON Graph for Web
console.log('\n📋 Demo 3: JSON Graph (for Web Interface)');
console.log('═'.repeat(40));

const jsonGraph = analytics.visualizeGraph({ 
  format: 'json',
  includeDetails: true 
}, mockDIConfig);

console.log('JSON Graph (truncated):');
const parsed = JSON.parse(jsonGraph);
console.log(`  Nodes: ${parsed.nodes.length}`);
console.log(`  Edges: ${parsed.edges.length}`);
console.log(`  Statistics: ${JSON.stringify(parsed.statistics, null, 2)}`);

// Demo 4: Service Resolution Tracing
console.log('\n🔍 Demo 4: Service Resolution Tracing');
console.log('═'.repeat(40));

const userServiceTrace = analytics.traceService('UserService', mockDIConfig);
console.log(`UserService resolution: ${userServiceTrace.success ? '✅ SUCCESS' : '❌ FAILED'}`);
console.log(`Resolution steps: ${userServiceTrace.steps.length}`);

userServiceTrace.steps.forEach((step: any) => {
  const icon = step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⏭️';
  console.log(`  ${step.step}. ${icon} ${step.strategy}: ${step.details}`);
});

// Demo 5: Container Integration
console.log('\n🏗️  Demo 5: Enhanced Container');
console.log('═'.repeat(40));

const container = new CompileTimeDIContainer();

// Register some services
container.register('ConfigService', () => ({ apiUrl: 'https://api.example.com' }));
container.register('DatabaseService', (c) => ({
  config: c.resolve('ConfigService'),
  query: () => 'SELECT * FROM users'
}));

console.log(`Registered tokens: ${container.getRegisteredTokens().join(', ')}`);

// Use new analytics methods
const health = container.getHealthReport();
console.log(`Container health: ${health.status} (Score: ${health.score}/100)`);
console.log(`Issues: ${health.issues}`);

const containerGraph = container.getDependencyGraph();
console.log(`Container graph nodes: ${containerGraph.nodes.size}`);

// Demo 6: Problem Detection
console.log('\n⚠️  Demo 6: Problem Detection');
console.log('═'.repeat(40));

// Create a problematic configuration
const problematicConfig = {
  'ServiceA': {
    implementationClass: 'ServiceA',
    dependencies: ['ServiceB'],
    scope: 'singleton',
    registrationType: 'class'
  },
  'ServiceB': {
    implementationClass: 'ServiceB',
    dependencies: ['ServiceC'], 
    scope: 'singleton',
    registrationType: 'class'
  },
  'ServiceC': {
    implementationClass: 'ServiceC',
    dependencies: ['ServiceA'], // Circular dependency!
    scope: 'singleton',
    registrationType: 'class'
  },
  'OrphanedService': {
    implementationClass: 'OrphanedService',
    dependencies: ['ServiceA'], // Has dependencies but no dependents
    scope: 'singleton',
    registrationType: 'class'
  }
};

const problems = analytics.findProblematicServices(problematicConfig);
console.log(`Circular dependencies: ${problems.circular.length}`);
console.log(`  ${problems.circular.join(' → ')}`);
console.log(`Orphaned services: ${problems.orphaned.length}`);
console.log(`  ${problems.orphaned.join(', ')}`);

const validation = analytics.validate(problematicConfig, 'all');
if ('issues' in validation) {
  console.log(`Validation errors: ${validation.issues.errors.length}`);
  console.log(`Validation warnings: ${validation.issues.warnings.length}`);
}

// Demo 7: CLI Integration Preview
console.log('\n🖥️  Demo 7: CLI Commands');
console.log('═'.repeat(40));

console.log('Available CLI commands:');
console.log('  tdi2 analyze --src ./src --format table');
console.log('  tdi2 validate --src ./src --type circular'); 
console.log('  tdi2 trace TodoServiceType --src ./src');
console.log('  tdi2 graph --src ./src --format ascii');
console.log('  tdi2 graph --src ./src --format json > graph.json');

console.log('\n✅ Analytics demo complete!');
console.log('\nNext steps:');
console.log('  1. Integrate analytics with web dependency viewer');
console.log('  2. Use CLI to debug TodoService discovery issue');
console.log('  3. Add analytics to CI/CD pipeline for validation');
console.log('  4. Create performance monitoring dashboard');