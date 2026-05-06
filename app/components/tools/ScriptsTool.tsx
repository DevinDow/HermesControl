import React from 'react';
import { Play } from 'lucide-react';
import { FileTree } from './FileTree';

export function ScriptsToolLeft({ scriptsTree, setActiveTab, ...props }: any) {
  // Enhanced render function to inject the Execute button
  const renderScriptsWithExecute = (nodes: any[]) => {

    {/* Iterate over each node (FILE or DIRECTORY) and render accordingly */}
    return nodes.map((node: any) => {

      // DIRECTORY
      if (node.type === 'directory') {
        return (
          <div key={node.path}>

            {/* FOLDER */}
            <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#FFBF00] uppercase tracking-wider">
              {node.name}
            </div>

            {/* CHILDREN recursively */}
            <div className="ml-2 border-l border-[#1F1F1F]">
              {renderScriptsWithExecute(node.children)}
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
                setActiveTab('Cmd');
                // Use a short delay to ensure the Cmd tab is rendered and the input is available
                setTimeout(() => {
                  const cmdInput = document.querySelector('input[name="command"]') as HTMLInputElement;
                  if (cmdInput) {
                    const fullPath = node.path.startsWith('/') ? node.path : `workspace/${node.path}`;
                    cmdInput.value = `python3 ${fullPath}`;
                    cmdInput.focus();
                  }
                }, 100);
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
    <div className="space-y-1">
      {renderScriptsWithExecute(scriptsTree)}
    </div>
  );
}
