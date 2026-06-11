import React from 'react';
import { FileText, Parentheses, ScrollText, Braces, Brackets, FileCog, ChevronsLeftRight, Terminal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatRelativeTime } from './dateFormatting';

const iconMap = {
  md: ScrollText,
  html: ChevronsLeftRight,
  py: Parentheses,
  sh: Terminal,
  json: Braces,
  jsonl: Brackets,
  log: FileCog,
};

type TreeFileRowProps = {
  node: any;
  selectedFilePath?: string;
  onSelectFile: (path: string) => void;
  onReselectFile?: () => void;
};

export function TreeFileRow({
  node,
  selectedFilePath,
  onSelectFile,
  onReselectFile,
}: TreeFileRowProps) {
  const ext = node.name.split('.').pop().toLowerCase();
  const IconComponent = iconMap[ext] || FileText;

  return (
    // FILE - clickable to select/reselect, icon based on file extension, shows relative updated time
    <button
      key={node.path}
      onClick={() => {
        if (selectedFilePath === node.path) {
          onReselectFile?.();
        } else {
          onSelectFile(node.path);
        }
      }}
      className={cn(
        'w-full text-left px-2 py-1 rounded-md text-[13px] transition-all flex flex-col border border-transparent group',
        selectedFilePath === node.path
          ? 'bg-[#222222] text-[#FFF8DC] border-[#333333]'
          : 'text-[#B8860B] hover:text-[#FFF8DC] hover:bg-[#222222]/50'
      )}
    >
      {/* File Icon + Name */}
      <div className="flex items-center gap-2 w-full">
        <IconComponent
          size={14}
          className={cn(
            'shrink-0 transition-colors',
            selectedFilePath === node.path ? 'text-[#FFBF00]' : 'text-[#B8860B] group-hover:text-[#B8860B]'
          )}
        />
        <span className={cn('truncate flex-1')}>{node.name}</span>
      </div>

      {/* Time (relative formatting) (updatedAt) */}
      {node.updatedAt && (() => {
        const { text, color } = formatRelativeTime(node.updatedAt);
        return (
          <div className={cn('text-[10px] font-mono ml-6 transition-colors', color)} suppressHydrationWarning>
            {text}
          </div>
        );
      })()}
    </button>
  );
}