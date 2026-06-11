import React from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RecursiveTree } from './utils/RecursiveTree';
import { TreeFileRow } from './utils/TreeFileRow';

// Recursively renders a FILETREE structure as interactive UI components
// Parameters:
//   - nodes: array of file/folder nodes to render
// Returns: calls recursive renderFileTree(), which returns hierarchical div[] (each div has children div[] or button)
export function FileTree({ 
  nodes, 
  folderPath,
  matchesFilter,
  selectedFilePath,
  setSelectedFilePath,
  onReselectFile,
  collapsibleFolders = false, 
  expandedFolders, 
  setExpandedFolders
}: any) {


  const renderDirectory = (node: any, children: React.ReactNode) => {
    const isExpanded = collapsibleFolders ? expandedFolders.has(node.path) : true;

    // FOLDER is collapsible
    if (collapsibleFolders) {
      return (
        <div key={node.path}>
          {/* FOLDER - clickable to expand/collapse */}
          <button
            onClick={() => {
              {/* adds/removes from expandedFolders */}
              setExpandedFolders((prev: Set<string>) => {
                const next = new Set(prev);
                if (next.has(node.path)) {
                  next.delete(node.path);
                } else {
                  next.add(node.path);
                }
                return next;
              });
            }}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-2 text-[11px] font-bold transition-all hover:bg-[#222222]/50 group",
              isExpanded ? "text-[#FFBF00]" : "text-[#B8860B]"
            )}
          >
            {isExpanded ? <FolderOpen size={12} /> : <Folder size={12} />}
            <span className="uppercase tracking-wider">{node.name}</span>
          </button>

          {/* render CHILDREN if `isExpanded` */}
          {isExpanded && (
            <div className="ml-2 pl-2 border-l border-[#888888]">
              {children}
            </div>
          )}
        </div>
      );
    }

    // FOLDER is always-expanded section header
    return (
      <div key={node.path}>
        <div className="flex items-center gap-2 px-2 py-2 text-[11px] font-bold text-[#FFBF00] uppercase tracking-wider">
          <FolderOpen size={12} />
          {node.name}
        </div>
        <div className="ml-2 pl-2 border-l border-[#888888]">
          {children}
        </div>
      </div>
    );
  };


  const renderFile = (node: any) => {
    if (!matchesFilter(node.name)) return null;

    return (
      <TreeFileRow
        node={node}
        selectedFilePath={selectedFilePath}
        onSelectFile={setSelectedFilePath}
        onReselectFile={onReselectFile}
      />
    );
  };


  return (
    <>
      {/* folderPath is a "Collapse all folders" button */}
      <button
        className={cn("text-sm font-semibold transition-all p-2 pl-1 hover:bg-[#222222]/50 group text-[#FFBF00]")}
        onClick={() => setExpandedFolders(new Set())}
        title="Collapse all folders"
      >
        {folderPath}
      </button>

      {/* RecursiveTree calls `renderDirectory` and `renderFile` for each node */}
      <RecursiveTree
        nodes={nodes}
        renderDirectory={renderDirectory}
        renderFile={renderFile}
      />
    </>
  );
}
