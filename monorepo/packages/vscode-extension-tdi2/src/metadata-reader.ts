import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TDI2Metadata } from './types';

/**
 * Reads and caches TDI2 metadata from .tdi2/eslint-metadata.json
 */
export class MetadataReader {
  private cache = new Map<string, TDI2Metadata>();
  private watchers = new Map<string, fs.FSWatcher>();

  constructor(private outputChannel?: vscode.OutputChannel) {}

  /**
   * Find and read metadata file for a given document
   */
  async getMetadata(documentUri: vscode.Uri): Promise<TDI2Metadata | null> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
    if (!workspaceFolder) {
      return null;
    }

    const rootPath = workspaceFolder.uri.fsPath;

    // Check cache first
    if (this.cache.has(rootPath)) {
      return this.cache.get(rootPath)!;
    }

    // Find .tdi2 directory
    const tdi2Dir = await this.findTDI2Directory(rootPath);
    if (!tdi2Dir) {
      this.log(`No .tdi2 directory found in ${rootPath}`);
      return null;
    }

    // Read metadata file
    const metadataPath = path.join(tdi2Dir, 'eslint-metadata.json');
    const metadata = await this.readMetadataFile(metadataPath);

    if (metadata) {
      this.cache.set(rootPath, metadata);
      this.watchMetadataFile(metadataPath, rootPath);
    }

    return metadata;
  }

  /**
   * Find .tdi2 directory by searching up the directory tree
   */
  private async findTDI2Directory(startPath: string): Promise<string | null> {
    let currentPath = startPath;

    // Search up to 5 levels
    for (let i = 0; i < 5; i++) {
      const tdi2Path = path.join(currentPath, '.tdi2');

      try {
        const stat = await fs.promises.stat(tdi2Path);
        if (stat.isDirectory()) {
          return tdi2Path;
        }
      } catch {
        // Directory doesn't exist, continue searching
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        break; // Reached root
      }
      currentPath = parentPath;
    }

    return null;
  }

  /**
   * Read and parse metadata JSON file
   */
  private async readMetadataFile(filePath: string): Promise<TDI2Metadata | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const metadata = JSON.parse(content) as TDI2Metadata;
      this.log(`Loaded metadata from ${filePath}`);
      return metadata;
    } catch (error) {
      this.log(`Error reading metadata: ${error}`);
      return null;
    }
  }

  /**
   * Watch metadata file for changes
   */
  private watchMetadataFile(filePath: string, rootPath: string): void {
    // Clean up existing watcher
    if (this.watchers.has(rootPath)) {
      this.watchers.get(rootPath)!.close();
    }

    // Create new watcher
    const watcher = fs.watch(filePath, async (eventType) => {
      if (eventType === 'change') {
        this.log(`Metadata file changed, reloading...`);
        this.cache.delete(rootPath);

        // Reload metadata
        const metadata = await this.readMetadataFile(filePath);
        if (metadata) {
          this.cache.set(rootPath, metadata);
        }
      }
    });

    this.watchers.set(rootPath, watcher);
  }

  /**
   * Clear all caches and watchers
   */
  dispose(): void {
    this.cache.clear();
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
  }

  /**
   * Refresh metadata for all workspaces
   */
  refreshAll(): void {
    this.log('Refreshing all metadata...');
    this.cache.clear();
  }

  private log(message: string): void {
    if (this.outputChannel) {
      this.outputChannel.appendLine(`[MetadataReader] ${message}`);
    }
  }
}
