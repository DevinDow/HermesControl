'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Loader2, ChevronDown, ChevronRight, MessageSquare, RefreshCw, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime, formatSessionTime } from './utils/dateFormatting';

export function SessionsToolLeft({
  sessions,
  matchesFilter,
  selectedSessionId,
  setSelectedSessionId,
  refreshSessions,
}: any) {
  return (
    <>
      {refreshSessions && (
        <button
          onClick={refreshSessions}
          className="w-full flex items-center justify-center gap-2 p-2 mb-2 rounded-lg border border-[#1F1F1F] bg-[#111111] hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed text-[#8A8A8A] hover:text-[#EDEDED] transition-all text-xs font-medium focus:outline-none"
        >
          <RefreshCw size={14} />
          Refresh List
        </button>
      )}
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
            selectedSessionId === session.id ? 'bg-[#222222] border-[#1F1F1F]' : 'border-transparent hover:bg-[#222222]/50'
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

export function SessionsToolRight({ selectedSession, sessionStale, sessionNewLineCount, handleRefreshSession}: any) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [reverseOrder, setReverseOrder] = useState(true);

  const getMessageDetails = (message: any) => {
    const reasoning = message.reasoning || '';
    const finishReason = message.finish_reason || '';
    const toolCallId = message.tool_call_id || '';

    var toolCalls = '';
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      if (message.tool_calls.length === 0) {
        toolCalls = '*EMPTY*';
      } else if (message.tool_calls.length === 1) {
        toolCalls = getToolCallDetails(message.tool_calls[0], true);
      } else {
        toolCalls = `${message.tool_calls.length} tool calls: ` + message.tool_calls.map((call: any) => getToolCallDetails(call, false)).join(', ');
      }
    }

    return `${reasoning} ${finishReason} ${toolCallId} ${toolCalls}`.trim();
  };

  const getToolCallDetails = (toolCall: any, args: boolean) => {
    var s = toolCall.type || '';
    if (toolCall.function) {
      s = toolCall.function.name + '(';
      if (args) {
        s += toolCall.function.arguments.substring(0, 100);
      }
      s += ')';
    }
    return s;
  }

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
    <div className="p-2 space-y-2 overflow-y-auto">
      <div className="flex items-center gap-3">
        <MessageSquare size={24} className="text-[#FFBF00]" />

        <button onClick={() => setReverseOrder(!reverseOrder)}>
          {/* Toggle switch - RED/TOP = REVERSED */}
          <div className={cn(
            "w-5 h-10 rounded-full relative transition-colors",
            reverseOrder ? "bg-red-500/20 border border-red-500/50" : "bg-green-500/20 border border-green-500/50"
          )}>
            {/* Toggle indicator */}
            <div className={cn(
              "absolute left-0.5 w-[14px] h-[14px] rounded-full transition-all",
              reverseOrder ? "top-0.5 bg-red-400" : "bottom-0.5 bg-green-500"
            )} />
          </div>
        </button>

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
            <span>, updated </span>
            {(() => {
              const { text, color } = formatRelativeTime(sessionData.lastUpdated);
              return (
                <span className={cn("font-mono shrink-0 self-start mt-0.5", color)} suppressHydrationWarning>
                  {text}
                </span>
              );
            })()}
          </div>
        </div>
          <button
            onClick={handleRefreshSession}
            className={cn(
              "group relative px-2.5 py-1.5 rounded flex items-center gap-2 transition-all border",
              sessionStale
                ? "bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#5E6AD2] shadow-[0_0_15px_rgba(94,106,210,0.1)]"
                : "bg-transparent border-transparent hover:bg-[#1F1F1F] text-[#555555] hover:text-[#EDEDED]"
            )}
            title={sessionStale ? "New activity detected! Refresh now." : "Refresh history"}
          >
            <History size={16} className={cn(sessionStale && "text-[#5E6AD2]")} />
            {sessionStale && (
              <span className="text-[10px] font-bold tracking-tight">
                {sessionNewLineCount > 0 ? `+${sessionNewLineCount} NEW` : 'REFRESH'}
              </span>
            )}
            {sessionStale && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#5E6AD2] rounded-full border-2 border-[#0D0D0D] animate-pulse" />
            )}
          </button>
      </div>

      <div className="space-y-3">
        {sessionData.messages.length === 0 ? (
          <div className="text-[#B8860B]">No messages found in this session log.</div>
        ) : (
          (reverseOrder
            ? [...sessionData.messages].reverse()
            : [...sessionData.messages]
          ).map((message: any, idx: number) => {
            const isExpanded = !!expanded[idx];
            const messageKey = `message-${idx}`;
            const messageNumber = reverseOrder ? sessionData.messages.length - idx : idx + 1;
            return (
              <div key={messageKey} className="bg-[#222222] border border-[#B8860B] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className="p-4 text-left"
                >
                  <div className="flex items-start gap-2">
                    {isExpanded ? <ChevronDown size={18} className="text-[#FFBF00]" /> : <ChevronRight size={18} className="text-[#B8860B]" />}
                    <span>#{messageNumber}</span>
                    <span className="font-bold text-[#FFD700]">{message.role}</span>
                    <span className="text-sm text-[#888888]">{getMessageDetails(message)}</span>
                  </div>
                  <pre className={`overflow-auto text-[11px] font-mono text-[#FFF8DC] whitespace-pre-wrap break-words ${!isExpanded ? "max-h-[250px]" : ""}`}>
                    {message.content?.replace(/\\n/g, '\n')}
                  </pre>
                  <pre className={`overflow-auto text-[11px] font-mono text-[#FFF8DC] whitespace-pre-wrap break-words ${!isExpanded ? "max-h-[250px]" : ""}`}>
                    {message.tool_calls ? JSON.stringify(message.tool_calls, null, 2) : ''}
                  </pre>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
