import * as vscode from 'vscode';
import { MetadataReader } from './metadata-reader';
import { TDI2Metadata, InterfaceData } from './types';

/**
 * Provides rich hover documentation for Inject<> type markers
 */
export class TDI2HoverProvider implements vscode.HoverProvider {
  constructor(private metadataReader: MetadataReader) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    // Get the line and check if it contains Inject<>
    const line = document.lineAt(position).text;
    const match = this.findInjectPattern(line, position.character);

    if (!match) {
      return null;
    }

    // Load metadata
    const metadata = await this.metadataReader.getMetadata(document.uri);
    if (!metadata) {
      return null;
    }

    // Look up interface data
    const interfaceData = metadata.interfaces[match.interfaceName];
    if (!interfaceData) {
      return this.createUnresolvedHover(match.interfaceName);
    }

    // Create rich hover content
    return this.createHover(match.interfaceName, interfaceData, metadata);
  }

  /**
   * Find Inject<InterfaceName> pattern at cursor position
   */
  private findInjectPattern(line: string, charPosition: number): { interfaceName: string; start: number; end: number } | null {
    // Pattern: Inject<InterfaceName> or InjectOptional<InterfaceName>
    const pattern = /\b(Inject(?:Optional)?)<(\w+)>/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Check if cursor is within this match
      if (charPosition >= start && charPosition <= end) {
        return {
          interfaceName: match[2],
          start,
          end
        };
      }
    }

    return null;
  }

  /**
   * Create hover for resolved interface
   */
  private createHover(interfaceName: string, data: InterfaceData, metadata: TDI2Metadata): vscode.Hover {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    // Header
    md.appendMarkdown(`### 💉 ${interfaceName}\n\n`);

    // Selected implementation
    const selected = data.implementations.find(impl => impl.isSelected);
    if (selected) {
      md.appendMarkdown(`✅ **Resolves to:** \`${selected.implementationClass}\`\n\n`);

      // File link (clickable!)
      const fileUri = this.createFileUri(selected.implementationPath, selected.implementationLocation.line);
      md.appendMarkdown(`📍 [${this.getRelativePath(selected.implementationPath)}:${selected.implementationLocation.line}](${fileUri})\n\n`);

      // Scope
      md.appendMarkdown(`⚙️  **Scope:** ${selected.scope}\n\n`);

      // Selection reason
      if (selected.selectionReason) {
        md.appendMarkdown(`💡 **Reason:** ${selected.selectionReason}\n\n`);
      }

      // Dependencies
      if (selected.dependencies && selected.dependencies.length > 0) {
        md.appendMarkdown(`**Dependencies:**\n`);
        selected.dependencies.forEach(dep => {
          const optional = dep.isOptional ? ' _(optional)_' : '';
          md.appendMarkdown(`- ${dep.interfaceName}${optional}\n`);
        });
        md.appendMarkdown('\n');
      }

      // Ambiguity warning
      if (data.hasAmbiguity) {
        md.appendMarkdown(`⚠️  **Warning:** Multiple implementations found\n\n`);
        md.appendMarkdown(`**Other implementations:**\n`);
        data.implementations
          .filter(impl => !impl.isSelected)
          .forEach(impl => {
            md.appendMarkdown(`- ${impl.implementationClass}\n`);
          });
        md.appendMarkdown('\n');
      }
    }

    // Total implementations count
    if (data.totalImplementations > 1) {
      md.appendMarkdown(`\n---\n`);
      md.appendMarkdown(`📊 ${data.totalImplementations} implementation(s) found\n`);
    }

    return new vscode.Hover(md);
  }

  /**
   * Create hover for unresolved interface
   */
  private createUnresolvedHover(interfaceName: string): vscode.Hover {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`### 💉 ${interfaceName}\n\n`);
    md.appendMarkdown(`❌ **Not Resolved**\n\n`);
    md.appendMarkdown(`No @Service() implementation found for this interface.\n\n`);
    md.appendMarkdown(`**Possible reasons:**\n`);
    md.appendMarkdown(`- Missing @Service() decorator on implementation class\n`);
    md.appendMarkdown(`- Implementation not scanned (check scanDirs in config)\n`);
    md.appendMarkdown(`- Metadata needs refresh (run build)\n`);

    return new vscode.Hover(md);
  }

  /**
   * Create vscode:// URI for file navigation
   */
  private createFileUri(filePath: string, line: number): string {
    // If absolute path, use it directly
    if (path.isAbsolute(filePath)) {
      return vscode.Uri.file(filePath).with({ fragment: `L${line}` }).toString();
    }

    // Otherwise, resolve relative to workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const absolutePath = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
      return absolutePath.with({ fragment: `L${line}` }).toString();
    }

    return '#';
  }

  /**
   * Get relative path for display
   */
  private getRelativePath(filePath: string): string {
    // Remove leading slash or workspace prefix
    return filePath.replace(/^\//, '').replace(/^.*?\/src\//, 'src/');
  }
}

// Import path module
import * as path from 'path';
