import React from 'react';
import { Loader2, Edit3, Save, X, Search, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { saveFile } from './utils/fileUtils';
import { MarkdownRenderer } from './MarkdownRenderer';

const ListContext = React.createContext<'ordered' | 'unordered' | null>(null);

const preprocessContent = (text: string) => {
  // Replace silcrow symbols (§) with markdown horizontal rules
  return text.replace(/§/g, '\n---\n');
};

const highlightMatches = (text: any, search: string) => {
  if (!search || typeof text !== 'string') return text;

  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearch})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-[#FFFF00] text-black px-0.5 py-0 rounded" data-search-match="true">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export function FileViewerRight({
  selectedFilePath,
  activeTab,
  isEditing,
  setIsEditing,
  setEditContent,
  fileContent,
  saveLoading,
  setSaveLoading,
  fileSearch,
  setFileSearch,
  setCurrentMatchIndex,
  matchCount,
  setMatchCount,
  currentMatchIndex,
  loading,
  editContent,
  setFileContent
}: any) {
  React.useEffect(() => {
    if (!fileSearch) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }

    const matches = document.querySelectorAll('[data-search-match="true"]');
    setMatchCount(matches.length);
    if (matches.length > 0) {
      const target = matches[currentMatchIndex] || matches[0];
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      matches.forEach((match, idx) => {
        (match as HTMLElement).style.outline = idx === currentMatchIndex ? '2px solid #FFBF00' : 'none';
        (match as HTMLElement).style.boxShadow = idx === currentMatchIndex ? '0 0 10px #FFFF00' : 'none';
      });
    }
  }, [fileSearch, currentMatchIndex, fileContent, setCurrentMatchIndex, setMatchCount]);

  if (!selectedFilePath) return <div className="p-8 text-[#B8860B]">Select a file to view</div>;

  const handleSaveFile = async () => {
    if (!selectedFilePath) return;
    setSaveLoading(true);
    try {
      await saveFile(selectedFilePath, editContent);
      setFileContent(editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
      alert(`Failed to save: ${(err as Error).message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#FFBF00]">{selectedFilePath.split('/').pop()}</h2>
          {(activeTab === 'Docs' || activeTab === 'Memory' || activeTab === 'Specs') && !isEditing && (
            <button
              onClick={() => { setEditContent(fileContent); setIsEditing(true); }}
              className="p-1.5 rounded-md hover:bg-[#1F1F1F] text-[#B8860B] hover:text-[#FFBF00] transition-all"
              title="Edit File"
            >
              <Edit3 size={16} />
            </button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveFile}
                disabled={saveLoading}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all text-[11px] font-bold uppercase"
              >
                {saveLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all text-[11px] font-bold uppercase"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64 flex items-center bg-[#222222] border border-[#1F1F1F] rounded-md overflow-hidden focus-within:border-[#FFBF00]/50">
            <Search size={14} className="ml-2.5 text-[#B8860B]" />
            <input
              type="text"
              placeholder="Find in file..."
              value={fileSearch}
              onChange={(e) => { setFileSearch(e.target.value); setCurrentMatchIndex(0); }}
              className="w-full bg-transparent px-2 py-1.5 text-[12px] text-[#FFF8DC] focus:outline-none"
            />
            {matchCount > 0 && (
              <div className="flex items-center gap-1 px-2 border-l border-[#1F1F1F]">
                <span className="text-[10px] font-mono text-[#B8860B] whitespace-nowrap">{currentMatchIndex + 1}/{matchCount}</span>
                <button
                  onClick={() => setCurrentMatchIndex((prev: number) => (prev > 0 ? prev - 1 : matchCount - 1))}
                  className="p-0.5 hover:text-[#FFBF00] transition-colors"
                >
                  <ChevronRight size={14} className="rotate-180" />
                </button>
                <button
                  onClick={() => setCurrentMatchIndex((prev: number) => (prev < matchCount - 1 ? prev + 1 : 0))}
                  className="p-0.5 hover:text-[#FFBF00] transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 prose prose-invert prose-sm max-w-none">
        {loading.content ? <Loader2 size={32} className="text-[#FFBF00] animate-spin mx-auto mt-20" /> :
          isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full bg-[#080808] text-[#FFF8DC] font-mono text-[13px] leading-relaxed p-4 border border-[#1F1F1F] rounded-xl focus:outline-none focus:border-[#FFBF00]/50 resize-none min-h-[500px]"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSaveFile();
                }
              }}
              spellCheck={false}
              autoFocus
            />
          ) : (selectedFilePath.endsWith('.md') === false) ? (
            <pre className="bg-[#080808] border border-[#1F1F1F] p-6 rounded-xl overflow-x-auto text-[12px] font-mono text-[#FFF8DC] leading-relaxed">
              {(() => {
                try {
                  const processedContent = preprocessContent(fileContent);
                  if (selectedFilePath.endsWith('.json')) {
                    const formatted = JSON.stringify(JSON.parse(processedContent), null, 2);
                    return highlightMatches(formatted, fileSearch);
                  }
                  return highlightMatches(processedContent, fileSearch);
                } catch (e) {
                  return highlightMatches(preprocessContent(fileContent), fileSearch);
                }
              })()}
            </pre>
          ) : (
            <MarkdownRenderer content={preprocessContent(fileContent)} search={fileSearch} />
          )
        }
      </div>
    </div>
  );
}


