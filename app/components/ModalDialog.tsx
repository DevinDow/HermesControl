"use client";

import React from 'react';

type ModalDialogProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalDialog({ open, title, onClose, children }: ModalDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"> {/* DIV for Background Opacity */}
      <div className="w-full max-w-4xl"> {/* DIV for INSET */}

        {/* SECTION for outer FRAME */}
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className="rounded-xl border border-[#FFBF00] bg-[#111111] p-4 shadow-2xl"
        >
          {title && (
            <div id="modal-title" className="mb-2 text-lg font-semibold text-[#FFF8DC]">
              {title}
            </div>
          )}
          <div className="bg-[#222222] p-2 rounded border border-[#FFBF00] max-h-[calc(100vh-12rem)] overflow-auto"> {/* DIV for CHILDREN */}
            <pre className="whitespace-pre-wrap break-words text-[#FFF8DC]">{children}</pre>
          </div>
          {/* Close Button */}
          <button
            type="button"
            className="mt-3 w-full rounded bg-[#FFBF00]/50 px-4 py-2 text-black font-bold uppercase hover:bg-[#FFBF00]/65 transition-all"
            onClick={onClose}
          >
            Close
          </button>
        </section>
      </div>
    </div>
  );
}
