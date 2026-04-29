import React from 'react';
export function LogsToolLeft({ logsTree, renderFileTree }: any) {
  return (
    <>
      {renderFileTree(logsTree, false, true)}
    </>
  );
}
