import * as vscode from 'vscode';
import { MetadataReader } from './metadata-reader';
import { TDI2HoverProvider } from './hover-provider';
import { TDI2CodeLensProvider } from './codelens-provider';
import { TDI2DefinitionProvider } from './definition-provider';

/**
 * Extension entry point
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('TDI2 extension activated');

  // Create output channel for logging
  const outputChannel = vscode.window.createOutputChannel('TDI2');
  outputChannel.appendLine('TDI2 extension starting...');

  // Create metadata reader
  const metadataReader = new MetadataReader(outputChannel);

  // Get configuration
  const config = vscode.workspace.getConfiguration('tdi2');

  // Register hover provider
  if (config.get('enableHover', true)) {
    const hoverProvider = new TDI2HoverProvider(metadataReader);
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        ['typescript', 'typescriptreact'],
        hoverProvider
      )
    );
    outputChannel.appendLine('✓ Hover provider registered');
  }

  // Register CodeLens provider
  if (config.get('enableCodeLens', true)) {
    const codeLensProvider = new TDI2CodeLensProvider(metadataReader);
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        ['typescript', 'typescriptreact'],
        codeLensProvider
      )
    );
    outputChannel.appendLine('✓ CodeLens provider registered');

    // Register refresh command
    context.subscriptions.push(
      vscode.commands.registerCommand('tdi2.refreshCodeLens', () => {
        codeLensProvider.refresh();
        vscode.window.showInformationMessage('TDI2 CodeLens refreshed');
      })
    );
  }

  // Register definition provider
  if (config.get('enableDefinitionProvider', true)) {
    const definitionProvider = new TDI2DefinitionProvider(metadataReader);
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        ['typescript', 'typescriptreact'],
        definitionProvider
      )
    );
    outputChannel.appendLine('✓ Definition provider registered');
  }

  // Register refresh metadata command
  context.subscriptions.push(
    vscode.commands.registerCommand('tdi2.refreshMetadata', () => {
      metadataReader.refreshAll();
      vscode.window.showInformationMessage('TDI2 metadata cache cleared');
    })
  );

  // Register show dependency graph command (placeholder)
  context.subscriptions.push(
    vscode.commands.registerCommand('tdi2.showDependencyGraph', () => {
      vscode.window.showInformationMessage('Dependency graph visualization coming soon!');
    })
  );

  // Clean up on deactivation
  context.subscriptions.push({
    dispose: () => metadataReader.dispose()
  });

  outputChannel.appendLine('✓ TDI2 extension activated successfully');
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('TDI2 extension deactivated');
}
