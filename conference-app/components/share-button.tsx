'use client';

import { useState } from 'react';

export function ShareButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = getText();

    // Use native share sheet on mobile (iOS, Android)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        // User cancelled or share failed — fall through to clipboard
        if ((e as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-[#1c1c13] text-white hover:bg-[#1c1c13]/80 transition-all active:scale-95"
    >
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
        {copied ? 'check' : 'share'}
      </span>
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
