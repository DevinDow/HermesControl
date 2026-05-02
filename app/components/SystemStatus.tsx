"use client";

import React, { useState } from 'react';
import { Users, Clock, ArrowUpCircle, Loader2, GitBranch, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { ModalDialog } from './ModalDialog';

export function SystemStatus({ 
  gatewayStatus,
  sessions,
  jobs,
  gitStatus,
  modelStatus,
  updating,
  setUpdating,
  onNavigateToSessions,
  onNavigateToJobs,
  onNavigateToGit
}: any) {

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  return (
    <div className="flex flex-col p-2 border-t border-[#1F1F1F] bg-[#080808]">
        
      {/* ONLINE, Version row */}
      <div className="flex justify-between">

        {/* • ONLINE button */}
        <button className="flex items-center p-1.5 text-[11px] text-[#B8860B] hover:bg-[#222222] rounded transition-all"
          onClick={async () => {
            try {
              const res = await fetch('/api/status');
              const text = await res.text();
              if (res.ok) {
                setModalTitle('api/status');
                setModalContent(text);
                setModalOpen(true);
              } else {
                alert(`api/status failed: ${text}`);
              }
            } catch (err) {
              console.error('api/status error:', err);
            }
          }}
        >
          {/* • pulsing green/red circle */}
          <div className={cn("w-1.5 h-1.5 mr-2 rounded-full shadow-[0_0_9px]",
            gatewayStatus.online ? "bg-[#22C55E] shadow-green-500/30 animate-pulse" : "bg-red-500 shadow-red-500/30")} 
          />
          {/* ONLINE text */}
          {gatewayStatus.online ? 'ONLINE' : 'OFFLINE'}
        </button>

        {/* Version button */}
        <button className="flex items-center p-1.5 text-[11px] text-[#B8860B] hover:bg-[#222222] rounded transition-all"
          onClick={async () => {
            try {
              const res = await fetch('/api/version');
              const data = await res.json();
              if (res.ok) {
                setModalTitle('api/version');
                setModalContent(JSON.stringify(data, null, 2));
                setModalOpen(true);
              } else {
                alert(`api/version failed: ${data.error}`);
              }
            } catch (err) {
              console.error('api/version error:', err);
            }
          }}
        >

          {/* Version text = "updating..." : gatewayStatus.version : "fetching version..." */}
          {updating ? (
            <div className="font-mono">updating...</div>
          ) : gatewayStatus.version ? (
            <div className="font-mono">
              {gatewayStatus.version.replace(/^Hermes Agent\s*/, '')}
            </div>
          ) : (
            "fetching version..."
          )}
        </button>

      </div>

      <ModalDialog open={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>
        <pre className="whitespace-pre-wrap break-words text-[#FFF8DC]">{modalContent}</pre>
      </ModalDialog>

      {/* Update Available button */}
      {gatewayStatus.updateAvailable && (
        <button className="mx-0.5 p-2 rounded-lg bg-[#FFBF00]/10 border border-[#FFBF00]/20 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 hover:bg-[#FFBF00]/20 transition-all text-left w-full group"
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
              <div className="text-[10px] text-[#B8860B]">{modelStatus.host || ''} / {modelStatus.provider || ''}</div>
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
  );
}


