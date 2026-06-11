import React from 'react';

type TreeNode = {
  type: 'directory' | 'file';
  path: string;
  name: string;
  children?: TreeNode[];
  [key: string]: any;
};

type RecursiveTreeProps = {
  nodes: TreeNode[];
  renderDirectory: (node: TreeNode, children: React.ReactNode) => React.ReactNode;
  renderFile: (node: TreeNode) => React.ReactNode;
};

export function RecursiveTree({ nodes, renderDirectory, renderFile }: RecursiveTreeProps) {
  const renderNodes = (currentNodes: TreeNode[]) => {
    return currentNodes.map((node) => {
      // Keep the `key` on the mapped wrapper so React can track each tree node across nested renders.
      return (
        <React.Fragment key={node.path}>
          {node.type === 'directory'
            ? renderDirectory(node, <>{renderNodes(node.children ?? [])}</>)
            : renderFile(node)}
        </React.Fragment>
      );
    });
  };

  return <>{renderNodes(nodes)}</>;
}