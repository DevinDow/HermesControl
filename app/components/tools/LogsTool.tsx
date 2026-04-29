import React, { useState } from 'react';
import { Activity, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LogsToolLeft({ fetchData, setLogContent, logs, selectedLog, setSelectedLog }: { fetchData: any, setLogContent: any, logs: any[], selectedLog: string, setSelectedLog: Function }) {
  return (
    <div className="flex flex-col gap-2">
      {logs.length === 0 ? (
        <div className="text-sm text-[#6B7280] p-3 text-center">No log files available</div>
      ) : (
        logs.map((log) => (
          <button
            key={log.name}
            onClick={() => {
              setSelectedLog(log.name);
              fetchData(`/api/files?mode=logs&file=${encodeURIComponent(log.name)}`, setLogContent, 'logs');
            }}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all group flex items-center gap-3",
              selectedLog === log.name ? "border-[#FFBF00] bg-[#111111]" : "border-transparent hover:bg-[#111111]/50"
            )}
          >
            <div className={cn("p-1.5 rounded bg-[#161616] border", selectedLog === log.name ? "border-[#FFBF00] text-[#FFBF00]" : "border-[#1F1F1F] text-[#B8860B]")}><Activity size={14} /></div>
            <span className={cn("text-[13px] font-medium truncate", selectedLog === log.name ? "text-[#FFF8DC]" : "text-[#B8860B]")}>{log.name}</span>
          </button>
        ))
      )}
    </div>
  );
}

export function LogsToolRight({ logContent, loading, selectedLog }: { logContent: string, loading: any, selectedLog: string }) {
  const title = selectedLog || 'Log Viewer';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#1F1F1F] bg-[#0D0D0D] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-body-cornsilk">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-[#080808]">
        {loading.logs ? <Loader2 size={32} className="text-[#FFBF00] animate-spin mx-auto mt-20" /> :
          renderLogEntries(logContent, 10)
        }
      </div>
    </div>
  );
}

export function renderLogEntries(content: string, limit: number) {
  const lines = content.split('\n').filter(line => line.trim()).reverse().slice(0, limit);
  return (
    <div className="space-y-4">
      {lines.map((line, idx) => {
        try {
          const parsed = JSON.parse(line);
          const summary = JSON.stringify(parsed).substring(0, 100);

          return (
            <details key={idx} className="group bg-[#0D0D0D] border rounded-lg overflow-hidden transition-all">
              <summary className="px-4 py-2 text-[11px] font-mono text-body-cornsilk cursor-pointer hover:bg-[#161616] flex items-center gap-2 select-none">
                <ChevronRight size={12} className="group-open:rotate-90 transition-transform text-[#FFBF00]" />
                <span className="truncate flex-1">{summary}</span>
              </summary>
              <div className="px-4 py-3 bg-[#080808] border-t border-[#1F1F1F]">
                <pre className="text-[11px] font-mono text-body-cornsilk whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              </div>
            </details>
          );
        } catch (e) {
          return <div key={idx} className="text-red-500 text-xs">Failed to parse log line: {line}</div>;
        }
      })}
    </div>
  );
}


