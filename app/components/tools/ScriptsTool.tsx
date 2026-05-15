import React from 'react';
import { FolderOpen, Play } from 'lucide-react';
import { FileTree } from './FileTree';

// Recursively renders a FILETREE structure as interactive UI components
// Parameters:
//   - scriptsTree: array of file/folder nodes to render
// Returns: calls recursive renderScriptsTreeWithExecute(), returns a div containing a hierarchical div[] (each div has children div[] or div w/ 2 buttons)
export function ScriptsToolLeft({ 
  scriptsTree, 
  folderPath,
  setActiveTab, 
  setPendingCommand, 
  ...props 
}: any) {

  // recursives for DIRECTORY CHILDREN
  // renders each FILE with "PLAY" button to execute it in the Cmd Tool
  // Returns: hierarchical div[] (each div has children div[] or div w/ 2 buttons)
  const renderScriptsTreeWithExecute = (nodes: any[]) => {

    {/* Iterate over each node (FILE or DIRECTORY) and render accordingly (returns div[]) */}
    return nodes.map((node: any) => {

      // DIRECTORY
      if (node.type === 'directory') {
        return (
          <div key={node.path}>

            {/* FOLDER */}
            <div className="flex items-center gap-2 px-2 py-2 text-[11px] font-bold text-[#FFBF00] uppercase tracking-wider">
              <FolderOpen size={12} />
              {node.name}
            </div>

            {/* CHILDREN recursively */}
            <div className="ml-2 border-l border-[#1F1F1F]">
              {renderScriptsTreeWithExecute(node.children)}
            </div>
          </div>
        );
      } else {

        // FILE
        return (
          <div key={node.path} className="group flex items-center gap-1 pr-2">
            <div className="flex-1 min-w-0">
              {/* reuse FileTree component for icon, name, relative time, and search highlighting */}
              <FileTree nodes={[node]} {...props} />
            </div>

            {/* PLAY button to send "python3 <file_path>.py" to Cmd Tool */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPendingCommand(node.path);
                setActiveTab('Cmd');
              }}
              className="p-1.5 rounded bg-[#222222] border border-[#1F1F1F] text-[#B8860B] hover:text-[#FFBF00] hover:border-[#FFBF00]/30 opacity-0 group-hover:opacity-100 transition-all"
              title="Execute Script"
            >
              <Play size={12} />
            </button>
          </div>
        );
      }
    });
  };

  return (
    <>
      <div className="text-sm font-semibold text-[#FFBF00]">
        {folderPath}
      </div>

      {renderScriptsTreeWithExecute(scriptsTree)}
    </>
  );
}
