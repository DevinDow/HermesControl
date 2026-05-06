import React from 'react';
import { ChevronRight, Folder, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from './utils/dateFormatting';

// Recursively renders a file tree structure as interactive UI components
// Parameters:
//   - nodes: array of file/folder nodes to render
//   - isSystem: whether this is a System folder tree (shows expand/collapse UI)
//   - isDocs: whether this is a Docs folder tree (shows expand/collapse UI)
export function FileTree({ 
  nodes, 
  isSystem = false, 
  isDocs = false, 
  expandedSystemFolders, 
  setExpandedSystemFolders, 
  expandedDocsFolders, 
  setExpandedDocsFolders, 
  filterText,
  matchesFilter,
  setSelectedFilePath,
  setSelectedSessionId,
  setSelectedTaskId,
  setSelectedEventId,
  selectedFilePath
}: any) {
  return (
    <>
      {nodes.map((node: any) => {
        // ========== DIRECTORY NODE HANDLING ==========
        if (node.type === 'directory') {
          const isExpanded = isSystem 
            ? expandedSystemFolders.has(node.path) 
            : (isDocs ? expandedDocsFolders.has(node.path) : true);
          
          const children = (
            <FileTree 
              nodes={node.children} 
              isSystem={isSystem} 
              isDocs={isDocs}
              expandedSystemFolders={expandedSystemFolders}
              setExpandedSystemFolders={setExpandedSystemFolders}
              expandedDocsFolders={expandedDocsFolders}
              setExpandedDocsFolders={setExpandedDocsFolders}
              filterText={filterText}
              matchesFilter={matchesFilter}
              setSelectedFilePath={setSelectedFilePath}
              selectedFilePath={selectedFilePath}
            />
          );
          
          // Check if any children will be visible (not filtered out)
          // Note: In React, we can't easily check children visibility this way without pre-filtering
          // but for simplicity in refactor, we'll keep the logic. 
          // However, node.children pre-filtering is safer.
          
          if (isSystem || isDocs) {
            return (
              <div key={node.path}>
                <button
                  onClick={() => {
                    const setter = isSystem ? setExpandedSystemFolders : setExpandedDocsFolders;
                    setter((prev: Set<string>) => {
                      const next = new Set(prev);
                      if (next.has(node.path)) next.delete(node.path);
                      else next.add(node.path);
                      return next;
                    });
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold transition-all hover:bg-[#222222]/50 group",
                    isExpanded ? "text-[#FFBF00]" : "text-[#B8860B]"
                  )}
                >
                  <ChevronRight size={12} className={cn("transition-transform", isExpanded ? "rotate-90" : "")} />
                  <Folder size={12} />
                  <span className="uppercase tracking-wider">{node.name}</span>
                </button>
                
                {isExpanded && (
                  <div className="ml-2 border-l border-[#1F1F1F]">
                    {children}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={node.path}>
              <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#FFBF00] uppercase tracking-wider">
                <Folder size={12} />
                {node.name}
              </div>
              <div className="ml-2 border-l border-[#1F1F1F]">
                {children}
              </div>
            </div>
          );
        } 
        
        // ========== FILE NODE HANDLING ==========
        else {
          if (!matchesFilter(node.name)) return null;
          
          return (
            <button
              key={node.path}
              onClick={() => { 
                setSelectedFilePath(node.path); 
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex flex-col gap-0.5 border border-transparent group",
                selectedFilePath === node.path
                  ? "bg-[#222222] text-[#FFF8DC] border-[#1F1F1F]"
                  : "text-[#B8860B] hover:text-[#FFF8DC] hover:bg-[#222222]/50"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <FileText size={14} className={cn(
                  "shrink-0 transition-colors",
                  selectedFilePath === node.path ? "text-[#FFBF00]" : "text-[#B8860B] group-hover:text-[#B8860B]"
                )} />
                <span className={cn("truncate flex-1")}>{node.name}</span>
              </div>
              
              {node.updatedAt && (() => {
                const { text, color } = formatRelativeTime(node.updatedAt);
                return (
                  <div className={cn("text-[10px] font-mono ml-5 transition-colors", color)} suppressHydrationWarning>
                    {text}
                  </div>
                );
              })()}
            </button>
          );
        }
      })}
    </>
  );
}
