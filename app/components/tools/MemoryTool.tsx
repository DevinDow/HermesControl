import React from 'react';
import { FileTree } from './FileTree';

export function MemoryToolLeft({ memoryTree, ...props }: any) {
  return (
    <FileTree nodes={memoryTree} {...props} />
  );
}
