import React from 'react';
import { FileTree } from './FileTree';

export function SystemToolLeft({ systemTree, ...props }: any) {
  return (
    <FileTree nodes={systemTree} isSystem={true} {...props} />
  );
}
