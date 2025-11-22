import * as vscode from 'vscode';
import { MetadataReader } from './metadata-reader';

/**
 * Provides CodeLens "Go to Implementation" links above Inject<> markers
 */
export class TDI2CodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(private metadataReader: MetadataReader) {
    // Refresh CodeLens when metadata changes
    // (you could listen to file system events here)
  }

  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];

    // Load metadata
    const metadata = await this.metadataReader.getMetadata(document.uri);
    if (!metadata) {
      return codeLenses;
    }

    // Scan document for Inject<> patterns
    const text = document.getText();
    const pattern = /\b(Inject(?:Optional)?)<(\w+)>/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const interfaceName = match[2];
      const interfaceData = metadata.interfaces[interfaceName];

      if (!interfaceData) {
        continue;
      }

      const selected = interfaceData.implementations.find(impl => impl.isSelected);
      if (!selected) {
        continue;
      }

      // Create CodeLens at the match position
      const position = document.positionAt(match.index);
      const range = new vscode.Range(position, position);

      // Create command to navigate to implementation
      const command: vscode.Command = {
        title: `→ ${selected.implementationClass}`,
        command: 'vscode.open',
        arguments: [
          this.createFileUri(selected.implementationPath, selected.implementationLocation.line)
        ],
        tooltip: `Go to ${selected.implementationClass} implementation`
      };

      codeLenses.push(new vscode.CodeLens(range, command));
    }

    return codeLenses;
  }

  /**
   * Refresh all CodeLens
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Create URI for file navigation
   */
  private createFileUri(filePath: string, line: number): vscode.Uri {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (filePath.startsWith('/')) {
      // Absolute path
      return vscode.Uri.file(filePath).with({ fragment: `L${line}` });
    }

    // Relative path - resolve to workspace
    if (workspaceFolders && workspaceFolders.length > 0) {
      return vscode.Uri.joinPath(workspaceFolders[0].uri, filePath).with({ fragment: `L${line}` });
    }

    // Fallback
    return vscode.Uri.file(filePath).with({ fragment: `L${line}` });
  }
}
