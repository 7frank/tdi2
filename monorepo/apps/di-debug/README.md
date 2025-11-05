# TDI2 Debugging Guide

This guide shows you how to debug dependency injection issues using TDI2's built-in analytics tools.

## Quick Start

```bash
# Analyze your DI configuration
tdi2 analyze --src ./src

# Debug a specific service that's not working
tdi2 trace TodoServiceType --src ./src

# Check for common problems
tdi2 validate --src ./src --type all
```

## CLI Tools

### `tdi2 analyze` - Comprehensive Analysis

Get a complete overview of your DI configuration:

```bash
# Basic analysis with table output
tdi2 analyze --src ./src

# JSON output for tooling/web viewer
tdi2 analyze --src ./src --format json

# Save detailed analysis to file
tdi2 analyze --src ./src --output analysis.json

# Include specific profiles
tdi2 analyze --src ./src --profiles production,logging
```

**Example Output:**

```
📊 DI Configuration Analysis Report
════════════════════════════════════════════════
Status: ✅ HEALTHY (Score: 85/100)
Services: 12 total
Issues: 0 errors, 2 warnings

📈 Coupling Analysis:
   Average connections: 2.3
   Coupling score: 15.2%

⏱️  Performance: 125ms
```

### `tdi2 validate` - Issue Detection

Find specific types of problems:

```bash
# Validate everything
tdi2 validate --src ./src

# Check only circular dependencies
tdi2 validate --src ./src --type circular

# Check for missing services
tdi2 validate --src ./src --type missing

# Check scope mismatches
tdi2 validate --src ./src --type scopes

# Find orphaned services
tdi2 validate --src ./src --type orphaned
```

**Example Output:**

```
📋 Validation Summary
════════════════════════════════════
Status: ❌ INVALID
Services: 12
Errors: 2
Warnings: 1

❌ TodoServiceType: Missing service dependency 'TodoServiceType' required by 'TodoApp'
   💡 Create a service class 'TodoService' that implements 'TodoServiceType' and add @Service() decorator

⚠️  UserService: Singleton service 'UserService' depends on transient service 'FormService'
   💡 Consider making the dependency singleton or using a factory pattern
```

### `tdi2 trace` - Service Resolution Debugging

Debug why a service isn't working:

```bash
# Trace a specific service
tdi2 trace TodoServiceType --src ./src

# Show all missing services
tdi2 trace --missing --src ./src

# Show circular dependency chains
tdi2 trace --circular --src ./src

# Get JSON output for detailed analysis
tdi2 trace TodoServiceType --src ./src --format json
```

**Example Output:**

```
🔍 Resolution Trace: TodoServiceType
══════════════════════════════════════════════════════════
Result: ❌ FAILED
Error: Service token 'TodoServiceType' not found in DI configuration

Resolution Steps:
1. ❌ interface: Token 'TodoServiceType' not found in DI configuration
2. ❌ class: Expected class: TodoService - check if class exists and has @Service decorator
```

### `tdi2 graph` - Dependency Visualization

Visualize your service dependencies:

```bash
# ASCII graph for terminal
tdi2 graph --src ./src

# JSON graph for web viewer
tdi2 graph --src ./src --format json

# Graphviz DOT format
tdi2 graph --src ./src --format dot --output deps.dot

# Mermaid diagram format
tdi2 graph --src ./src --format mermaid --output deps.mmd

# Highlight specific services
tdi2 graph --src ./src --highlight UserService,AuthService

# Show only specific types
tdi2 graph --src ./src --types interface,class

# Include profile information
tdi2 graph --src ./src --profiles

# Limit depth
tdi2 graph --src ./src --max-depth 3
```

**ASCII Example:**

```
🔌 UserService → UserService (singleton)
├── 🔌 DatabaseService → DatabaseService (singleton)
│   └── 🔌 ConfigService → ConfigService (singleton)
└── 🔌 CacheService → CacheService (singleton)
    └── 🔌 ConfigService → ConfigService (singleton) (circular reference)
```

**JSON Example** (for web viewer):

```json
{
  "meta": {
    "totalNodes": 4,
    "generatedAt": "2025-08-21T10:45:00.000Z"
  },
  "nodes": [
    {
      "id": "UserService",
      "implementationClass": "UserService",
      "scope": "singleton",
      "type": "class",
      "dependencyCount": 2
    }
  ],
  "edges": [
    {
      "from": "UserService",
      "to": "DatabaseService",
      "type": "dependency"
    }
  ]
}
```

## Common Debugging Scenarios

### 1. Service Not Found

**Problem**: `Service not registered: TodoServiceType`

**Debug Steps**:

```bash
# 1. Check if service is in DI config
tdi2 analyze --src ./src --format json | grep -i todoservice

# 2. Trace the specific service
tdi2 trace TodoServiceType --src ./src

# 3. Check for similar services
tdi2 trace --missing --src ./src
```

**Common Causes**:

- Service class missing `@Service()` decorator
- Service file not being scanned (wrong directory/pattern)
- Interface name mismatch
- Service implements wrong interface

### 2. Circular Dependencies

**Problem**: `Circular dependency detected: A → B → A`

**Debug Steps**:

```bash
# 1. Find all circular dependencies
tdi2 trace --circular --src ./src

# 2. Visualize the dependency chain
tdi2 graph --src ./src --highlight ServiceA,ServiceB

# 3. Get detailed analysis
tdi2 validate --src ./src --type circular
```

**Common Solutions**:

- Use lazy loading with factory functions
- Extract shared logic into separate service
- Use event-driven communication instead of direct dependency

### 3. Interface Resolution Issues

**Problem**: Multiple services implement same interface

**Debug Steps**:

```bash
# 1. Check for duplicate implementations
tdi2 validate --src ./src --type all

# 2. Analyze service coupling
tdi2 analyze --src ./src

# 3. Check interface mappings
tdi2 graph --src ./src --types interface --format json
```

**Solutions**:

- Use `@Primary` decorator on main implementation
- Use `@Qualifier` for specific implementations
- Check profile configurations

### 4. Scope Mismatches

**Problem**: Singleton depends on transient service

**Debug Steps**:

```bash
# 1. Check scope issues
tdi2 validate --src ./src --type scopes

# 2. Analyze specific service
tdi2 trace UserService --src ./src

# 3. Review dependency graph
tdi2 graph --src ./src --highlight UserService
```

**Solutions**:

- Make dependency singleton if stateless
- Use factory pattern for dynamic dependencies
- Reconsider service lifecycle requirements

## Container API

You can also use analytics directly in your code:

```typescript
import { DIAnalytics, CompileTimeDIContainer } from "@tdi2/di-core";

// Basic analytics
const analytics = new DIAnalytics({ verbose: true });
const analysis = analytics.analyzeConfiguration(DI_CONFIG);

if (!analysis.validation.isValid) {
  console.error("DI Configuration has issues:", analysis.validation.issues);
}

// Enhanced container with analytics
const container = new CompileTimeDIContainer();

// Get health report
const health = container.getHealthReport();
if (health.status !== "healthy") {
  console.warn(`Container issues: ${health.summary}`);
  health.recommendations.forEach((rec) => console.log(`💡 ${rec}`));
}

// Debug specific service
const trace = container.getResolutionPath("TodoServiceType");
if (!trace.success) {
  console.error(`Failed to resolve TodoServiceType: ${trace.error}`);
}

// Find circular dependencies
const circular = container.findCircularDependencies();
if (circular.length > 0) {
  console.warn("Circular dependencies:", circular);
}

// Export for external tools
const config = container.exportConfiguration("json");
const dotGraph = container.exportConfiguration("dot");
```

## CI/CD Integration

Use TDI2 analytics in your build pipeline:

```yaml
# GitHub Actions example
- name: Validate DI Configuration
  run: |
    tdi2 validate --src ./src --format json --output validation.json

    # Exit with error code if validation fails
    if [ $? -ne 0 ]; then
      echo "❌ DI validation failed"
      cat validation.json
      exit 1
    fi

    echo "✅ DI configuration is valid"

- name: Generate Dependency Graph
  run: |
    tdi2 graph --src ./src --format json --output dependency-graph.json
    tdi2 analyze --src ./src --format json --output analysis.json

- name: Upload Analysis Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: di-analysis
    path: |
      validation.json
      dependency-graph.json
      analysis.json
```

## Web Dashboard Integration

The CLI JSON output is designed for web consumption:

```typescript
// Load analysis data in web app
const response = await fetch("/api/di-analysis");
const analysis = await response.json();

// Render dependency graph
renderDependencyGraph(analysis.graph);

// Show validation issues
displayValidationIssues(analysis.validation.issues);

// Update health dashboard
updateHealthMetrics(analysis.summary);
```

## Performance Tips

1. **Use JSON output** for programmatic processing
2. **Limit graph depth** for large codebases (`--max-depth 5`)
3. **Cache analysis results** in CI/CD pipelines
4. **Filter by types** to focus on specific issues (`--types interface`)
5. **Use profiles** to analyze environment-specific configurations

## Local Development

- `br src/cli.ts analyze --src ../../../examples/tdi2-basic-example/src`
- `br src/cli.ts analyze --src ../legacy/src/`
- `br src/cli.ts serve --src ../legacy/src/` 
- `bunx tdi2 serve --src ../legacy/src/`


## Troubleshooting

### CLI Not Found

```bash
# Make sure you're in the right directory
cd /path/to/your/project

# Check if tdi2 is installed
npm list @tdi2/di-core

# Try with npx
npx tdi2 analyze --src ./src
```

### No DI Configuration Found

```bash
# Check expected locations
ls -la src/.tdi2/
ls -la src/di-config.*

# Specify custom location
tdi2 analyze --src ./custom/src/path
```

### Performance Issues

```bash
# Use JSON format for large outputs
tdi2 analyze --src ./src --format json > analysis.json

# Limit analysis scope
tdi2 graph --src ./src --max-depth 3 --types interface

# Enable verbose mode to see timing
tdi2 analyze --src ./src --verbose
```

## Advanced Usage

### Custom Analysis Scripts

Create custom analysis scripts using the analytics API:

```typescript
// custom-analysis.ts
import { DIAnalytics } from "@tdi2/di-core";
import { readFileSync } from "fs";

const analytics = new DIAnalytics({
  verbose: true,
  includePerformance: true,
});

// Load your DI config
const diConfig = JSON.parse(readFileSync("./src/.tdi2/di-config.json", "utf8"));

// Custom analysis
const analysis = analytics.analyzeConfiguration(diConfig);

// Generate custom report
console.log("🏗️ Architecture Report");
console.log(`Total Services: ${analysis.graph.nodes.size}`);
console.log(
  `Coupling Score: ${analysis.summary.couplingAnalysis.couplingScore}`
);

// Find problematic patterns
const problems = analytics.findProblematicServices(diConfig);
if (problems.circular.length > 0) {
  console.log("⚠️ Circular Dependencies Need Attention");
}

// Export for visualization tools
const mermaidDiagram = analytics.visualizeGraph(
  { format: "mermaid" },
  diConfig
);
writeFileSync("./docs/dependency-diagram.mmd", mermaidDiagram);
```

### Integration with IDEs

Use CLI output in VS Code or other editors:

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Analyze DI Configuration",
      "type": "shell",
      "command": "tdi2",
      "args": ["analyze", "--src", "./src"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always"
      },
      "problemMatcher": {
        "pattern": {
          "regexp": "^❌\\s+(.+?):\\s+(.+)$",
          "file": 1,
          "message": 2
        }
      }
    }
  ]
}
```

This debugging guide should help developers quickly identify and resolve DI issues using the new analytics system! 🔍
