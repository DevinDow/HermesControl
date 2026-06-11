import React from 'react';
import { FolderOpen, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RecursiveTree } from './utils/RecursiveTree';
import { TreeFileRow } from './utils/TreeFileRow';

// Recursively renders a FILETREE structure as interactive UI components
// Parameters:
//   - scriptsTree: array of file/folder nodes to render
// Returns: calls recursive renderScriptsTreeWithExecute(), returns a div containing a hierarchical div[] (each div has children div[] or div w/ 2 buttons)
export function ScriptsToolLeft({ 
  scriptsTree, 
  folderPath,
  matchesFilter,
  selectedFilePath,
  setSelectedFilePath,
  onReselectFile,
  setActiveTab, 
  setPendingCommand, 
}: any) {


  // renderDirectory(): renders a FOLDER node as a div with folder icon + name, and children (indented) if expanded
  const renderDirectory = (node: any, children: React.ReactNode) => (
    <div key={node.path}>

      {/* FOLDER */}
      <div className="flex items-center gap-2 px-2 py-2 text-[11px] font-bold text-[#FFBF00] uppercase tracking-wider">
        <FolderOpen size={12} />
        {node.name}
      </div>

      {/* CHILDREN recursively */}
      <div className="ml-2 border-l border-[#1F1F1F]">
        {children}
      </div>
    </div>
  );


  // renderFile(): renders a FILE node as a div with TreeFileRow + "Play" button to execute script
  const renderFile = (node: any) => {
    if (!matchesFilter(node.name)) return null;

    return (
    <div key={node.path} className="group flex items-center gap-1 pr-2">
      {/* FILE - clickable to select */}
      <div className="flex-1 min-w-0">
        <TreeFileRow
          node={node}
          selectedFilePath={selectedFilePath}
          onSelectFile={setSelectedFilePath}
          onReselectFile={onReselectFile}
        />
      </div>

      {/* PLAY button to send "python3 <file_path>.py" to Cmd Tool */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setPendingCommand(node.path);
          setActiveTab('Cmd');
        }}
        className="p-1.5 rounded bg-[#222222] border border-[#1F1F1F] text-[#B8860B] hover:text-[#FFBF00] hover:border-[#FFBF00]/30"
        title="Execute Script"
      >
        <Play size={12} />
      </button>
    </div>
    );
  };


  return (
    <>
      {/* Folder Path Header */}
      <div className="text-sm font-semibold p-2 pl-1 text-[#FFBF00]">
        {folderPath}
      </div>

      {/* RecursiveTree calls `renderDirectory` and `renderFile` for each node */}
      <RecursiveTree
        nodes={scriptsTree}
        renderDirectory={renderDirectory}
        renderFile={renderFile}
      />
    </>
  );
}
