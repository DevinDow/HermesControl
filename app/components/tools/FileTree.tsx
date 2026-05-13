import React from 'react';
import { ChevronRight, Folder, FileText, Parentheses, ScrollText, Braces, Brackets, FileCode, FileCog, ChevronsLeftRight, Terminal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from './utils/dateFormatting';

// Recursively renders a FILETREE structure as interactive UI components
// Parameters:
//   - nodes: array of file/folder nodes to render
// Returns: hierarchical div[] (each div has children div[] or button)
export function FileTree({ 
  nodes, 
  matchesFilter,
  selectedFilePath,
  setSelectedFilePath,
  collapsibleFolders = false, 
  expandedFolders, 
  setExpandedFolders
}: any) {
  return (
    <>

      {/* Iterate over each node (FILE or DIRECTORY) and render accordingly */}
      {nodes.map((node: any) => {

        // DIRECTORY
        if (node.type === 'directory') {
          {/* Determine if this directory should be rendered as expanded or collapsed based on whether its path is in the expandedFolders set (for recursive mode) */}
          const isExpanded = collapsibleFolders ? expandedFolders.has(node.path) : true;

         // CHILDREN
          const children = (
            <FileTree 
              nodes={node.children} 
              collapsibleFolders={collapsibleFolders} 
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
              matchesFilter={matchesFilter}
              setSelectedFilePath={setSelectedFilePath}
              selectedFilePath={selectedFilePath}
            />
          );

          // FOLDER is collapsible
          if (collapsibleFolders) {
            return (
              <div key={node.path}>
                {/* FOLDER - clickable to expand/collapse */}
                <button
                  onClick={() => {
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
                    "w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold transition-all hover:bg-[#222222]/50 group",
                    isExpanded ? "text-[#FFBF00]" : "text-[#B8860B]"
                  )}
                >
                  <ChevronRight size={12} className={cn("transition-transform", isExpanded ? "rotate-90" : "")} />
                  <Folder size={12} />
                  <span className="uppercase tracking-wider">{node.name}</span>
                </button>
                
                {/* render CHILDREN if `isExpanded` */}
                {isExpanded && (
                  <div className="ml-2 border-l border-[#1F1F1F]">
                    {children}
                  </div>
                )}
              </div>
            );
          }

          // FOLDER is always-expanded section header
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
                setSelectedFilePath(node.path); 
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-[13px] transition-all flex flex-col gap-0.5 border border-transparent group",
                selectedFilePath === node.path
                  ? "bg-[#222222] text-[#FFF8DC] border-[#1F1F1F]"
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
