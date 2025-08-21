// TDI2 CLI - Professional command-line interface for DI analysis and debugging

import {
  command,
  run,
  string,
  option,
  flag,
  subcommands,
  positional,
  oneOf,
  optional,
} from "cmd-ts";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { DIAnalytics } from "./src/analytics/index.js";
import type { GraphVisualizationOptions } from "./src/analytics/types.js";
import { TDI2Server } from "./src/serve/index.js";
import path from "node:path";

// CLI metadata
const CLI_VERSION = "3.1.2";
const CLI_NAME = "tdi2";

// Common options
const srcDirOption = option({
  type: string,
  long: "src",
  short: "s",
  description: "Source directory to analyze",
  defaultValue: () => "./src",
});

const outputOption = option({
  type: optional(string),
  long: "output",
  short: "o",
  description:
    "Output file path (optional - outputs to console if not specified)",
});

const formatOption = option({
  type: oneOf(["table", "json"]),
  long: "format",
  short: "f",
  description: "Output format",
  defaultValue: () => "table" as const,
});

const verboseFlag = flag({
  long: "verbose",
  short: "v",
  description: "Enable verbose output",
});

// Analyze command - comprehensive DI configuration analysis
const analyzeCommand = command({
  name: "analyze",
  description:
    "Analyze DI configuration for issues and generate comprehensive report",
  args: {
    src: srcDirOption,
    format: formatOption,
    output: outputOption,
    verbose: verboseFlag,
    profiles: option({
      type: string,
      long: "profiles",
      description: "Active profiles (comma-separated)",
      defaultValue: () => "",
    }),
  },
  handler: async ({ src, format, output, verbose, profiles }) => {
    try {
      const diConfig = await loadDIConfig(src);
      const activeProfiles = profiles
        ? profiles.split(",").map((p: string) => p.trim())
        : undefined;

      const analytics = new DIAnalytics({
        verbose,
        includePerformance: true,
        activeProfiles,
      });

      console.log(`🔍 Analyzing DI configuration in ${src}...`);
      const analysis = analytics.analyzeConfiguration(diConfig);

      if (format === "json") {
        const jsonOutput = JSON.stringify(analysis, null, 2);
        if (output) {
          writeFileSync(output, jsonOutput);
          console.log(`📄 Analysis saved to ${output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        printAnalysisTable(analysis);
        if (output) {
          const jsonOutput = JSON.stringify(analysis, null, 2);
          writeFileSync(output, jsonOutput);
          console.log(`\n📄 Detailed analysis also saved to ${output}`);
        }
      }
    } catch (error) {
      console.error("❌ Analysis failed:", error.message);
      process.exit(1);
    }
  },
});

// Validate command - specific validation checks
const validateCommand = command({
  name: "validate",
  description: "Validate DI configuration for specific types of issues",
  args: {
    src: srcDirOption,
    type: option({
      type: oneOf(["all", "circular", "missing", "scopes", "orphaned"]),
      long: "type",
      short: "t",
      description: "Type of validation to perform",
      defaultValue: () => "all" as const,
    }),
    format: formatOption,
    output: outputOption,
    verbose: verboseFlag,
  },
  handler: async ({ src, type, format, output, verbose }) => {
    try {
      const diConfig = await loadDIConfig(src);
      const analytics = new DIAnalytics({ verbose });

      console.log(`🔍 Validating DI configuration (${type})...`);
      const result = analytics.validate(
        diConfig,
        type as "all" | "circular" | "missing" | "scopes" | "orphaned"
      );

      if (format === "json") {
        const jsonOutput = JSON.stringify(result, null, 2);
        if (output) {
          writeFileSync(output, jsonOutput);
          console.log(`📄 Validation results saved to ${output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        printValidationTable(result);
        if (output) {
          const jsonOutput = JSON.stringify(result, null, 2);
          writeFileSync(output, jsonOutput);
          console.log(`\n📄 Detailed results also saved to ${output}`);
        }
      }

      // Exit with non-zero code if there are errors
      if (Array.isArray(result)) {
        const errors = result.filter((issue) => issue.severity === "error");
        if (errors.length > 0) process.exit(1);
      } else if (!result.isValid) {
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Validation failed:", error.message);
      process.exit(1);
    }
  },
});

// Trace command - trace service resolution paths
const traceCommand = command({
  name: "trace",
  description:
    "Trace service resolution path to debug missing or problematic services",
  args: {
    token: positional({
      type: optional(string),
      displayName: "service-token",
      description: "Service token to trace (optional when using --missing)",
    }),
    src: srcDirOption,
    format: formatOption,
    output: outputOption,
    verbose: verboseFlag,
    missing: flag({
      long: "missing",
      description:
        "Show all missing services instead of tracing specific token",
    }),
    circular: flag({
      long: "circular",
      description:
        "Show circular dependency chains instead of tracing specific token",
    }),
  },
  handler: async ({
    token,
    src,
    format,
    output,
    verbose,
    missing,
    circular,
  }) => {
    try {
      const diConfig = await loadDIConfig(src);
      const analytics = new DIAnalytics({ verbose });

      if (missing) {
        console.log("🔍 Finding all unresolved services...");
        const problems = analytics.findProblematicServices(diConfig);
        console.log(
          `\n❌ Unresolved services (${problems.unresolved.length}):`
        );
        problems.unresolved.forEach((token) => console.log(`  • ${token}`));

        if (format === "json" || output) {
          const jsonOutput = JSON.stringify(problems, null, 2);
          if (output) {
            writeFileSync(output, jsonOutput);
            console.log(`\n📄 Results saved to ${output}`);
          } else if (format === "json") {
            console.log(jsonOutput);
          }
        }
        return;
      }

      if (circular) {
        console.log("🔄 Finding circular dependency chains...");
        const analysis = analytics.analyzeConfiguration(diConfig);
        console.log(
          `\n🔄 Circular dependencies (${analysis.summary.circularDependencies.length}):`
        );
        analysis.summary.circularDependencies.forEach((cycle) => {
          console.log(`  • ${cycle.join(" → ")}`);
        });

        if (format === "json" || output) {
          const jsonOutput = JSON.stringify(
            analysis.summary.circularDependencies,
            null,
            2
          );
          if (output) {
            writeFileSync(output, jsonOutput);
            console.log(`\n📄 Results saved to ${output}`);
          } else if (format === "json") {
            console.log(jsonOutput);
          }
        }
        return;
      }

      if (!token) {
        console.error('❌ Service token is required when not using --missing or --circular flags');
        console.log('   Use --missing to find all unresolved services');
        console.log('   Use --circular to find circular dependencies');
        console.log('   Or provide a service token to trace: tdi2 trace <service-token>');
        process.exit(1);
      }

      console.log(`🔍 Tracing resolution path for '${token}'...`);
      const trace = analytics.traceService(token, diConfig);

      if (format === "json") {
        const jsonOutput = JSON.stringify(trace, null, 2);
        if (output) {
          writeFileSync(output, jsonOutput);
          console.log(`📄 Trace results saved to ${output}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        printTraceTable(trace);
        if (output) {
          const jsonOutput = JSON.stringify(trace, null, 2);
          writeFileSync(output, jsonOutput);
          console.log(`\n📄 Detailed trace also saved to ${output}`);
        }
      }

      if (!trace.success) process.exit(1);
    } catch (error) {
      console.error("❌ Trace failed:", error.message);
      process.exit(1);
    }
  },
});

// Graph command - visualize dependency graph
const graphCommand = command({
  name: "graph",
  description: "Generate dependency graph visualization in various formats",
  args: {
    src: srcDirOption,
    format: option({
      type: oneOf(["ascii", "json", "dot", "mermaid"]),
      long: "format",
      short: "f",
      description: "Output format for graph visualization",
      defaultValue: () => "ascii" as const,
    }),
    output: outputOption,
    verbose: verboseFlag,
    highlight: option({
      type: optional(string),
      long: "highlight",
      description: "Services to highlight (comma-separated)",
    }),
    types: option({
      type: optional(string),
      long: "types",
      description:
        "Node types to include: interface,class,inheritance,state (comma-separated)",
    }),
    profiles: flag({
      long: "profiles",
      description: "Show profile information",
    }),
    maxDepth: option({
      type: string,
      long: "max-depth",
      description: "Maximum depth to display",
      defaultValue: () => "10",
    }),
  },
  handler: async ({
    src,
    format,
    output,
    verbose,
    highlight,
    types,
    profiles,
    maxDepth,
  }) => {
    try {
      const diConfig = await loadDIConfig(src);
      const analytics = new DIAnalytics({ verbose });

      const options: GraphVisualizationOptions = {
        format: format as "ascii" | "json" | "dot" | "mermaid",
        includeDetails: format === "json",
        highlight: highlight
          ? highlight.split(",").map((s: string) => s.trim())
          : [],
        nodeTypes: types
          ? (types.split(",").map((s: string) => s.trim()) as any)
          : undefined,
        showProfiles: profiles,
        maxDepth: parseInt(maxDepth),
      };

      console.log(`📊 Generating ${format.toUpperCase()} dependency graph...`);
      const graph = analytics.visualizeGraph(options, diConfig);

      if (output) {
        writeFileSync(output, graph);
        console.log(`📄 Graph saved to ${output}`);
      } else {
        console.log(graph);
      }
    } catch (error) {
      console.error("❌ Graph generation failed:", error.message);
      process.exit(1);
    }
  },
});

// Serve command - launch web dashboard
const serveCommand = command({
  name: "serve",
  description: "Launch web dashboard for interactive DI analysis",
  args: {
    src: srcDirOption,
    port: option({
      type: string,
      long: "port",
      short: "p",
      description: "Port to serve on",
      defaultValue: () => "3001",
    }),
    host: option({
      type: optional(string),
      long: "host",
      description: "Host to bind to (default: localhost)"
    }),
    verbose: verboseFlag,
    open: flag({
      long: "open",
      description: "Open browser automatically"
    }),
    watch: flag({
      long: "watch",
      description: "Watch files for changes and auto-reload"
    }),
    dev: flag({
      long: "dev",
      description: "Development mode with detailed error messages"
    }),
    showPotentialRelations: flag({
      long: "show-potential",
      description: "Show potential/missing relationships with dotted lines (default: true)"
    })
  },
  handler: async ({ src, port, host, verbose, open, watch, dev, showPotentialRelations }) => {
    try {
      console.log("🚀 Starting TDI2 web dashboard...");
      
      const server = new TDI2Server({
        srcPath: src,
        port: parseInt(port),
        host,
        verbose,
        open,
        watch,
        dev
      });

      // Graceful shutdown handling
      const shutdown = async (signal: string) => {
        console.log(`\n📨 Received ${signal}, shutting down gracefully...`);
        try {
          await server.stop();
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      
      // Start the server
      await server.start();
      
      // Keep the process alive
      await new Promise(() => {}); // This will keep running until interrupted
      
    } catch (error: unknown) {
      console.error("❌ Failed to start TDI2 server:");
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
        if (dev) {
          console.error('\n📋 Stack trace:');
          console.error(error.stack);
        }
      } else {
        console.error(`   ${String(error)}`);
      }
      
      console.log("\n💡 Troubleshooting tips:");
      console.log(`   • Check if port ${port} is available`);
      console.log(`   • Verify source path exists: ${src}`);
      console.log(`   • Try with --dev flag for detailed error info`);
      console.log(`   • Use --verbose for more debugging information`);
      
      process.exit(1);
    }
  },
});

// Main CLI application
const app = subcommands({
  name: CLI_NAME,
  description:
    "TDI2 Analytics CLI - Comprehensive dependency injection analysis and debugging",
  version: CLI_VERSION,
  cmds: {
    analyze: analyzeCommand,
    validate: validateCommand,
    trace: traceCommand,
    graph: graphCommand,
    serve: serveCommand,
  },
});

// Helper functions

async function loadDIConfig(srcDir: string): Promise<Record<string, any>> {
  const configPaths = [
    join(srcDir, ".tdi2", "di-config.mjs"),
    join(srcDir, ".tdi2", "di-config.cjs"),
    join(srcDir, ".tdi2", "di-config.js"),
    join(srcDir, ".tdi2", "di-config.ts"),
    join(srcDir, "di-config.mjs"),
    join(srcDir, "di-config.cjs"),
    join(srcDir, "di-config.js"),
    join(srcDir, "di-config.ts"),
  ];

  const { pathToFileURL } = await import("node:url");

  for (const configPath of configPaths) {
    const fullPath = resolve(configPath);
    if (!existsSync(fullPath)) continue;

    const isTS = fullPath.endsWith(".ts");
    if (isTS) {
      try {
        // Registers ts-node only if available; no hard dependency
        await import("ts-node/register/transpile-only");
      } catch {
        console.warn(
          `⚠️  TypeScript config detected but 'ts-node' is not available: ${configPath}`
        );
        console.warn(
          "   Install 'ts-node' to load TypeScript configs, or provide a JS config."
        );
        continue;
      }
    }

    try {
      const mod = await import(pathToFileURL(fullPath).href);

      const di =
        mod?.DI_CONFIG ?? mod?.default ?? mod?.diConfig ?? mod?.config ?? null;

      if (di && typeof di === "object") {
        console.log(`📄 Loaded DI config from ${configPath}`);
        return di as Record<string, any>;
      } else {
        console.warn(
          `⚠️  No DI config export found in ${configPath}. Expected 'DI_CONFIG' or default export.`
        );
        continue;
      }
    } catch (err: any) {
      console.warn(
        `⚠️  Failed to import DI config at ${configPath}: ${err?.message || err}`
      );
      continue;
    }
  }

  console.warn("⚠️  No DI configuration found. Using empty configuration.");
  console.warn("   BasePath: ", path.resolve(srcDir));
  console.warn("   Expected locations:");
  configPaths.forEach((p) => console.warn(`   • ${p}`));
  return {};
}

function printAnalysisTable(analysis: any) {
  console.log("\n📊 DI Configuration Analysis Report");
  console.log("═".repeat(50));

  const health = analysis.validation.isValid ? "✅ HEALTHY" : "❌ ISSUES FOUND";
  const score = Math.max(
    0,
    100 -
      analysis.validation.issues.errors.length * 20 -
      analysis.validation.issues.warnings.length * 5
  );

  console.log(`Status: ${health} (Score: ${score}/100)`);
  console.log(`Services: ${analysis.summary.totalServices} total`);
  console.log(
    `Issues: ${analysis.validation.issues.errors.length} errors, ${analysis.validation.issues.warnings.length} warnings`
  );

  if (analysis.summary.missingDependencies.length > 0) {
    console.log(
      `\n❌ Missing Dependencies (${analysis.summary.missingDependencies.length}):`
    );
    analysis.summary.missingDependencies.slice(0, 5).forEach((dep: string) => {
      console.log(`   • ${dep}`);
    });
    if (analysis.summary.missingDependencies.length > 5) {
      console.log(
        `   ... and ${analysis.summary.missingDependencies.length - 5} more`
      );
    }
  }

  if (analysis.summary.circularDependencies.length > 0) {
    console.log(
      `\n🔄 Circular Dependencies (${analysis.summary.circularDependencies.length}):`
    );
    analysis.summary.circularDependencies
      .slice(0, 3)
      .forEach((cycle: string[]) => {
        console.log(`   • ${cycle.join(" → ")}`);
      });
    if (analysis.summary.circularDependencies.length > 3) {
      console.log(
        `   ... and ${analysis.summary.circularDependencies.length - 3} more`
      );
    }
  }

  console.log(`\n📈 Coupling Analysis:`);
  console.log(
    `   Average connections: ${analysis.summary.couplingAnalysis.averageConnectionsPerService.toFixed(1)}`
  );
  console.log(
    `   Coupling score: ${(analysis.summary.couplingAnalysis.couplingScore * 100).toFixed(1)}%`
  );

  if (analysis.performance) {
    console.log(`\n⏱️  Performance: ${analysis.performance.analysisTime}ms`);
  }
}

function printValidationTable(result: any) {
  if (Array.isArray(result)) {
    console.log(`\n📋 Validation Issues (${result.length}):`);
    result.forEach((issue: any) => {
      const icon =
        issue.severity === "error"
          ? "❌"
          : issue.severity === "warning"
            ? "⚠️"
            : "ℹ️";
      console.log(`${icon} ${issue.token}: ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 ${issue.suggestion}`);
      }
    });
  } else {
    console.log("\n📋 Validation Summary");
    console.log("═".repeat(40));
    console.log(`Status: ${result.isValid ? "✅ VALID" : "❌ INVALID"}`);
    console.log(`Services: ${result.totalServices}`);
    console.log(`Errors: ${result.issues.errors.length}`);
    console.log(`Warnings: ${result.issues.warnings.length}`);
    console.log(`Info: ${result.issues.info.length}`);

    [...result.issues.errors, ...result.issues.warnings, ...result.issues.info]
      .slice(0, 10)
      .forEach((issue: any) => {
        const icon =
          issue.severity === "error"
            ? "❌"
            : issue.severity === "warning"
              ? "⚠️"
              : "ℹ️";
        console.log(`\n${icon} ${issue.token}: ${issue.message}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      });
  }
}

function printTraceTable(trace: any) {
  console.log(`\n🔍 Resolution Trace: ${trace.target}`);
  console.log("═".repeat(50));
  console.log(`Result: ${trace.success ? "✅ SUCCESS" : "❌ FAILED"}`);

  if (trace.error) {
    console.log(`Error: ${trace.error}`);
  }

  console.log("\nResolution Steps:");
  trace.steps.forEach((step: any) => {
    const icon =
      step.status === "success" ? "✅" : step.status === "failed" ? "❌" : "⏭️";
    console.log(
      `${step.step}. ${icon} ${step.strategy}: ${step.details || step.token}`
    );
    if (step.implementation) {
      console.log(
        `   → ${step.implementation}${step.filePath ? ` (${step.filePath})` : ""}`
      );
    }
  });
}

// Run the CLI
run(app, process.argv.slice(2)).catch((error: any) => {
  console.error("❌ CLI Error:", error.message);
  process.exit(1);
});
