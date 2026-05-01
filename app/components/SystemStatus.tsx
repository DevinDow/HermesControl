"use client";

import React, { useState } from 'react';
import { Users, Clock, ArrowUpCircle, Loader2, Heart, GitBranch, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

export function SystemStatus({ 
  gatewayStatus,
  sessions,
  jobs,
  gitStatus,
  modelStatus,
  updating,
  setUpdating,
  isMounted,
  onNavigateToHeartbeat,
  onNavigateToSessions,
  onNavigateToJobs,
  onNavigateToModel,
  onNavigateToGit
}: any) {
  const [heartbeatTooltip, setHeartbeatTooltip] = useState(false);

  // Format relative time for heartbeat
  const formatHeartbeatTime = (ts: number) => {
    const now = Date.now();
    const diffMs = now - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Parse interval string for compact display (e.g., "3h" -> "3h")
  const formatInterval = (interval: string) => {
    if (!interval || interval === '?') return 'unknown';
    const match = interval.match(/(\d+)([hmd])/);
    if (!match) return interval;
    const [, num, unit] = match;
    return `${num}${unit}`;
  };

  // Format active hours (e.g., "10:00" -> "10am")
  const formatTime = (timeStr: string) => {
    const [hours, mins] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}${ampm}`;
  };

  return (
    <div className="p-4 border-t border-[#1F1F1F] bg-[#080808]">
      <div className="flex flex-col">
        
        {/* ONLINE, Version */}
        <div className="flex justify-between">

          {/* • ONLINE */}
          <div className="flex items-center text-[11px] font-medium text-[#B8860B]">
            {/* • */}
            <div className={cn("w-1.5 h-1.5 mr-2 rounded-full shadow-[0_0_9px]",
              gatewayStatus.online ? "bg-[#22C55E] shadow-green-500/30 animate-pulse" : "bg-red-500 shadow-red-500/30")} 
            />
            {/* ONLINE */}
            {gatewayStatus.online ? 'ONLINE' : 'OFFLINE'}
          </div>

          {/* Version */}
          {gatewayStatus.version && (
            <div className="text-[11px] font-mono text-[#B8860B]">
              {gatewayStatus.version.replace(/^Hermes Agent\s*/, '')}
            </div>
          )}

        </div>

        {/* Update Available BUTTON */}
        {gatewayStatus.updateAvailable && (
          <button 
            onClick={async () => {
              const promptText = gatewayStatus.updateString ? `Update Hermes? ${gatewayStatus.updateString}` : 'Update Hermes?';
              if (!confirm(`${promptText}\nThis will restart the gateway.`)) return;
              setUpdating(true);
              try {
                const res = await fetch('/api/update', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  alert('Update initiated successfully. The dashboard will lose connection momentarily while the gateway restarts.');
                } else {
                  alert(`Update failed: ${data.error}`);
                }
              } catch (err) {
                console.error('Update fetch error:', err);
              } finally {
                setUpdating(false);
              }
            }}
            disabled={updating}
            className="mx-0.5 p-2 rounded-lg bg-[#FFBF00]/10 border border-[#FFBF00]/20 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 hover:bg-[#FFBF00]/20 transition-all text-left w-full group"
          >

            {/* Updating... */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#FFBF00] uppercase tracking-widest">
                {updating ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpCircle size={12} />}
                {updating ? 'Updating...' : 'Update Available'}
              </div>
            </div>

            {/* Update available */}
            <div className="text-[9px] text-[#FFF8DC] font-mono">
              {gatewayStatus.updateString ?? 'Update available'}
            </div>

          </button>
        )}

        {/* Model */}
        <div className="my-1 flex items-center transition-all">
          <Brain size={12} className="text-[#FFBF00] mr-2" />
          <div className="flex flex-col font-mono truncate max-w-[200px]">
            {modelStatus?.model ? (
              <div>
                <div className="text-[10px] text-[#B8860B]">{modelStatus.provider || ''} / {modelStatus.host || ''}</div>
                <div className="text-[11px] text-[#FFF8DC]">{modelStatus.model}</div>
              </div>
            ) : (
              <div className="text-[11px] text-[#FFF8DC]">Loading...</div>
            )}
          </div>
        </div>

        {/* Sessions, Jobs */}
        <div className="flex justify-between">
          {/* Sessions BUTTON */}
          <button onClick={onNavigateToSessions} className="flex p-1.5 hover:bg-[#222222] rounded transition-all">
            <span className="text-[9px] font-bold text-[#B8860B] uppercase tracking-widest flex items-center">
              <Users size={12} className="text-[#FFBF00] mr-2" /> 
              Sessions
            </span>
            <span className="text-[11px] text-[#FFF8DC] font-mono ml-2">{sessions?.length || 0}</span>
          </button>
          {/* Jobs BUTTON */}
          <button onClick={onNavigateToJobs} className="flex p-1.5 hover:bg-[#222222] rounded transition-all">
            <span className="text-[9px] font-bold text-[#B8860B] uppercase tracking-widest flex items-center">
              <Clock size={12} className="text-[#FFBF00] mr-2" />
              Jobs
            </span>
            <span className="text-[11px] text-[#FFF8DC] font-mono ml-2">{jobs?.filter((j: any) => j.enabled).length || 0}</span>
          </button>
        </div>

        {/* Git */}
        <button onClick={onNavigateToGit} className="flex items-center gap-2 p-1.5 hover:bg-[#222222] rounded transition-all">
          <GitBranch size={12} className="text-[#FFBF00]" />
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] font-bold text-[#B8860B] uppercase tracking-widest flex items-center gap-1.5">
              STAGED
            </div>
            <div className="text-[12px] text-[#FFF8DC] font-mono">
              {gitStatus?.staged?.length || 0}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] font-bold text-[#B8860B] uppercase tracking-widest flex items-center">
              UNSTAGED
            </div>
            <div className="text-[12px] text-[#FFF8DC] font-mono">
              {gitStatus?.unstaged?.length || 0}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] font-bold text-[#B8860B] uppercase tracking-widest flex items-center">
              UNTRACKED
            </div>
            <div className="text-[12px] text-[#FFF8DC] font-mono">
              {gitStatus?.untracked?.length || 0}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}


