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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50"> {/* DIV for Background Opacity */}
      <div className="fixed inset-20 top-5"> {/* DIV for INSET */}

        <div className="bg-[#111111] p-4 rounded-xl border border-[#FFBF00]"> {/* DIV for outer FRAME */}
          {title && (
            <div className="mb-2 text-lg font-semibold text-[#FFF8DC]"> {/* DIV for TITLE */}
              {title}
            </div>
          )}
          <div className="bg-[#222222] p-2 rounded border border-[#FFBF00] max-h-[calc(100vh-10rem)] overflow-auto"> {/* DIV for CHILDREN */}
            {children}
          </div>

            {/* Close Button */}
            <button className="rounded bg-[#FFBF00]/50 mt-3 p-1 w-full text-black font-bold uppercase hover:bg-[#FFBF00]/65 transition-all"
              onClick={onClose}>
              Close
            </button>
        </div>
      </div>
    </div>
  );
}
