import * as vscode from 'vscode';
import { MetadataReader } from './metadata-reader';

/**
 * Provides Go to Definition (Ctrl+Click) navigation from Inject<> to implementation
 */
export class TDI2DefinitionProvider implements vscode.DefinitionProvider {
  constructor(private metadataReader: MetadataReader) {}

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | null> {
    // Get the word at cursor position
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);

    // Check if we're inside an Inject<> pattern
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

    // Look up interface
    const interfaceData = metadata.interfaces[match.interfaceName];
    if (!interfaceData) {
      return null;
    }

    // Get selected implementation
    const selected = interfaceData.implementations.find(impl => impl.isSelected);
    if (!selected) {
      return null;
    }

    // Create location for the implementation
    const location = this.createLocation(
      selected.implementationPath,
      selected.implementationLocation.line,
      selected.implementationLocation.column
    );

    return location;
  }

  /**
   * Find Inject<InterfaceName> pattern and check if cursor is within it
   */
  private findInjectPattern(line: string, charPosition: number): { interfaceName: string } | null {
    const pattern = /\b(Inject(?:Optional)?)<(\w+)>/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (charPosition >= start && charPosition <= end) {
        return { interfaceName: match[2] };
      }
    }

    return null;
  }

  /**
   * Create VS Code location from file path and position
   */
  private createLocation(filePath: string, line: number, column: number): vscode.Location {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    let uri: vscode.Uri;
    if (filePath.startsWith('/')) {
      // Absolute path
      uri = vscode.Uri.file(filePath);
    } else if (workspaceFolders && workspaceFolders.length > 0) {
      // Relative path - resolve to workspace
      uri = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
    } else {
      // Fallback
      uri = vscode.Uri.file(filePath);
    }

    // Line numbers in VS Code are 0-based, but metadata uses 1-based
    const position = new vscode.Position(Math.max(0, line - 1), column);
    const range = new vscode.Range(position, position);

    return new vscode.Location(uri, range);
  }
}
