"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  FileText,
  Brain,
  Settings,
  Search,
  ChevronLeft,
  Terminal,
  Clock,
  HelpCircle,
  ScrollText,
  Activity,
  GitBranch,
  Wrench,
  Link as LinkIcon,
  Parentheses,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FileTree } from './components/tools/FileTree';
import { JobsToolLeft, JobsToolRight } from './components/tools/JobsTool';
import { SessionsToolLeft, SessionsToolRight } from './components/tools/SessionsTool';
import { SystemStatus } from './components/SystemStatus';
import { ScriptsToolLeft } from './components/tools/ScriptsTool';
import { FileViewerRight } from './components/tools/FileViewer';
import { CmdToolLeft, CmdToolRight } from './components/tools/CmdTool';
import { GitToolLeft, GitToolRight } from './components/tools/GitTool';
import { SkillsToolLeft, SkillsToolRight } from './components/tools/SkillsTool';
import { HelpToolLeft, HelpToolRight } from './components/tools/HelpTool';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function HermesControl() {
  // ============================================================================
  // GLOBAL STATE MANAGEMENT
  // ============================================================================

  // Tracks the currently selected tool in the left sidebar (e.g., 'Docs', 'Jobs', 'Sessions')
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isMounted, setIsMounted] = useState(false);

  // ============================================================================
  // DATA STATES
  // These arrays hold the raw data fetched from the backend API routes.
  // They populate the middle column lists.
  // ============================================================================
  const [dashboardTree, setDashboardTree] = useState<any[]>([]);
  const [docsTree, setDocsTree] = useState<any[]>([]);
  const [memoryTree, setMemoryTree] = useState<any[]>([]);
  const [specsTree, setSpecsTree] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [logsTree, setLogsTree] = useState<any[]>([]);
  const [systemTree, setSystemTree] = useState<any[]>([]);
  const [scriptsTree, setScriptsTree] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [cmdHistory, setCmdHistory] = useState<any[]>([]);
  const [gitStatus, setGitStatus] = useState<{
    commits: any[],
    branch?: string,
    aheadCount: number,
    remoteHash?: string,
    staged: string[],
    unstaged: string[],
    untracked: string[]
  } | null>(null);
  const [modelStatus, setModelStatus] = useState<{
    modelId?: string,
    provider?: string,
    host?: string,
    model?: string,
    sessionFile?: string
  } | null>(null);
  const [helpLinks, setHelpLinks] = useState<any[]>([]);
  const [helpShortcuts, setHelpShortcuts] = useState<any[]>([]);
  const [helpCli, setHelpCli] = useState<string>('');
  const [skills, setSkills] = useState<{ workspace: any[], system: any[] }>({ workspace: [], system: [] });
  const [logs, setLogs] = useState<any[]>([]);
  const [logContent, setLogContent] = useState<string>('');

  // Stores the user's input for the middle column search/filter bar
  const [filterText, setFilterText] = useState<string>('');

  // Tracks the overall health of the Hermes system (Online status, heartbeat, versions)
  const [selectedLog, setSelectedLog] = useState<string>('');
  const [gatewayStatus, setGatewayStatus] = useState<{
    online: boolean,
    version?: string,
    updateString?: string,
    updateAvailable?: boolean,
    latestVersion?: string,
    channel?: string,
    heartbeatInterval?: string,
    heartbeatActiveHours?: {
      start: string,
      end: string,
      timezone?: string
    } | null,
    lastHeartbeat?: {
      ts?: number,
      status?: string,
      silent?: boolean,
      reason?: string,
      durationMs?: number,
      channel?: string,
      accountId?: string,
      indicatorType?: string,
      lastHeartbeatText?: string | null
    }
  }>({ online: true });

  const [updating, setUpdating] = useState<boolean>(false);
  const prevUpdatingRef = useRef<boolean>(false);

  // ============================================================================
  // LOADING STATES
  // Map of booleans used to trigger the spinning Loader2 icons across the UI
  // ============================================================================
  const [loading, setLoading] = useState<Record<string, boolean>>({
    jobs: false,
    files: false,
    content: false,
    logs: false,
  });

  // ============================================================================
  // SELECTION STATES
  // These track what the user has clicked in the middle column.
  // Changes to these states trigger the 'fetchContent' useEffect to load details.
  // ============================================================================
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedCmdId, setSelectedCmdId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedSkillFile, setSelectedSkillFile] = useState<string>('SKILL.md');
  const [selectedHelpId, setSelectedHelpId] = useState<string | null>(null);
  const [selectedGitFile, setSelectedGitFile] = useState<string | null>(null);
  const [selectedGitType, setSelectedGitType] = useState<'staged' | 'unstaged' | 'untracked' | 'commit' | null>(null);
  const [selectedGitCommit, setSelectedGitCommit] = useState<string | null>(null);
  const [gitDiff, setGitDiff] = useState<{ staged: string | null, unstaged: string | null, untracked: string | null, commit: { header: string, files: any[] } | null } | null>(null);
  const [gitFingerprint, setGitFingerprint] = useState<string | null>(null);
  const [gitStale, setGitStale] = useState<boolean>(false);
  const [viewingJobLog, setViewingJobLog] = useState<boolean>(false);

  // The raw text/markdown content fetched from the server for the Right Column
  const [fileContent, setFileContent] = useState<string>('');

  // Controls how many JSONL entries are parsed in Session Logs (Performance optimization)
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [history, setHistory] = useState<any[]>([]);

  // Right-column internal "Find in file" search states
  const [fileSearch, setFileSearch] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);

  // Session-specific search
  const [sessionSearch, setSessionSearch] = useState<string>('');

  // ===========================================================================
  // SESSION STALENESS STATE  (explainer below)
  //
  // These three variables work together to power the "Refresh History" button
  // in SessionsToolRight. The system has three moving parts:
  //
  //   PART 1 — "Staleness polling useEffect" (below in this file)
  //     Every 3 seconds while you're on the Sessions tab, it asks the server:
  //       "how many messages does session X have right now?"
  //     If that number is HIGHER than what we loaded last time, it sets:
  //       sessionStale       = true
  //       sessionNewLineCount = (new server count) − (last loaded count)
  //     The SessionsToolRight button then glows purple with "+N NEW".
  //
  //   PART 2 — SessionsToolRight component
  //     Displays the button and the message list. It receives sessionStale
  //     and sessionNewLineCount as props and just reads them — it does NOT
  //     set them. Clicking the button calls handleRefreshSession() below.
  //
  //   PART 3 — handleRefreshSession() (below)
  //     User clicks "Refresh history" → this fn runs:
  //       (a) Resets sessionStale=false, sessionNewLineCount=0
  //           (the polling will re-detect if there are STILL more new lines)
  //       (b) Increments sessionRefreshTrigger — this re-fires SessionsToolRight's
  //           internal useEffect so it re-fetches and re-renders the message list
  //       (c) Updates fileContent in page.tsx (used by some other panels too)
  //       (d) Surgically updates the sidebar session list metadata
  // ===========================================================================

  // sessionStale: true when PART 1 polling detected the server has new messages
  const [sessionStale, setSessionStale] = useState<boolean>(false);

  // sessionNewLineCount: how many new messages PART 1 found (shown as "+N NEW")
  const [sessionNewLineCount, setSessionNewLineCount] = useState<number>(0);

  // contentLoadedAt: timestamp (ms) of when we last loaded the message list;
  //                  currently informational only, used in console logs
  const [contentLoadedAt, setContentLoadedAt] = useState<number>(0);

  const [contentError, setContentError] = useState<string | null>(null);

  // sessionRefreshTrigger: a counter that increments every time the user
  //                        clicks "Refresh history".  SessionsToolRight's
  //                        useEffect watches this — when it changes, the
  //                        component re-fetches the message list from the server.
  //                        We use a counter (not a boolean) so rapid clicks are
  //                        handled correctly — each increment triggers the effect.
  const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState<number>(0);

  // ---------------------------------------------------------------------------
  // sessionsRefreshCount: incremented whenever the user clicks "Refresh List"
  // in SessionsToolLeft.  We use a counter (not a boolean) so each click is
  // guaranteed to force SessionsToolLeft to remount via React.memo, picking up
  // the latest lastActive / updatedAt values from the API.
  // ---------------------------------------------------------------------------
  const [sessionsRefreshCount, setSessionsRefreshCount] = useState<number>(0);

  // ---------------------------------------------------------------------------
  // timeTick: a counter that increments every 60 seconds.
  //
  // This is lifted to page.tsx (rather than living inside SessionsToolLeft)
  // so the tick is guaranteed to fire: even when no other state changes in
  // page.tsx, this counter increments and forces a re-render of the entire
  // component tree — including SessionsToolLeft, which recalculates relative
  // timestamps via formatRelativeTime() without making any API call.
  // ---------------------------------------------------------------------------
  const [timeTick, setTimeTick] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[page.tsx] timeTick — incrementing to force relative-time re-render across the whole tree');
      setTimeTick(t => t + 1);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Live Editing States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // ============================================================================
  // HANDLERS & HELPERS
  // ============================================================================

  const navigateToSession = (sessionId: string, targetTab: 'Sessions' | 'History' = 'Sessions') => {
    setActiveTab(targetTab);
    setSelectedSessionId(sessionId);
  };

  // navItems[] defines the left sidebar buttons and their icons
  const navItems = [
    { name: 'Dashboard', icon: Activity },
    { name: 'Docs', icon: FileText },
    { name: 'Memory', icon: Brain },
    { name: 'Specs', icon: ScrollText },
    { name: 'Scripts', icon: Parentheses },
    { name: 'Logs', icon: Activity },
    { name: 'System', icon: Settings },
    { name: 'Jobs', icon: Clock },
    { name: 'Sessions', icon: Users },
    { name: 'Cmd', icon: Terminal },
    { name: 'Git', icon: GitBranch },
    { name: 'Skills', icon: Wrench },
    { name: 'Help', icon: HelpCircle },
  ];

  // handleKeyDown() listens for global keyboard shortcuts:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus Search on "/"
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Filter"], input[placeholder*="Find"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Clear Selection on "Esc"
      if (e.key === 'Escape') {
        setSelectedFilePath(null);
        setSelectedSessionId(null);
        setSelectedSkillId(null);
        setSelectedHelpId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async (endpoint: string, setter: Function, loadingKey: string) => {
    const fetchStart = Date.now();
    if (endpoint.includes('sessions') || endpoint.includes('history') || endpoint.includes('content')) {
      console.log(`[Frontend] Fetching ${endpoint} ...`);
    }
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (endpoint.includes('sessions') || endpoint.includes('history') || endpoint.includes('content')) {
        console.log(`[Frontend] Fetched ${endpoint} in ${Date.now() - fetchStart}ms`);
      }
      if (endpoint.includes('/api/files?mode=logs')) {
        if (endpoint.includes('&file=')) {
          // Fetching specific log file content
          setLogContent(data.content || '');
        } else {
          // Fetching list of log files
          setter(data);
          return data;
        }
      } else if (endpoint === '/api/cmd' || endpoint === '/api/git' || endpoint === '/api/skills' || endpoint === '/api/status' || endpoint === '/api/heartbeat' || endpoint === '/api/heartbeat/last' || endpoint === '/api/online' || endpoint === '/api/version' || endpoint === '/api/model' || endpoint.startsWith('/api/help')) {
        setter(data);
        return data;
      } else {
        const finalData = Array.isArray(data) ? data : (data.sessions || data.jobs || []);
        setter(finalData);
        return finalData;
      }
      return data;
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      // Don't set empty array for status or skills which are objects
      if (endpoint === '/api/status') {
        setter({ online: false, error: 'Connection failed' });
      } else if (endpoint === '/api/skills') {
        setter({ workspace: [], system: [] });
      } else {
        setter([]);
      }
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // ===========================================================================
  // handleRefreshSession — called when user clicks "Refresh history" button
  //
  // Flow:
  //   1. Guard: if no session is selected, do nothing
  //   2. Increment sessionRefreshTrigger → SessionsToolRight's useEffect fires →
  //      it re-fetches /api/sessions/content and updates its displayed message list
  //   3. Reset sessionStale=false, sessionNewLineCount=0 → button returns to idle
  //      (if there are STILL more new lines after the refresh, the 3s polling
  //       will detect them and re-activate the button automatically)
  //   4. Also updates fileContent in page.tsx state (used by other panels)
  //   5. Surgically update only the changed metadata (size, updatedAt) in the
  //      sidebar session list, so it reflects the new state without a full reload
  // ===========================================================================
  const handleRefreshSession = async () => {
    if (!selectedSessionId) {
      console.log('[handleRefreshSession] No session selected — doing nothing');
      return;
    }

    const refreshStart = Date.now();
    console.log(`[handleRefreshSession] ▶ START — sessionId="${selectedSessionId}"`);

    // ── Step 2: Signal SessionsToolRight to re-fetch ──────────────────────────
    // Incrementing the trigger counter makes SessionsToolRight's useEffect fire,
    // which calls /api/sessions/content and updates the displayed messages.
    console.log(`[handleRefreshSession] Incrementing sessionRefreshTrigger (SessionsToolRight will re-fetch)`);
    setSessionRefreshTrigger(t => t + 1);

    // ── Step 3: Reset staleness so the button returns to idle ────────────────
    // We set these to false/0 here so the button immediately looks idle.
    // If new lines are still arriving after this refresh, the 3-second polling
    // useEffect (PART 1) will detect them and set sessionStale=true again.
    console.log(`[handleRefreshSession] Resetting sessionStale=false, sessionNewLineCount=0`);
    setSessionStale(false);
    setSessionNewLineCount(0);
    setContentLoadedAt(Date.now());

    // Set loading spinner in page.tsx (affects the right panel border/etc.)
    setLoading(prev => ({ ...prev, content: true }));

    try {
      // ── Step 4: Fetch latest session content ────────────────────────────────
      const url = `/api/sessions/content?id=${selectedSessionId}`;
      console.log(`[handleRefreshSession] Fetching ${url} …`);

      const res  = await fetch(url);
      const data = await res.json();

      console.log(
        `[handleRefreshSession] ✅ Fetched in ${Date.now() - refreshStart}ms — ` +
        `${data.messages?.length ?? 0} messages, ` +
        `model="${data.model ?? '?'}", ` +
        `platform="${data.platform ?? '?'}"`
      );

      // Update page.tsx state (used by some of the other right-panel tools)
      setFileContent(data.content || '');

      // ── Step 5: Update sidebar session list metadata surgically ────────────
      // Only update the size and updatedAt for THIS session in the sidebar list,
      // so it reflects the new state without a full /api/sessions reload.
      if (data.metadata) {
        console.log(`[handleRefreshSession] Updating sidebar metadata: size=${data.metadata.size}, updatedAt=${data.metadata.updatedAt}`);
        setSessions(prev => prev.map(s =>
          s.id === selectedSessionId
            ? { ...s, size: data.metadata.size, updatedAt: data.metadata.updatedAt }
            : s
        ));
      } else {
        console.log(`[handleRefreshSession] No metadata in response — skipping sidebar update`);
      }

      // Re-enable the trigger logger for easy tracking
      console.log(`[handleRefreshSession] ✅ DONE — sessionId="${selectedSessionId}"  (${Date.now() - refreshStart}ms total)`);
    } catch (err) {
      console.error(`[handleRefreshSession] ❌ ERROR:`, err);
    } finally {
      setLoading(prev => ({ ...prev, content: false }));
    }
  };

  useEffect(() => {
    setIsMounted(true);
    // Initial data load for all tools
    fetchData('/api/files?mode=memory', setMemoryTree, 'files').then(data => {
      if (Array.isArray(data) && data.length > 0 && activeTab === 'Memory') {
        const firstFile = data[0].type === 'file' ? data[0] : data[0].children?.[0];
        if (firstFile) setSelectedFilePath(firstFile.path);
      }
    });
    fetchData('/api/files?mode=dashboard', setDashboardTree, 'files');
    fetchData('/api/files?mode=docs', setDocsTree, 'files');
    fetchData('/api/files?mode=specs', setSpecsTree, 'files');
    fetchData('/api/scripts', setScriptsTree, 'files');
    fetchData('/api/files?mode=logs', setLogsTree, 'files');
    fetchData('/api/system', setSystemTree, 'files');
    fetchData('/api/jobs', setJobs, 'jobs').then(data => {
      if (Array.isArray(data) && data.length > 0) setSelectedJobId(data[0].id);
    });
    fetchData('/api/sessions', setSessions, 'sessions');
    fetchData('/api/git', setGitStatus, 'git');
    fetchData('/api/skills', setSkills, 'skills');
    fetchData('/api/help/links', setHelpLinks, 'help');
    fetchData('/api/help/shortcuts', setHelpShortcuts, 'help');
    fetchData('/api/help/cli', (data: any) => setHelpCli(data.content), 'help');
    fetchData('/api/model', setModelStatus, 'model');

    // 1. Online Check: lightweight connectivity probe (No console.log)
    fetchData('/api/online', (data: any) => setGatewayStatus(prev => ({ ...prev, online: data.online })), 'status');

    // 3. Version Check: use api/version for gateway metadata and update availability
    fetchData('/api/version', (data: any) => {
      setGatewayStatus(prev => ({
        ...prev,
        version: data?.version,
        updateString: data?.updateString,
        updateAvailable: !!data?.updateString
      }));
    }, 'status');

    // Online check (10s intervals)
    const onlineInterval = setInterval(() => {
      fetch('/api/online')
        .then(res => res.json())
        .then(data => {
          setGatewayStatus(prev => {
            const wasOffline = prev.online === false;
            const isNowOnline = data.online === true;

            // If it just came back online
            if (wasOffline && isNowOnline) {
              // Version Check on reconnect
              fetchData('/api/version', (data: any) => setGatewayStatus(prev => ({
                ...prev,
                version: data?.version,
                updateString: data?.updateString,
                updateAvailable: !!data?.updateString
              })), 'status');
            }

            return { ...prev, online: data.online };
          });
        })
        .catch(() => { });
    }, 10000);

    // Model check (10s intervals)
    const modelStatusInterval = setInterval(() => {
      fetch('/api/model')
        .then(res => res.json())
        .then(data => setModelStatus(data))
        .catch(() => { });
    }, 10000);

    // Version check (60s intervals)
    const updateInterval = setInterval(() => {
      fetchData('/api/version', (data: any) => {
        setGatewayStatus(prev => ({
          ...prev,
          version: data?.version,
          updateString: data?.updateString,
          updateAvailable: !!data?.updateString
        }));
      }, 'status');
    }, 60000);

    // Git check (60s intervals)
    const gitStatusInterval = setInterval(() => {
      fetch('/api/git')
        .then(res => res.json())
        .then(data => setGitStatus(data))
        .catch(() => { });
    }, 60000);

    return () => {
      clearInterval(onlineInterval);
      clearInterval(updateInterval);
      clearInterval(gitStatusInterval);
      clearInterval(modelStatusInterval);
    };
  }, [activeTab]);

  useEffect(() => {
    if (prevUpdatingRef.current && !updating) {
      fetchData('/api/version', (data: any) => {
        setGatewayStatus(prev => ({
          ...prev,
          version: data?.version,
          updateString: data?.updateString,
          updateAvailable: !!data?.updateString
        }));
      }, 'status');
    }
    prevUpdatingRef.current = updating;
  }, [updating]);

  // Interval 5: Git Pulse Polling (2s) - Only when Git tab is active
  useEffect(() => {
    if (activeTab !== 'Git') return;

    const gitPulseInterval = setInterval(() => {
      fetch('/api/git/pulse')
        .then(res => res.json())
        .then(data => {
          if (data.fingerprint && gitFingerprint && data.fingerprint !== gitFingerprint) {
            setGitStale(true);
          } else if (data.fingerprint && !gitFingerprint) {
            setGitFingerprint(data.fingerprint);
          }
        })
        .catch(() => { });
    }, 2000);

    return () => clearInterval(gitPulseInterval);
  }, [activeTab, gitFingerprint]);

  // Handle Git stale state by auto-refreshing
  useEffect(() => {
    if (gitStale && activeTab === 'Git') {
      fetchData('/api/git', setGitStatus, 'git').then(data => {
        if (data) {
          setGitStatus(data);
          fetch('/api/git/pulse').then(r => r.json()).then(d => {
            setGitFingerprint(d.fingerprint);
            setGitStale(false);
          }).catch(() => { });
        }
      });
    }
  }, [gitStale, activeTab]);

  // ===========================================================================
  // PART 1: Session Staleness Polling — the background 3-second heartbeat
  //
  // WHAT IT DOES:
  //   While you are on the Sessions tab, this useEffect polls the server every
  //   3 seconds and asks: "how many messages does the currently selected session
  //   have right now?"  If that number is higher than what we saw last time,
  //   it means the Hermes agent has been chatting and produced new messages.
  //
  //   In that case it sets:
  //     sessionStale        = true
  //     sessionNewLineCount = (server's new count) − (what we loaded last time)
  //
  //   These two values are passed as props to SessionsToolRight, which uses
  //   them to make the "Refresh history" button glow purple and show "+N NEW".
  //
  // WHY POLLING, NOT WEBSOCKET:
  //   The session data is stored in a JSON file on disk (session_<id>.json).
  //   There is no live WebSocket or file-system watcher — so the simplest way
  //   to detect changes is to just ask the API "how many messages do you have?"
  //   on a short interval. 3 seconds is a good balance between responsive and polite.
  //
  // WHY TRACK lastLoadedCount HERE AND NOT IN SessionsToolRight:
  //   Because SessionsToolRight's useEffect only fires when selectedSession.id
  //   changes OR when the refresh button is clicked. It doesn't run continuously.
  //   The polling needs a separate persistent counter — so we hold it in the
  //   closure of this useEffect. It is NOT React state (which would cause
  //   re-renders on every tick); it's a plain mutable variable.
  //
  // CAVEATS:
  //   - lastLoadedCount starts at 0 on first poll — the first poll only SEEDS
  //     the count and never fires stale=true (that's intentional, so opening
  //     a session doesn't immediately show "new" when you just loaded it).
  //   - If you switch to a DIFFERENT session while polling, the useEffect
  //     restarts (because activeTab or selectedSessionId changed), so
  //     lastLoadedCount resets to 0 and the first poll on the new session
  //     also seeds without firing stale.
  //   - When the user clicks "Refresh history", we reset sessionStale=false.
  //     Polling continues and if there are STILL new messages after the
  //     manual refresh, it will fire stale=true again automatically.
  // ===========================================================================
  useEffect(() => {
    // Only run when: on Sessions tab AND a session is selected AND mounted
    if (activeTab !== 'Sessions' || !selectedSessionId || !isMounted) {
      return;
    }

    console.log(
      `[SessionPoll] 🟢 Started polling for sessionId="${selectedSessionId}"  (every 3s)`
    );

    // lastLoadedCount lives in the closure of this useEffect.
    // It is NOT state — it doesn't trigger re-renders. It's just a counter
    // we use to compare server count vs. what we last saw.
    let lastLoadedCount = 0;

    const pollSession = async () => {
      try {
        const url = `/api/sessions/content?id=${selectedSessionId}`;
        const res = await fetch(url);

        if (!res.ok) {
          console.warn(`[SessionPoll] Poll fetch failed: HTTP ${res.status}`);
          return;
        }

        const data = await res.json();
        const serverCount = Array.isArray(data.messages) ? data.messages.length : 0;

        console.log(
          `[SessionPoll] Poll tick — sessionId="${selectedSessionId}"  ` +
          `serverCount=${serverCount}  lastLoadedCount=${lastLoadedCount}`
        );

        // First poll (lastLoadedCount === 0) — seed the counter, don't fire stale
        if (lastLoadedCount === 0) {
          console.log(`[SessionPoll] First poll — seeding lastLoadedCount=${serverCount}  (no stale flag this run)`);
          lastLoadedCount = serverCount;
          return;
        }

        // Subsequent polls: compare
        if (serverCount > lastLoadedCount) {
          const delta = serverCount - lastLoadedCount;
          console.log(
            `[SessionPoll] 🔔 NEW MESSAGES DETECTED — ` +
            `${delta} new (serverCount=${serverCount} > lastLoadedCount=${lastLoadedCount})  ` +
            `→ setting sessionStale=true, sessionNewLineCount=${delta}`
          );
          setSessionNewLineCount(delta);
          setSessionStale(true);
          lastLoadedCount = serverCount;
        } else if (serverCount < lastLoadedCount) {
          // This happens if the session file was rotated/truncated — rare but possible.
          // Reset to the new (lower) count silently.
          console.warn(
            `[SessionPoll] ⚠️  Message count DECREASED (${serverCount} < ${lastLoadedCount}) — ` +
            `session file may have changed. Resetting lastLoadedCount=${serverCount}`
          );
          lastLoadedCount = serverCount;
        } else {
          console.log(`[SessionPoll] No change — serverCount=${serverCount} === lastLoadedCount=${lastLoadedCount}  (no action)`);
        }
      } catch (err) {
        // Silent — polling errors should not spam the console every 3 seconds
      }
    };

    // Run once immediately (on mount), then every 3 seconds
    pollSession();
    const interval = setInterval(pollSession, 3000);

    return () => {
      console.log(`[SessionPoll] 🔴 Stopped polling for sessionId="${selectedSessionId}"`);
      clearInterval(interval);
    };
  }, [activeTab, selectedSessionId, isMounted]);

  // ===========================================================================
  // PART 0 (bonus): Sessions List Auto-Polling
  //
  // WHAT IT DOES:
  //   While you are on the Sessions tab, this polls /api/sessions every 5 seconds
  //   and updates the sidebar list.  New sessions appear automatically, updated
  //   timestamps (lastActive, updatedAt) refresh without a manual click.
  //
  // WHY prevSessionIds (closure variable, NOT state):
  //   We compare the new list's IDs against the previous list's IDs.  Only when
  //   they differ do we call setSessions — which prevents React from re-rendering
  //   page.tsx unnecessarily.  Without this guard, every poll tick would create
  //   a new `sessions` array reference, which flows down to renderRight(), which
  //   creates a new `selectedSession` object, which flows down to
  //   SessionsToolRight and fires its useEffect → loading spinner flash every 5s.
  //
  //   Using a closure variable (not useState) for prevSessionIds is correct because
  //   we only care about the previous tick's value within this useEffect's scope —
  //   we don't need React to preserve it across renders or trigger re-renders.
  //
  // HOW IT PRESERVES STATE:
  //   - selectedSessionId is NOT cleared — the currently selected session stays
  //     selected even if the list changes around it.
  //   - SessionsToolRight (right panel) has its OWN useEffect based on
  //     selectedSession.id and refreshTrigger.  Updating `sessions` in page.tsx
  //     state does NOT cause SessionsToolRight to re-fetch — only a change to
  //     selectedSessionId or a manual refresh click does that.  So the right
  //     panel's scroll position and expand states are completely unaffected.
  //   - SessionsToolLeft is a pure rendering component — it receives `sessions`
  //     as a prop and just maps over it.  React re-renders it when `sessions`
  //     changes (new array reference from setSessions), showing fresh data but
  //     preserving the user's selection in the list itself.
  //
  // INFRASTRUCTURE SHARED WITH THE STALE DETECTION POLLING:
  //   Both useEffects (this one and SessionPoll above) are active at the same
  //   time on the Sessions tab.  They are independent — one keeps the sidebar
  //   list fresh, the other watches for new messages in the selected session.
  //   5s vs 3s intervals are intentionally different to avoid thundering-herd
  //   sync issues with the server.
  // ===========================================================================
  useEffect(() => {
    if (activeTab !== 'Sessions' || !isMounted) return;

    console.log('[SessionsListPoll] 🟢 Started — polling /api/sessions every 5s for new sessions');

    // prevSessionIds is a CLOSURE variable — NOT React state.
    // It tracks the last-seen list of session IDs so we can skip setSessions
    // when nothing has actually changed (avoids unnecessary re-renders downstream).
    let prevSessionIds: string[] = [];

    const pollSessionsList = async () => {
      try {
        const res  = await fetch('/api/sessions');
        const data = await res.json();

        if (!res.ok) {
          console.warn(`[SessionsListPoll] Failed to fetch sessions: HTTP ${res.status}`);
          return;
        }

        // Normalize: fetchData returns an array directly or extracts .sessions
        const list = Array.isArray(data) ? data : (data.sessions || []);

        // Derive the IDs from the new list for comparison
        const newIds = list.map((s: any) => s.id);

        console.log(
          `[SessionsListPoll] Poll — ${list.length} sessions, ` +
          `changed=${JSON.stringify(newIds) !== JSON.stringify(prevSessionIds)}`
        );

        // Only call setSessions if the list of IDs has actually changed.
        // This prevents unnecessary React re-renders of page.tsx → renderRight()
        // → new selectedSession object → SessionsToolRight useEffect → loading flash.
        if (JSON.stringify(newIds) !== JSON.stringify(prevSessionIds)) {
          console.log(`[SessionsListPoll] Session list changed — updating sidebar (${newIds.length} sessions)`);
          prevSessionIds = newIds;          // update before setState so reads are consistent
          setSessions(list);
        } else {
          console.log('[SessionsListPoll] Session list unchanged — skipping setSessions (no downstream re-render)');
        }
      } catch (err) {
        // Silent — polling errors should not spam console
      }
    };

    pollSessionsList();
    const interval = setInterval(pollSessionsList, 5000);

    return () => {
      console.log('[SessionsListPoll] 🔴 Stopped');
      clearInterval(interval);
    };
  }, [activeTab, isMounted]);

  // Consolidated content fetcher
  useEffect(() => {
    async function fetchContent() {
      // 1. CLEAR previous content while loading
      setFileContent('');
      setContentError(null);
      setGitDiff(null);
      setIsEditing(false);
      setSessionStale(false);
      setSessionNewLineCount(0);
      setContentLoadedAt(Date.now());

      // 2. Resolve URL based on state
      let url = '';
      if ((activeTab === 'Sessions' || activeTab === 'History') && selectedSessionId) {
        url = `/api/sessions/content?id=${selectedSessionId}`;
      } else if (activeTab === 'Jobs' && selectedJobId && viewingJobLog) {
        const job = jobs.find(j => j.id === selectedJobId);
        if (job?.state?.lastSessionId) {
          url = `/api/sessions/content?id=${job.state.lastSessionId}`;
        }
      } else if (activeTab === 'Git' && selectedGitCommit) {
        url = `/api/git/diff?commit=${selectedGitCommit}`;
      } else if (activeTab === 'Git' && selectedGitFile) {
        url = `/api/git/diff?file=${encodeURIComponent(selectedGitFile)}`;
      } else if (activeTab === 'Skills' && selectedSkillId) {
        const [origin, name] = selectedSkillId.split(':');
        url = `/api/skills/content?origin=${origin}&name=${encodeURIComponent(name)}&filename=${encodeURIComponent(selectedSkillFile || 'SKILL.md')}`;
      } else if (activeTab === 'Scripts' && selectedFilePath) {
        url = `/api/scripts/content?path=${encodeURIComponent(selectedFilePath)}`;
      } else if (activeTab === 'System' && selectedFilePath) {
        url = `/api/system/content?path=${encodeURIComponent(selectedFilePath)}`;
      } else if (['Dashboard', 'Docs', 'Memory', 'Specs', 'Logs'].includes(activeTab) && selectedFilePath) {
        url = `/api/files/content?path=${encodeURIComponent(selectedFilePath)}`; // Memory/Specs/Docs/Logs all use the same content endpoint with different initial trees
      }

      if (!url) return;

      setLoading(prev => ({ ...prev, content: true }));

      try {
        const res = await fetch(url);
        let data: any;

        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }

        if (!res.ok) {
          setContentError(data?.error || `Error ${res.status}: ${res.statusText}`);
          setLoading(prev => ({ ...prev, content: false }));
          return;
        }

        if (activeTab === 'Git') {
          if (selectedGitCommit) {
            setGitDiff({ staged: null, unstaged: null, untracked: null, commit: data });
          } else {
            setGitDiff({ staged: data.staged, unstaged: data.unstaged, untracked: data.untracked, commit: null });
          }
        } else {
          setFileContent(data.content || '');
          if (activeTab === 'Sessions' || activeTab === 'History') {
            const lines = (data.content || '').split('\n').filter((l: string) => l.trim());
          }
        }

        // Handle Session metadata update
        if (activeTab === 'Sessions' && data.metadata) {
          setSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, size: data.metadata.size, updatedAt: data.metadata.updatedAt } : s));
        }
      } catch (err) {
        console.error(`Fetch failed:`, err);
        setContentError('Failed to load content.');
      } finally {
        setLoading(prev => ({ ...prev, content: false }));
      }
    }

    fetchContent();
  }, [selectedFilePath, selectedSessionId, selectedSkillId, selectedSkillFile, activeTab, historyLimit, viewingJobLog, selectedGitFile, selectedGitCommit, gitFingerprint]);

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const selectedSkill = (skills?.workspace || []).find(s => s.id === selectedSkillId) || (skills?.system || []).find(s => s.id === selectedSkillId);
  const selectedCmd = (cmdHistory || []).find(c => c.id === selectedCmdId);

  const matchesFilter = (text: string) => {
    if (!filterText) return true;
    if (!text) return false;
    return text.toLowerCase().includes(filterText.toLowerCase());
  };



  // Render page's MIDDLE column based on active tab
  const renderMiddle = () => {
    switch (activeTab) {
      case 'Dashboard': return <FileTree nodes={dashboardTree} matchesFilter={matchesFilter} setSelectedFilePath={setSelectedFilePath} selectedFilePath={selectedFilePath} />;
      case 'Docs': return <FileTree nodes={docsTree} matchesFilter={matchesFilter} setSelectedFilePath={setSelectedFilePath} selectedFilePath={selectedFilePath} />;
      case 'Memory': return <FileTree nodes={memoryTree} matchesFilter={matchesFilter} setSelectedFilePath={setSelectedFilePath} selectedFilePath={selectedFilePath} />;
      case 'Specs': return <FileTree nodes={specsTree} matchesFilter={matchesFilter} setSelectedFilePath={setSelectedFilePath} selectedFilePath={selectedFilePath} />;
      case 'Scripts': return <ScriptsToolLeft scriptsTree={scriptsTree} setActiveTab={setActiveTab} matchesFilter={matchesFilter} setSelectedFilePath={setSelectedFilePath} selectedFilePath={selectedFilePath} />;
      case 'Logs': return <FileTree nodes={logsTree} matchesFilter={matchesFilter} setSelectedFilePath={setSelectedFilePath} selectedFilePath={selectedFilePath} />;
      case 'System': return <FileTree nodes={systemTree} collapsibleFolders={true} expandedFolders={expandedFolders} setExpandedFolders={setExpandedFolders} matchesFilter={matchesFilter} setSelectedFilePath={setSelectedFilePath} selectedFilePath={selectedFilePath} />;
      case 'Jobs': return <JobsToolLeft jobs={jobs} matchesFilter={matchesFilter} selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} setViewingJobLog={setViewingJobLog} />;
      case 'Sessions': return <SessionsToolLeft sessions={sessions} matchesFilter={matchesFilter} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} refreshSessions={() => { fetchData('/api/sessions', setSessions, 'sessions'); setSessionsRefreshCount(c => c + 1); }} timeTick={timeTick} sessionsRefreshCount={sessionsRefreshCount} />;
      case 'Cmd': return <CmdToolLeft setLoading={setLoading} loading={loading} cmdHistory={cmdHistory} setCmdHistory={setCmdHistory} setSelectedCmdId={setSelectedCmdId} selectedCmdId={selectedCmdId} />;
      case 'Git': return <GitToolLeft gitStatus={gitStatus} selectedGitFile={selectedGitFile} setSelectedGitFile={setSelectedGitFile} selectedGitType={selectedGitType} setSelectedGitType={setSelectedGitType} setSelectedGitCommit={setSelectedGitCommit} gitStale={gitStale} selectedGitCommit={selectedGitCommit} setGitDiff={setGitDiff} refreshGitStatus={async () => {
        const data = await fetchData('/api/git', setGitStatus, 'git');
        if (data) {
          setGitStatus(data);
          fetch('/api/git/pulse').then(r => r.json()).then(d => {
            setGitFingerprint(d.fingerprint);
            setGitStale(false);
          }).catch(() => { });
        }
      }} />;
      case 'Skills': return <SkillsToolLeft skills={skills} matchesFilter={matchesFilter} setSelectedSkillId={setSelectedSkillId} setSelectedSkillFile={setSelectedSkillFile} setSelectedJobId={setSelectedJobId} setSelectedFilePath={setSelectedFilePath} selectedSkillId={selectedSkillId} />;
      case 'Help': return <HelpToolLeft setSelectedHelpId={setSelectedHelpId} setSelectedJobId={setSelectedJobId} setSelectedFilePath={setSelectedFilePath} selectedHelpId={selectedHelpId} />;
      default: return null;
    }
  };

  // Render page's RIGHT column based on active tab and selection states
  const renderRight = () => {
    switch (activeTab) {
      case 'Dashboard': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Docs': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Memory': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Specs': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Scripts': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Logs': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'System': return <FileViewerRight selectedFilePath={selectedFilePath} activeTab={activeTab} isEditing={isEditing} setIsEditing={setIsEditing} setEditContent={setEditContent} fileContent={fileContent} saveLoading={saveLoading} setSaveLoading={setSaveLoading} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} loading={loading} editContent={editContent} setFileContent={setFileContent} />;
      case 'Jobs': return <JobsToolRight selectedJob={selectedJob} viewingJobLog={viewingJobLog} setViewingJobLog={setViewingJobLog} fileContent={fileContent} historyLimit={historyLimit} loading={loading} setActiveTab={setActiveTab} setSelectedFilePath={setSelectedFilePath} refreshJobs={() => fetchData('/api/jobs', setJobs, 'jobs')} />;
      case 'Sessions': return <SessionsToolRight selectedSession={sessions.find(s => s.id === selectedSessionId)} sessionStale={sessionStale} sessionNewLineCount={sessionNewLineCount} handleRefreshSession={handleRefreshSession} refreshTrigger={sessionRefreshTrigger} />;
      case 'Cmd': return <CmdToolRight selectedCmd={selectedCmd} />;
      case 'Git': return <GitToolRight selectedGitFile={selectedGitFile} selectedGitCommit={selectedGitCommit} loading={loading} gitDiff={gitDiff} selectedGitType={selectedGitType} />;
      case 'Skills': return <SkillsToolRight selectedSkill={selectedSkill} selectedSkillFile={selectedSkillFile} setSelectedSkillFile={setSelectedSkillFile} loading={loading} fileContent={fileContent} fileSearch={fileSearch} setFileSearch={setFileSearch} setCurrentMatchIndex={setCurrentMatchIndex} matchCount={matchCount} setMatchCount={setMatchCount} currentMatchIndex={currentMatchIndex} />;
      case 'Help': return <HelpToolRight selectedHelpId={selectedHelpId} helpLinks={helpLinks} helpShortcuts={helpShortcuts} helpCli={helpCli} gatewayStatus={gatewayStatus} />;
      default: return <div className="p-8 text-[#B8860B]">Select a tool</div>;
    }
  };

  const clearSelection = () => {
    setSelectedFilePath(null);
    setSelectedSessionId(null);
    setSelectedSkillId(null);
    setSelectedHelpId(null);
    setSelectedGitCommit(null);
    setSelectedGitFile(null);
    setSelectedCmdId(null);
  };

  const hasSelection = !!(
    selectedFilePath ||
    selectedSessionId ||
    selectedSkillId ||
    selectedHelpId ||
    selectedGitCommit ||
    selectedGitFile ||
    selectedCmdId
  );

  // Main render
  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#FFF8DC] font-sans selection:bg-[#FFBF00]/30">

      {/* Sidebar */}
      <aside className="flex w-[60px] md:w-[240px] bg-[#080808] flex-col border-r border-[#1F1F1F] h-screen overflow-hidden">

        {/* "Hermes Control" branding with darvis_head.jpg */}
        <div className="p-2 md:p-4 flex items-center gap-0 md:gap-3 mb-2 shrink-0 justify-center md:justify-start">
          <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center bg-[#222222] border border-[#1F1F1F] shrink-0">
            <img src="/avatars/darvis_head.jpg" alt="Darvis" className="w-full h-full object-cover" />
          </div>
          <span className="hidden md:block text-[13px] font-semibold tracking-tight text-[#FFD700] truncate">Hermes Control Dashboard</span>
        </div>

        <nav className="flex-1 px-1.5 md:px-2 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1F1F1F] scrollbar-track-transparent">
          {/* Navigation Items (navItems) added as Buttons */}
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                setFilterText(''); // Clear filter when switching tabs
                setFileSearch(''); // Clear search when switching tabs
                setMatchCount(0); // Reset match count when switching tabs
                setCurrentMatchIndex(0); // Reset match index when switching tabs
                setSelectedFilePath(null); // Clear file selection when switching tools
                setSelectedSessionId(null);
                setSelectedSkillId(null);
                setViewingJobLog(false);

                // Preselect an Item per Tool
                //if (item.name === 'Dashboard') setSelectedFilePath(null);
                //if (item.name === 'Docs') setSelectedFilePath(null);
                if (item.name === 'Memory') setSelectedFilePath('MEMORY.md');
                //if (item.name === 'Specs') setSelectedSpec(null);
                //if (item.name === 'Scripts') setSelectedScript(null);
                //if (item.name === 'Logs') setSelectedLog(null);
                if (item.name === 'System') setSelectedFilePath('config.yaml');
                //if (item.name === 'Jobs' && (jobs?.length || 0) > 0) setSelectedJobId(jobs[0].id);
                if (item.name === 'Cmd') {
                  if (cmdHistory.length === 0) {
                    fetchData('/api/cmd', setCmdHistory, 'cmd');
                  }
                  setSelectedCmdId(null);
                }
                if (item.name === 'Git') setSelectedGitFile(null);
                if (item.name === 'Git') {
                  setGitStale(false);
                  fetch('/api/git/pulse').then(r => r.json()).then(d => setGitFingerprint(d.fingerprint)).catch(() => { });
                }
                if (item.name === 'Skills') {
                  const birdSkill = skills.workspace?.find(s => s.name === 'bird') || skills.workspace?.[0] || skills.system?.[0];
                  if (birdSkill) {
                    setSelectedSkillId(birdSkill.id);
                    setSelectedSkillFile(birdSkill.hasReadme ? 'SKILL.md' : (birdSkill.files[0]?.name || ''));
                  }
                }
                if (item.name === 'Help') setSelectedHelpId('Links');
              }}
              className={cn(
                "w-full flex items-center gap-0 md:gap-2.5 px-2 md:px-3 py-1.5 rounded-md text-[13px] font-medium transition-all group justify-center md:justify-start",
                activeTab === item.name ? "bg-[#1F1F1F] text-[#FFF8DC]" : "text-[#B8860B] hover:text-[#FFF8DC] hover:bg-[#161616]"
              )}
            >
              <item.icon size={16} className={cn("transition-colors shrink-0", activeTab === item.name ? "text-[#FFBF00]" : "text-[#B8860B] group-hover:text-[#FFF8DC]")} />
              <span className="hidden md:block truncate">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* System Status Footer */}
        <div className="hidden md:block">
          <SystemStatus
            gatewayStatus={gatewayStatus}
            sessions={sessions}
            jobs={jobs}
            gitStatus={gitStatus}
            modelStatus={modelStatus}
            updating={updating}
            setUpdating={setUpdating}
            isMounted={isMounted}
            onNavigateToSessions={() => {
              setActiveTab('Sessions');
            }}
            onNavigateToJobs={() => {
              setActiveTab('Jobs');
            }}
            onNavigateToGit={() => {
              setActiveTab('Git');
            }}
          />
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row p-2 md:p-4 gap-4">

          {/* Middle Column */}
          <div className={cn(
            "w-full sm:w-[260px] md:w-[280px] lg:w-[320px] flex flex-col gap-3",
            hasSelection ? "hidden sm:flex" : "flex"
          )}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B8860B]" size={14} />
              <input
                type="text"
                placeholder={`Filter ${activeTab.toLowerCase()}...`}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-[#222222] border border-[#1F1F1F] rounded-md px-8 py-1.5 text-[12px] w-full focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {renderMiddle()}
            </div>
          </div>

          {/* Right Column */}
          <div className={cn(
            "flex-1 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl flex flex-col shadow-2xl overflow-hidden",
            !hasSelection ? "hidden sm:flex" : "flex"
          )}>
            {hasSelection && (
              <div className="flex items-center p-2 border-b border-[#1F1F1F] sm:hidden bg-[#0A0A0A]/50 backdrop-blur-md">
                <button
                  onClick={clearSelection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-[#B8860B] hover:text-[#FFF8DC] hover:bg-[#161616] transition-all"
                >
                  <ChevronLeft size={16} />
                  <span>Back to list</span>
                </button>
              </div>
            )}
            {renderRight()}
          </div>
        </div>
      </main>

    </div>
  );
}


