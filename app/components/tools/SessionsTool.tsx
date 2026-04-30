import React from 'react';
import { Clock, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SessionsToolLeft({
  sessions,
  matchesFilter,
  selectedSessionId,
  setSelectedSessionId
}: any) {
  return (
    <>
      {(sessions || []).filter((session: any) => {
        if (!matchesFilter) return true;
        return (
          matchesFilter(session.title) ||
          matchesFilter(session.preview) ||
          matchesFilter(session.id)
        );
      }).map((session: any) => (
        <button
          key={session.id}
          onClick={() => setSelectedSessionId(session.id)}
          className={cn(
            'w-full text-left p-3 rounded-lg border transition-all group',
            selectedSessionId === session.id ? 'bg-[#111111] border-[#1F1F1F]' : 'border-transparent hover:bg-[#111111]/50'
          )}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-[13px] font-semibold text-[#FFF8DC] truncate">
              {session.title || 'Untitled Session'}
            </div>
            <div className="text-[11px] text-[#B8860B] uppercase tracking-wider">
              {session.lastActive || 'Unknown'}
            </div>
          </div>
          <div className="text-[12px] text-[#B8860B] leading-5 truncate">
            {session.preview || 'No preview available'}
          </div>
          <div className="text-[10px] text-[#888888] mt-2 font-mono truncate">
            {session.id}
          </div>
        </button>
      ))}

      {(sessions || []).filter((session: any) => {
        if (!matchesFilter) return true;
        return (
          matchesFilter(session.title) ||
          matchesFilter(session.preview) ||
          matchesFilter(session.id)
        );
      }).length === 0 && (
        <div className="p-4 text-[13px] text-[#B8860B]">No sessions match your filter.</div>
      )}
    </>
  );
}

export function SessionsToolRight({ selectedSession }: any) {
  if (!selectedSession) {
    return <div className="p-8 text-[#B8860B]">Select a session to view its details.</div>;
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <Activity size={24} className="text-[#FFBF00]" />
        <div>
          <h2 className="text-lg font-semibold text-[#FFF8DC]">{selectedSession.title || 'Untitled Session'}</h2>
          <div className="text-[11px] uppercase tracking-wider text-[#B8860B]">{selectedSession.lastActive || 'Unknown last active'}</div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#B8860B] uppercase tracking-wider mb-2">Preview</div>
          <p className="text-[13px] leading-6 text-[#FFF8DC]">{selectedSession.preview || 'No preview available'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
            <div className="text-[11px] font-bold text-[#B8860B] uppercase tracking-wider mb-2">Session ID</div>
            <div className="text-[13px] text-[#FFF8DC] font-mono break-all">{selectedSession.id}</div>
          </div>

          <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
            <div className="text-[11px] font-bold text-[#B8860B] uppercase tracking-wider mb-2">Last Active</div>
            <div className="text-[13px] text-[#FFF8DC]">{selectedSession.lastActive || 'Unknown'}</div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#B8860B] uppercase tracking-wider mb-2">Raw JSON</div>
          <pre className="max-h-[320px] overflow-auto text-[12px] font-mono text-[#FFF8DC] whitespace-pre-wrap break-words">{JSON.stringify(selectedSession, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
