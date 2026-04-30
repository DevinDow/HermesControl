'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Loader2, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime, formatSessionTime } from './utils/dateFormatting';

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
            <div className="text-[11px] text-[#FFBF00] tracking-wider">
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
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!selectedSession?.id) {
      setSessionData(null);
      setError(null);
      return;
    }

    const loadSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sessions/content?id=${encodeURIComponent(selectedSession.id)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to load session ${selectedSession.id}`);
        }
        setSessionData(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load session data');
        setSessionData(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [selectedSession]);

  if (!selectedSession) {
    return <div className="p-8 text-[#B8860B]">Select a session to view its details.</div>;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-[#B8860B]">
        <Loader2 size={18} className="animate-spin" /> Loading session data...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-[#ff6b6b]">{error}</div>;
  }

  if (!sessionData) {
    return <div className="p-8 text-[#B8860B]">No session data available.</div>;
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <MessageSquare size={24} className="text-[#FFBF00]" />
        <div className="text-[13px] text-[#B8860B]">
          <h2 className="text-lg font-semibold text-[#FFF8DC]">Session {sessionData.id}</h2>
          <div>
            <span className="font-bold text-[#FFD700]">{sessionData.model || 'Unknown'}</span>
            <span> from </span>
            <span className="text-[#FFBF00]">{sessionData.baseUrl || 'Unknown'}</span>
          </div>
          <div>
            <span className="font-bold text-[#FFD700] uppercase">{sessionData.platform || 'Unknown'}</span>
            <span> started </span>
            {(() => {
              const { text, color } = formatRelativeTime(sessionData.sessionStart);
                return (
                  <span className={cn("font-mono shrink-0 self-start mt-0.5", color)} suppressHydrationWarning>
                    {text}
                  </span>
                );
              })()}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sessionData.messages.length === 0 ? (
          <div className="text-[#B8860B]">No messages found in this session log.</div>
        ) : (
          [...sessionData.messages].reverse().map((message: any, idx: number) => {
            const isExpanded = !!expanded[idx];
            const messageKey = message.id ?? `message-${idx}`;
            const messageNumber = message.index != null ? message.index + 1 : sessionData.messages.length - idx;
            return (
              <div key={messageKey} className="bg-[#111111] border border-[#1F1F1F] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <div className="mt-1">
                    {isExpanded ? <ChevronDown size={18} className="text-[#FFBF00]" /> : <ChevronRight size={18} className="text-[#B8860B]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-[12px] uppercase tracking-wider text-[#B8860B] mb-2">
                      <span>#{messageNumber}</span>
                      <span className="font-bold text-[#FFD700]">{message.role}</span>
                    </div>
                    <div className="text-[13px] text-[#FFF8DC]">{message.content || '—'}</div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-[#1F1F1F] bg-[#0D0D0D] p-4">
                    <pre className="max-h-[340px] overflow-auto text-[12px] font-mono text-[#FFF8DC] whitespace-pre-wrap break-words">
{JSON.stringify(message.raw, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
