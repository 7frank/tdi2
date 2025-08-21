// API routes for TDI2 serve module

import { Express, Request, Response } from 'express';
import { DIAnalytics } from '../../analytics/index.js';
import type { ServerOptions, AnalysisResponse, GraphResponse } from '../types.js';
import { createAnalysisHandler } from './analysis.js';
import { createGraphHandler } from './graph.js';

export function setupRoutes(
  app: Express, 
  analytics: DIAnalytics, 
  options: ServerOptions
): void {
  const analysisHandler = createAnalysisHandler(analytics, options);
  const graphHandler = createGraphHandler(analytics, options);

  // Analysis endpoints
  app.get('/api/analysis', analysisHandler.getFullAnalysis);
  app.get('/api/analysis/validate', analysisHandler.getValidation);
  app.get('/api/analysis/trace/:token', analysisHandler.traceService);
  app.get('/api/analysis/problems', analysisHandler.getProblems);
  app.post('/api/analysis/reload', analysisHandler.reloadConfig);

  // Graph endpoints  
  app.get('/api/graph', graphHandler.getGraph);
  app.get('/api/graph/nodes', graphHandler.getNodes);
  app.get('/api/graph/edges', graphHandler.getEdges);
  app.post('/api/graph/filter', graphHandler.filterGraph);
  app.get('/api/graph/layout/:type', graphHandler.getLayout);

  // Configuration endpoints
  app.get('/api/config', (req: Request, res: Response) => {
    try {
      const configInfo = {
        srcPath: options.srcPath,
        verbose: options.verbose,
        watch: options.watch,
        port: options.port,
        timestamp: new Date().toISOString()
      };
      res.json(configInfo);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // System endpoints
  app.get('/api/system/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      analytics: 'ready',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/system/metrics', async (req: Request, res: Response) => {
    try {
      // Basic system metrics
      const metrics = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      };
      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get system metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Error handling for API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      availableEndpoints: [
        'GET /api/analysis',
        'GET /api/analysis/validate', 
        'GET /api/analysis/trace/:token',
        'GET /api/analysis/problems',
        'POST /api/analysis/reload',
        'GET /api/graph',
        'GET /api/graph/nodes',
        'GET /api/graph/edges', 
        'POST /api/graph/filter',
        'GET /api/graph/layout/:type',
        'GET /api/config',
        'GET /api/system/health',
        'GET /api/system/metrics'
      ]
    });
  });
}