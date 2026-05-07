'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Loader2, ChevronDown, ChevronRight, MessageSquare, RefreshCw, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeTime, formatSessionTime } from './utils/dateFormatting';

// =============================================================================
// SessionsToolLeft  —  the middle-column list of session rows
//   Props:
//     sessions         — array of session summary objects from /api/sessions
//     matchesFilter   — fn(text) used to highlight rows matching the search box
//     selectedSessionId — id of whichever row is currently highlighted
//     setSelectedSessionId — callback to tell page.tsx which session to show
//     refreshSessions  — re-fetches the session LIST (sidebar) from the server
// =============================================================================
export function SessionsToolLeft ({
  sessions,
  matchesFilter,
  selectedSessionId,
  setSelectedSessionId,
  refreshSessions,
}: any) {
  return (
    <>

      {/* REFRESH button — reloads the LIST of sessions in the sidebar */}
      {refreshSessions && (
        <button
          onClick={refreshSessions}
          className="w-full flex items-center justify-center gap-2 p-2 mb-2 rounded-lg border border-[#1F1F1F] bg-[#111111] hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed text-[#8A8A8A] hover:text-[#EDEDED] transition-all text-xs font-medium focus:outline-none"
        >
          <RefreshCw size={14} />
          Refresh List
        </button>
      )}

      {/* SESSIONS matching FILTER */}
      {(sessions || []).filter((session: any) => {
        if (!matchesFilter) return true;
        return (
          matchesFilter(session.title) ||
          matchesFilter(session.preview) ||
          matchesFilter(session.id)
        );
      }).map((session: any) => (

        // SESSION ROW
        <button
          key={session.id}
          onClick={() => setSelectedSessionId(session.id)}
          className={cn(
            'w-full text-left p-3 rounded-lg border transition-all group',
            selectedSessionId === session.id ? 'bg-[#222222] border-[#1F1F1F]' : 'border-transparent hover:bg-[#222222]/50'
          )}
        >
          <div className="flex items-center justify-between">
            {/* SESSION TITLE */}
            <div className="text-[13px] font-semibold text-[#FFF8DC] truncate">
              {session.title || 'Untitled Session'}
            </div>
            {/* SESSION LAST ACTIVE */}
            <div className="text-[11px] text-[#FFBF00] tracking-wider">
              {session.lastActive || 'Unknown'}
            </div>
          </div>

          {/* SESSION PREVIEW */}
          <div className="text-[12px] text-[#B8860B] leading-5 truncate">
            {session.preview || 'No preview available'}
          </div>

          {/* SESSION ID */}
          <div className="text-[12px] text-[#888888] font-mono truncate">
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

// =============================================================================
// SessionsToolRight  —  the right-panel detail view for ONE selected session
//
//   Props received from page.tsx:
//     selectedSession    — the session SUMMARY object (id, title, preview, etc.)
//     sessionStale       — boolean: true when the server has MORE messages than
//                          what we last displayed; the button turns purple/animated
//     sessionNewLineCount — how many NEW messages appeared since last load
//     handleRefreshSession — fn: called when the user clicks "Refresh history"
//
//   Internal state:
//     sessionData  — the FULL session object fetched from /api/sessions/content
//                    (contains the `messages` array, model, platform, timestamps)
//     loading      — spinner shown while fetching sessionData
//     error        — error message if fetch failed
//     expanded     — which message rows are currently expanded
//     reverseOrder — display order toggle (red = newest first, green = oldest first)
//
//   HOW IT WORKS:
//     1. When selectedSession.id changes (user clicks a different row), the
//        useEffect fires and calls /api/sessions/content to get fresh data.
//     2. The sessionStale / sessionNewLineCount props are controlled entirely
//        by page.tsx — SessionsToolRight just reads and displays them.
//     3. Clicking "Refresh history" calls handleRefreshSession(), which lives
//        in page.tsx. That fn increments refreshTrigger, which re-fires THIS
//        useEffect so we show the latest messages immediately.
// =============================================================================
export function SessionsToolRight ({
  selectedSession,
  sessionStale,
  sessionNewLineCount,
  handleRefreshSession,
  refreshTrigger,
}: any) {
  // ---------------------------------------------------------------------------
  // Internal state — only used inside this panel
  // ---------------------------------------------------------------------------
  const [sessionData, setSessionData] = useState<any>(null);   // full session from API
  const [loading, setLoading]       = useState(false);         // spinner
  const [error, setError]           = useState<string | null>(null); // error msg
  const [expanded, setExpanded]     = useState<Record<number, boolean>>({}); // message expand state
  const [reverseOrder, setReverseOrder] = useState(true);    // display order

  // ---------------------------------------------------------------------------
  // Helper: summarize a message's non-content fields for the collapsed preview
  // ---------------------------------------------------------------------------
  const getMessageDetails = (message: any) => {
    const reasoning    = message.reasoning    || '';
    const finishReason = message.finish_reason || '';
    const toolCallId   = message.tool_call_id || '';

    var toolCalls = '';
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      if      (message.tool_calls.length === 0) toolCalls = '*EMPTY*';
      else if (message.tool_calls.length === 1) toolCalls = getToolCallDetails(message.tool_calls[0], true);
      else                                      toolCalls = `${message.tool_calls.length} tool calls: ` + message.tool_calls.map((call: any) => getToolCallDetails(call, false)).join(', ');
    }

    return `${reasoning} ${finishReason} ${toolCallId} ${toolCalls}`.trim();
  };

  const getToolCallDetails = (toolCall: any, args: boolean) => {
    var s = toolCall.type || '';
    if (toolCall.function) {
      s = toolCall.function.name + '(';
      if (args) s += toolCall.function.arguments.substring(0, 100);
      s += ')';
    }
    return s;
  };

  // ---------------------------------------------------------------------------
  // DATA FETCHING useEffect
  //
  // Fires when:
  //   (a) selectedSession.id changes  — user picked a different session row
  //   (b) refreshTrigger changes      — user clicked "Refresh history" in page.tsx
  //
  // Does NOT fire on every staleness poll tick — that's intentional so the
  // detailed message list doesn't jump around while you're reading it.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // No session selected — clear the panel
    if (!selectedSession?.id) {
      console.log('[SessionsToolRight] No session selected — clearing panel');
      setSessionData(null);
      setError(null);
      return;
    }

    const sessionId = selectedSession.id;
    console.log(`[SessionsToolRight] useEffect fired for session="${sessionId}"  (selectedSession changed or refreshTrigger fired)`);

    const loadSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/sessions/content?id=${encodeURIComponent(sessionId)}`;
        console.log(`[SessionsToolRight] Fetching ${url} …`);

        const res  = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Server returned ${res.status} for session ${sessionId}`);
        }

        // data.messages is the array of {role, content, tool_calls, …} objects
        console.log(`[SessionsToolRight] ✅ Fetched session="${sessionId}" — ${data.messages?.length ?? 0} messages`);
        setSessionData(data);
      } catch (err: any) {
        console.error(`[SessionsToolRight] ❌ Failed to load session="${sessionId}":`, err.message);
        setError(err.message || 'Unable to load session data');
        setSessionData(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  // NOTE: refreshTrigger is intentionally in the deps array — that's what makes
  // the "Refresh history" button actually reload the message list.
  }, [selectedSession, refreshTrigger]);

  // ---------------------------------------------------------------------------
  // Render: nothing selected yet
  // ---------------------------------------------------------------------------
  if (!selectedSession) {
    return <div className="p-8 text-[#B8860B]">Select a session to view its details.</div>;
  }

  // ---------------------------------------------------------------------------
  // Render: while loading
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-[#B8860B]">
        <Loader2 size={18} className="animate-spin" /> Loading session data…
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: fetch error
  // ---------------------------------------------------------------------------
  if (error) {
    return <div className="p-8 text-[#ff6b6b]">{error}</div>;
  }

  // ---------------------------------------------------------------------------
  // Render: no data at all
  // ---------------------------------------------------------------------------
  if (!sessionData) {
    return <div className="p-8 text-[#B8860B]">No session data available.</div>;
  }

  // ---------------------------------------------------------------------------
  // Render: the actual message list + the Refresh History button
  //
  // BUTTON VISUAL LOGIC:
  //   sessionStale = false (polling hasn't detected new lines) →
  //     plain grey History icon, no badge, no pulse dot
  //
  //   sessionStale = true (polling found more messages) →
  //     purple glowing button, animated pulse dot in corner,
  //     badge shows "+N NEW" (N = how many new messages appeared)
  // ---------------------------------------------------------------------------
  console.log(`[SessionsToolRight] render — sessionStale=${sessionStale}, sessionNewLineCount=${sessionNewLineCount}, messages=${sessionData.messages?.length ?? 0}`);

  return (
    <div className="p-2 space-y-2 overflow-y-auto">
      {/* Header row: icon | order toggle | title/info | Refresh History button */}
      <div className="flex items-center gap-3">
        <MessageSquare size={24} className="text-[#FFBF00]" />

        {/*
          Order toggle: clicking flips reverseOrder.
          Red indicator = newest-first (reverse chronological, the default)
          Green indicator = oldest-first
        */}
        <button onClick={() => {
          console.log(`[SessionsToolRight] Order toggled: ${reverseOrder ? 'oldest-first' : 'newest-first'}`);
          setReverseOrder(!reverseOrder);
        }}>
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

        {/* Session title + metadata */}
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
              return <span className={cn("font-mono shrink-0 self-start mt-0.5", color)} suppressHydrationWarning>{text}</span>;
            })()}
            <span>, updated </span>
            {(() => {
              const { text, color } = formatRelativeTime(sessionData.lastUpdated);
              return <span className={cn("font-mono shrink-0 self-start mt-0.5", color)} suppressHydrationWarning>{text}</span>;
            })()}
          </div>
        </div>

        {/*
          ─── REFRESH HISTORY BUTTON ───

          This button lives in page.tsx and is controlled by TWO pieces of state
          that page.tsx owns:

            sessionStale        — set TRUE by the polling useEffect when it sees
                                  the server has more messages than last loaded
            sessionNewLineCount — set to the exact number of new messages detected

          Visual states:
            IDLE    (sessionStale=false) → plain grey History icon, no badge
            NEW     (sessionStale=true)  → purple glowing button, animated dot,
                                           badge shows "+N NEW" (or just "REFRESH"
                                           if we detected new lines but don't have
                                           an exact count — shouldn't happen in
                                           normal operation)
        */}
        <button
          onClick={() => {
            console.log(`[SessionsToolRight] Refresh History button clicked — calling handleRefreshSession()`);
            handleRefreshSession();
          }}
          className={cn(
            "group relative px-2.5 py-1.5 rounded flex items-center gap-2 transition-all border",
            sessionStale
              ? "bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700] shadow-[0_0_15px_rgba(94,106,210,0.1)]"
              : "bg-transparent border-transparent hover:bg-[#1F1F1F] text-[#555555] hover:text-[#EDEDED]"
          )}
          title={sessionStale ? "New activity detected! Refresh now." : "Refresh history"}
        >
          <History size={16} className={cn(sessionStale && "text-[#FFD700]")} />

          {/* Badge: only shown when sessionStale is true */}
          {sessionStale && (
            <span className="text-[10px] font-bold tracking-tight">
              {/* If we know the exact count show "+N NEW", otherwise just "REFRESH" */}
              {sessionNewLineCount > 0
                ? `+${sessionNewLineCount} NEW`
                : 'REFRESH'}
            </span>
          )}

          {/* Animated pulse dot — only when new lines detected */}
          {sessionStale && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFD700] rounded-full border-2 border-[#0D0D0D] animate-pulse" />
          )}
        </button>
      </div>

      {/* ─── MESSAGE LIST ─── */}
      <div className="space-y-3">
        {sessionData.messages.length === 0 ? (
          <div className="text-[#B8860B]">No messages found in this session log.</div>
        ) : (
          (reverseOrder
            ? [...sessionData.messages].reverse()   // newest first (default)
            : [...sessionData.messages]               // oldest first
          ).map((message: any, idx: number) => {
            const isExpanded    = !!expanded[idx];
            // messageNumber = 1-based, accounting for display order
            const messageNumber = reverseOrder
              ? sessionData.messages.length - idx
              : idx + 1;

            return (
              <div key={`message-${idx}`} className="bg-[#222222] border border-[#B8860B] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    console.log(`[SessionsToolRight] Message #${messageNumber} ${isExpanded ? 'collapsed' : 'expanded'}`);
                    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
                  }}
                  className="p-4 text-left"
                >
                  <div className="flex items-start gap-2">
                    {isExpanded
                      ? <ChevronDown size={18} className="text-[#FFBF00]" />
                      : <ChevronRight size={18} className="text-[#B8860B]" />}
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
