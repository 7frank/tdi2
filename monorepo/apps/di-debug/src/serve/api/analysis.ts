// Analysis API handlers for TDI2 serve module

import { Request, Response } from 'express';
import { DIAnalytics } from '../../analytics/index.js';
import type { ServerOptions, AnalysisResponse } from '../types.js';

export function createAnalysisHandler(analytics: DIAnalytics, options: ServerOptions) {
  // Cache for analysis results to avoid re-computation
  let analysisCache: { 
    data: any; 
    timestamp: number; 
    srcPath: string 
  } | null = null;
  
  const CACHE_TTL = 30000; // 30 seconds

  // Reuse the exact same config loading logic from CLI
  async function loadDIConfig(srcPath: string = options.srcPath): Promise<Record<string, any>> {
    const { join, resolve } = await import('path');
    const { existsSync } = await import('fs');
    
    const configPaths = [
      join(srcPath, ".tdi2", "di-config.mjs"),
      join(srcPath, ".tdi2", "di-config.cjs"),
      join(srcPath, ".tdi2", "di-config.js"),
      join(srcPath, ".tdi2", "di-config.ts"),
      join(srcPath, "di-config.mjs"),
      join(srcPath, "di-config.cjs"),
      join(srcPath, "di-config.js"),
      join(srcPath, "di-config.ts"),
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
          if (options.verbose) {
            console.log(`📄 Loaded DI config from ${configPath}`);
          }
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
    if (options.verbose) {
      console.warn("   BasePath: ", resolve(srcPath));
      console.warn("   Expected locations:");
      configPaths.forEach((p) => console.warn(`   • ${p}`));
    }
    return {};
  }

  async function getCachedAnalysis(forceReload: boolean = false): Promise<any> {
    const now = Date.now();
    
    if (!forceReload && analysisCache && 
        (now - analysisCache.timestamp < CACHE_TTL) &&
        analysisCache.srcPath === options.srcPath) {
      return analysisCache.data;
    }

    const diConfig = await loadDIConfig();
    const analysis = analytics.analyzeConfiguration(diConfig);
    
    analysisCache = {
      data: analysis,
      timestamp: now,
      srcPath: options.srcPath
    };

    return analysis;
  }

  return {
    async getFullAnalysis(req: Request, res: Response): Promise<void> {
      try {
        const forceReload = req.query.reload === 'true';
        const analysis = await getCachedAnalysis(forceReload);
        
        const response: AnalysisResponse = {
          summary: {
            totalServices: analysis.summary.totalServices || 0,
            totalIssues: (analysis.validation.issues.errors?.length || 0) + 
                        (analysis.validation.issues.warnings?.length || 0),
            healthScore: analysis.validation.isValid ? 
              Math.max(0, 100 - (analysis.validation.issues.errors?.length || 0) * 20 - 
                              (analysis.validation.issues.warnings?.length || 0) * 5) : 0,
            circularDependencies: analysis.summary.circularDependencies || 0,
            missingServices: analysis.summary.missingDependencies?.length || 0
          },
          issues: [
            ...(analysis.validation.issues.errors || []).map((error: any) => ({
              type: 'error' as const,
              code: error.code || 'UNKNOWN_ERROR',
              message: error.message || error.toString(),
              suggestion: error.suggestion,
              location: error.location
            })),
            ...(analysis.validation.issues.warnings || []).map((warning: any) => ({
              type: 'warning' as const, 
              code: warning.code || 'UNKNOWN_WARNING',
              message: warning.message || warning.toString(),
              suggestion: warning.suggestion,
              location: warning.location
            }))
          ],
          performance: {
            analysisTime: analysis.performance?.duration || 0,
            memoryUsage: process.memoryUsage().heapUsed
          },
          timestamp: new Date().toISOString()
        };

        res.json(response);
      } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
          error: 'Analysis failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    },

    async getValidation(req: Request, res: Response): Promise<void> {
      try {
        const type = req.query.type as string || 'all';
        const diConfig = await loadDIConfig();
        const result = analytics.validate(diConfig, type as any);
        
        res.json({
          ...result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Validation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },

    async traceService(req: Request, res: Response): Promise<void> {
      try {
        const { token } = req.params;
        const diConfig = await loadDIConfig();
        const trace = analytics.traceService(token, diConfig);
        
        res.json({
          token,
          trace,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Service tracing failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },

    async getProblems(req: Request, res: Response): Promise<void> {
      try {
        const diConfig = await loadDIConfig();
        const problems = analytics.findProblematicServices(diConfig);
        
        res.json({
          ...problems,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Problem detection failed', 
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },

    async reloadConfig(req: Request, res: Response): Promise<void> {
      try {
        // Clear cache to force reload
        analysisCache = null;
        
        const analysis = await getCachedAnalysis(true);
        
        res.json({
          success: true,
          message: 'Configuration reloaded successfully',
          summary: {
            totalServices: analysis.summary.totalServices || 0,
            issues: (analysis.validation.issues.errors?.length || 0) + 
                   (analysis.validation.issues.warnings?.length || 0)
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Config reload failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };
}