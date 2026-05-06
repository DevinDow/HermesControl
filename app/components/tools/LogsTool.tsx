import React from 'react';
import { FileTree } from './FileTree';

export function LogsToolLeft({ logsTree, ...props }: any) {
  return (
    <FileTree nodes={logsTree} {...props} />
  );
}
