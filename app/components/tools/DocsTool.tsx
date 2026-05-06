import React from 'react';
import { FileTree } from './FileTree';

export function DocsToolLeft({ docsTree, ...props }: any) {
  return (
    <FileTree nodes={docsTree} isDocs={true} {...props} />
  );
}
