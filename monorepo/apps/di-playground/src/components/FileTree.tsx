import React from 'react';
import type { ProjectExample, ProjectFile } from '../examples';

interface FileTreeProps {
  example: ProjectExample;
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
  file?: ProjectFile;
}

function buildTree(files: ProjectFile[]): TreeNode {
  const root: TreeNode = {
    name: 'root',
    path: '',
    isDirectory: true,
    children: [],
  };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let currentNode = root;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');

      if (!currentNode.children) {
        currentNode.children = [];
      }

      let existingNode = currentNode.children.find((child) => child.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLastPart,
          children: isLastPart ? undefined : [],
          file: isLastPart ? file : undefined,
        };
        currentNode.children.push(existingNode);
      }

      currentNode = existingNode;
    });
  });

  return root;
}

function TreeItem({
  node,
  selectedFile,
  onFileSelect,
  depth = 0,
}: {
  node: TreeNode;
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (node.isDirectory) {
    return (
      <>
        {node.name !== 'root' && (
          <div
            className="file-tree-item directory"
            style={{ paddingLeft: `${depth * 12}px` }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="file-tree-icon">{isExpanded ? '📂' : '📁'}</span>
            <span className="file-tree-name">{node.name}</span>
          </div>
        )}
        {isExpanded &&
          node.children?.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              depth={node.name === 'root' ? depth : depth + 1}
            />
          ))}
      </>
    );
  }

  const isSelected = selectedFile === node.path;
  const isGenerated = node.path.includes('.tdi2/');

  const icon = isGenerated
    ? '⚙️' // Generated file icon
    : node.name.endsWith('.tsx')
    ? '⚛️'
    : node.name.endsWith('.ts')
    ? '📘'
    : '📄';

  return (
    <div
      className={`file-tree-item file ${isSelected ? 'selected' : ''} ${isGenerated ? 'generated' : ''}`}
      style={{ paddingLeft: `${depth * 12}px` }}
      onClick={() => onFileSelect(node.path)}
    >
      <span className="file-tree-icon">{icon}</span>
      <span className="file-tree-name">{node.name}</span>
      {isGenerated && <span className="file-badge">Generated</span>}
    </div>
  );
}

export function FileTree({ example, selectedFile, onFileSelect }: FileTreeProps) {
  const tree = React.useMemo(() => buildTree(example.files), [example.files]);

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span className="file-tree-title">{example.name}</span>
      </div>
      <div className="file-tree-content">
        <TreeItem node={tree} selectedFile={selectedFile} onFileSelect={onFileSelect} />
      </div>
    </div>
  );
}
