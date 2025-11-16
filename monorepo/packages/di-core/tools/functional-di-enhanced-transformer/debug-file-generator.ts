// tools/functional-di-enhanced-transformer/debug-file-generator.ts - Generates debug files

import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../config-manager';
import { TransformationOptions } from './types';
import { consoleFor } from '../logger';

const console = consoleFor('di-core:debug-file-generator');

export class DebugFileGenerator {
  constructor(
    private configManager: ConfigManager,
    private options: TransformationOptions
  ) {}

  /**
   * Generate debug files for transformed components
   */
  async generateDebugFiles(transformedFiles: Map<string, string>): Promise<void> {
    if (!this.options.generateDebugFiles) return;

    const transformedDir = this.configManager.getTransformedDir();
    
    if (!fs.existsSync(transformedDir)) {
      fs.mkdirSync(transformedDir, { recursive: true });
    }

    for (const [originalPath, transformedContent] of transformedFiles) {
      try {
        await this.generateSingleDebugFile(originalPath, transformedContent, transformedDir);
      } catch (error) {
        console.warn(`⚠️  Failed to write debug file for ${originalPath}:`, error);
      }
    }

    // Generate summary file
    await this.generateTransformationSummary(transformedFiles, transformedDir);

    if (this.options.verbose) {
      console.log(`📝 Generated ${transformedFiles.size} debug files in ${transformedDir}`);
    }
  }

  /**
   * Generate debug file for a single transformed component
   */
  private async generateSingleDebugFile(
    originalPath: string,
    transformedContent: string,
    transformedDir: string
  ): Promise<void> {
    // Find which scanDir this file belongs to for correct relative path
    const scanDirs = this.options.scanDirs || ["./src"];
    const absolutePath = path.resolve(originalPath);
    const matchingScanDir = scanDirs.find(dir => absolutePath.startsWith(path.resolve(dir)));
    const baseDir = matchingScanDir ? path.resolve(matchingScanDir) : path.resolve(scanDirs[0]);

    const relativePath = path.relative(baseDir, originalPath);
    const debugPath = path.join(transformedDir, relativePath.replace(/\.(ts|tsx)$/, '.di-transformed.$1'));
    
    const debugDir = path.dirname(debugPath);
    if (!fs.existsSync(debugDir)) {
      await fs.promises.mkdir(debugDir, { recursive: true });
    }
    
    const debugContent = this.generateDebugFileContent(originalPath, transformedContent, relativePath);
    
    await fs.promises.writeFile(debugPath, debugContent, 'utf8');
    
    if (this.options.verbose) {
      console.log(`📝 Generated debug file: ${path.relative(process.cwd(), debugPath)}`);
    }
  }

  /**
   * Generate content for debug file
   */
  private generateDebugFileContent(
    originalPath: string,
    transformedContent: string,
    relativePath: string
  ): string {
    const header = this.generateDebugHeader(relativePath);
    const analysis = this.analyzeTransformedContent(transformedContent);
    const footer = this.generateDebugFooter(analysis);

    return `${header}\n\n${transformedContent}\n\n${footer}`;
  }

  /**
   * Generate debug file header
   */
  private generateDebugHeader(relativePath: string): string {
    return `/*
 * TDI2 Functional DI - Transformed File
 * =====================================
 * 
 * Original: ${relativePath}
 * Config: ${this.configManager.getConfigHash()}
 * Generated: ${new Date().toISOString()}
 * 
 * This file shows the result of functional DI transformation.
 * Do not edit manually - regenerate using 'npm run di:enhanced'
 * 
 * Transformations applied:
 * - Interface-based dependency resolution
 * - DI hook injection
 * - Services object creation
 * - Destructuring pattern updates
 */`;
  }

  /**
   * Generate debug file footer
   */
  private generateDebugFooter(analysis: TransformationAnalysis): string {
    return `/*
 * Transformation Analysis
 * =====================
 * 
 * DI Hooks Injected: ${analysis.diHooksCount}
 * Services Resolved: ${analysis.servicesCount}
 * Import Statements Added: ${analysis.importsAdded}
 * Destructuring Patterns Modified: ${analysis.destructuringModified}
 * 
 * Services Detected:
${analysis.services.map(service => ` * - ${service.name}: ${service.type} (${service.hook})`).join('\n')}
 * 
 * Warnings:
${analysis.warnings.map(warning => ` * - ${warning}`).join('\n')}
 */`;
  }

  /**
   * Analyze transformed content for debug information
   */
  private analyzeTransformedContent(content: string): TransformationAnalysis {
    const lines = content.split('\n');
    const services: ServiceInfo[] = [];
    const warnings: string[] = [];
    let diHooksCount = 0;
    let importsAdded = 0;
    let destructuringModified = 0;

    for (const line of lines) {
      // Count DI hooks
      if (line.includes('useService(') || line.includes('useOptionalService(')) {
        diHooksCount++;
        
        // Extract service information
        const serviceMatch = line.match(/const\s+(\w+)\s*=\s*(useService|useOptionalService)\('([^']+)'\)/);
        if (serviceMatch) {
          services.push({
            name: serviceMatch[1],
            type: serviceMatch[3],
            hook: serviceMatch[2],
            isOptional: serviceMatch[2] === 'useOptionalService'
          });
        }
      }

      // Count imports
      if (line.includes('import') && (line.includes('useService') || line.includes('useOptionalService'))) {
        importsAdded++;
      }

      // Count destructuring modifications
      if (line.includes('const {') && line.includes('} = props') && !line.includes('services')) {
        destructuringModified++;
      }

      // Detect warnings
      if (line.includes('// Warning:') || line.includes('// Optional dependency not found')) {
        warnings.push(line.trim().replace(/^\s*\/\/\s*/, ''));
      }
    }

    return {
      diHooksCount,
      servicesCount: services.length,
      importsAdded,
      destructuringModified,
      services,
      warnings
    };
  }

  /**
   * Generate transformation summary file
   */
  private async generateTransformationSummary(
    transformedFiles: Map<string, string>,
    transformedDir: string
  ): Promise<void> {
    const summaryPath = path.join(transformedDir, 'transformation-summary.md');
    
    const summary = this.generateSummaryContent(transformedFiles);
    
    await fs.promises.writeFile(summaryPath, summary, 'utf8');
    
    if (this.options.verbose) {
      console.log(`📊 Generated transformation summary: ${summaryPath}`);
    }
  }

  /**
   * Generate summary content
   */
  private generateSummaryContent(transformedFiles: Map<string, string>): string {
    const totalFiles = transformedFiles.size;
    let totalHooks = 0;
    let totalServices = 0;
    const fileAnalyses: Array<{ file: string; analysis: TransformationAnalysis }> = [];

    for (const [filePath, content] of transformedFiles) {
      const analysis = this.analyzeTransformedContent(content);
      totalHooks += analysis.diHooksCount;
      totalServices += analysis.servicesCount;

      // Find which scanDir this file belongs to for correct relative path
      const scanDirs = this.options.scanDirs || ["./src"];
      const absolutePath = path.resolve(filePath);
      const matchingScanDir = scanDirs.find(dir => absolutePath.startsWith(path.resolve(dir)));
      const baseDir = matchingScanDir ? path.resolve(matchingScanDir) : path.resolve(scanDirs[0]);

      fileAnalyses.push({
        file: path.relative(baseDir, filePath),
        analysis
      });
    }

    return `# TDI2 Functional DI Transformation Summary

Generated: ${new Date().toISOString()}
Config: ${this.configManager.getConfigHash()}

## Overall Statistics

- **Files Transformed**: ${totalFiles}
- **Total DI Hooks**: ${totalHooks}
- **Total Services**: ${totalServices}
- **Average Services per File**: ${totalFiles > 0 ? (totalServices / totalFiles).toFixed(2) : 0}

## File-by-File Analysis

${fileAnalyses.map(({ file, analysis }) => this.generateFileAnalysis(file, analysis)).join('\n\n')}

## Service Type Distribution

${this.generateServiceDistribution(fileAnalyses)}

## Common Patterns

${this.generateCommonPatterns(fileAnalyses)}

## Warnings and Issues

${this.generateWarningsSummary(fileAnalyses)}

---

*This summary was automatically generated by TDI2 Functional DI Transformer*
`;
  }

  /**
   * Generate analysis for a single file
   */
  private generateFileAnalysis(file: string, analysis: TransformationAnalysis): string {
    return `### ${file}

- **DI Hooks**: ${analysis.diHooksCount}
- **Services**: ${analysis.servicesCount}
- **Warnings**: ${analysis.warnings.length}

Services:
${analysis.services.map(service => `- \`${service.name}\`: ${service.type} (${service.isOptional ? 'optional' : 'required'})`).join('\n')}

${analysis.warnings.length > 0 ? `Warnings:\n${analysis.warnings.map(w => `- ${w}`).join('\n')}` : ''}`;
  }

  /**
   * Generate service type distribution
   */
  private generateServiceDistribution(
    fileAnalyses: Array<{ file: string; analysis: TransformationAnalysis }>
  ): string {
    const serviceTypes = new Map<string, number>();
    const hookTypes = new Map<string, number>();

    for (const { analysis } of fileAnalyses) {
      for (const service of analysis.services) {
        serviceTypes.set(service.type, (serviceTypes.get(service.type) || 0) + 1);
        hookTypes.set(service.hook, (hookTypes.get(service.hook) || 0) + 1);
      }
    }

    const serviceTypesList = Array.from(serviceTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `- **${type}**: ${count} usages`)
      .join('\n');

    const hookTypesList = Array.from(hookTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([hook, count]) => `- **${hook}**: ${count} usages`)
      .join('\n');

    return `**Service Types:**
${serviceTypesList}

**Hook Types:**
${hookTypesList}`;
  }

  /**
   * Generate common patterns analysis
   */
  private generateCommonPatterns(
    fileAnalyses: Array<{ file: string; analysis: TransformationAnalysis }>
  ): string {
    const patterns: string[] = [];

    const avgServicesPerFile = fileAnalyses.reduce((sum, { analysis }) => sum + analysis.servicesCount, 0) / fileAnalyses.length;
    if (avgServicesPerFile > 3) {
      patterns.push('- High service dependency count (consider breaking down components)');
    }

    const optionalServicesCount = fileAnalyses.reduce((sum, { analysis }) => 
      sum + analysis.services.filter(s => s.isOptional).length, 0
    );
    if (optionalServicesCount > 0) {
      patterns.push(`- Optional dependencies used (${optionalServicesCount} total)`);
    }

    const warningsCount = fileAnalyses.reduce((sum, { analysis }) => sum + analysis.warnings.length, 0);
    if (warningsCount > 0) {
      patterns.push(`- Unresolved dependencies detected (${warningsCount} warnings)`);
    }

    return patterns.length > 0 ? patterns.join('\n') : '- No significant patterns detected';
  }

  /**
   * Generate warnings summary
   */
  private generateWarningsSummary(
    fileAnalyses: Array<{ file: string; analysis: TransformationAnalysis }>
  ): string {
    const allWarnings = fileAnalyses.flatMap(({ file, analysis }) => 
      analysis.warnings.map(warning => ({ file, warning }))
    );

    if (allWarnings.length === 0) {
      return 'No warnings detected ✅';
    }

    return allWarnings.map(({ file, warning }) => `- **${file}**: ${warning}`).join('\n');
  }

  /**
   * Generate HTML debug report
   */
  async generateHTMLReport(transformedFiles: Map<string, string>): Promise<void> {
    const reportPath = path.join(this.configManager.getTransformedDir(), 'transformation-report.html');
    
    const htmlContent = this.generateHTMLContent(transformedFiles);
    
    await fs.promises.writeFile(reportPath, htmlContent, 'utf8');
    
    if (this.options.verbose) {
      console.log(`📊 Generated HTML report: ${reportPath}`);
    }
  }

  /**
   * Generate HTML report content
   */
  private generateHTMLContent(transformedFiles: Map<string, string>): string {
    const summaryContent = this.generateSummaryContent(transformedFiles);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TDI2 Transformation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
        .stat-card { background: white; border: 1px solid #e9ecef; padding: 16px; border-radius: 6px; }
        .stat-value { font-size: 2em; font-weight: bold; color: #0066cc; }
        .stat-label { color: #6c757d; font-size: 0.9em; }
        .markdown { white-space: pre-wrap; }
        .file-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .warning { color: #dc3545; }
        .success { color: #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 TDI2 Functional DI Transformation Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Config: <code>${this.configManager.getConfigHash()}</code></p>
    </div>
    
    <div class="markdown">${summaryContent.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
  }
}

// Supporting interfaces
interface ServiceInfo {
  name: string;
  type: string;
  hook: string;
  isOptional: boolean;
}

interface TransformationAnalysis {
  diHooksCount: number;
  servicesCount: number;
  importsAdded: number;
  destructuringModified: number;
  services: ServiceInfo[];
  warnings: string[];
}