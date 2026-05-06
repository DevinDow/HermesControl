import React from 'react';
import { FileTree } from './FileTree';

export function SpecsToolLeft({ specsTree, ...props }: any) {
  return (
    <FileTree nodes={specsTree} {...props} />
  );
}
