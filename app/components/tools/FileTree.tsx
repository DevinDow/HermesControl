import React from 'react';
import { Folder, FolderOpen, FileText, Parentheses, ScrollText, Braces, Brackets, FileCode, FileCog, ChevronsLeftRight, Terminal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from './utils/dateFormatting';

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

  // renders each FILE, & recursives for DIRECTORY CHILDREN
  // Returns: hierarchical div[] (each div has children div[] or button)
  const renderFileTree = (nodes: any[]) => {

    {/* Iterate over each node (FILE or DIRECTORY) and render accordingly */}
    return nodes.map((node: any) => {

      // DIRECTORY
      if (node.type === 'directory') {
        {/* Determine if this directory should be rendered as expanded or collapsed based on whether its path is in the expandedFolders set (for recursive mode) */}
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
                    if (next.has(node.path)) 
                      next.delete(node.path);
                    else 
                      next.add(node.path);
                    return next;
                  });
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 text-[11px] font-bold transition-all hover:bg-[#222222]/50 group",
                  isExpanded ? "text-[#FFBF00]" : "text-[#B8860B]"
                )}
              >

                {isExpanded ? (
                  <>
                    <FolderOpen size={12} />
                  </>
                ) : (
                  <>
                    <Folder size={12} />
                  </>
                )}
                <span className="uppercase tracking-wider">{node.name}</span>
              </button>
              
              {/* render CHILDREN if `isExpanded` */}
              {isExpanded && (
                <div className="ml-2 pl-2 border-l border-[#888888]">
                  {renderFileTree(node.children)}
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
              {renderFileTree(node.children)}
            </div>
          </div>
        );
      } 
      
      // FILE
      else {
        if (!matchesFilter(node.name)) return null;

        const iconMap = {
          md: ScrollText,
          html: ChevronsLeftRight,
          py: Parentheses,
          sh: Terminal,
          json: Braces,
          jsonl: Brackets,
          log: FileCog,
          // default: FileText (handled below)
        };
        const ext = node.name.split('.').pop().toLowerCase();
        const IconComponent = iconMap[ext] || FileText;

        return (
          <button
            key={node.path}
            onClick={() => {
              if (selectedFilePath === node.path) {
                onReselectFile?.();
              } else {
                setSelectedFilePath(node.path);
              }
            }}
            className={cn(
              "w-full text-left px-2 py-1 rounded-md text-[13px] transition-all flex flex-col border border-transparent group",
              selectedFilePath === node.path
                ? "bg-[#222222] text-[#FFF8DC] border-[#333333]"
                : "text-[#B8860B] hover:text-[#FFF8DC] hover:bg-[#222222]/50"
            )}
          >

            {/* File Icon + Name */}
            <div className="flex items-center gap-2 w-full">
              <IconComponent size={14} className={cn(
                "shrink-0 transition-colors",
                selectedFilePath === node.path ? "text-[#FFBF00]" : "text-[#B8860B] group-hover:text-[#B8860B]"
              )} />
              <span className={cn("truncate flex-1")}>{node.name}</span>
            </div>

            {/* Time (relative formatting) (updatedAt) */}
            {node.updatedAt && (() => {
              const { text, color } = formatRelativeTime(node.updatedAt);
              return (
                <div className={cn("text-[10px] font-mono ml-6 transition-colors", color)} suppressHydrationWarning>
                  {text}
                </div>
              );
            })()}
          </button>
        );
      }
    })}

  return (
    <>
      <button
        className={cn("text-sm font-semibold transition-all p-2 pl-1 hover:bg-[#222222]/50 group text-[#FFBF00]")}
        onClick={() => setExpandedFolders(new Set())}
        title="Collapse all folders"
      >
        {folderPath}
      </button>

      {renderFileTree(nodes)}
    </>
  );
}
