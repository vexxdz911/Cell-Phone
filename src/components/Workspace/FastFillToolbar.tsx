import React from 'react';
import { Copy, Check, Shield, Flame, Sparkles, Smartphone, Volume2, VolumeX } from 'lucide-react';

interface FastFillToolbarProps {
  latestCode: string | null;
  latestSender: string | null;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  phoneNumber: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const FastFillToolbar: React.FC<FastFillToolbarProps> = ({
  latestCode,
  latestSender,
  onCopyCode,
  copiedCode,
  phoneNumber,
  isMuted,
  onToggleMute,
}) => {
  const isCopied = latestCode && copiedCode === latestCode;

  return (
    <nav className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0 text-white z-30 relative">
      {/* Left: Brand & Active Virtual Number */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-white flex items-center space-x-2">
            <span>DevFlow <span className="text-indigo-400">Secure</span></span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">{phoneNumber}</div>
        </div>
      </div>

      {/* Middle: Active 2FA Fast Fill Bar */}
      {latestCode ? (
        <div className="bg-slate-900 border border-indigo-500/40 ring-1 ring-indigo-500/20 rounded-xl px-3.5 py-1 flex items-center space-x-3 shadow-xl">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-indigo-400 animate-bounce" />
            <div>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block leading-none">
                {latestSender || 'Latest 2FA Code'}
              </span>
              <span className="text-base font-mono font-bold text-white tracking-widest leading-tight">
                {latestCode}
              </span>
            </div>
          </div>

          <button
            onClick={() => onCopyCode(latestCode)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg ${
              isCopied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy 2FA Code</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Waiting for incoming 2FA verification request...</span>
        </div>
      )}

      {/* Right: Sound Alert Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleMute}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center space-x-1.5 ${
            isMuted
              ? 'bg-slate-800 border-slate-700 text-slate-400'
              : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
          }`}
          title={isMuted ? 'Unmute Phone Alerts' : 'Mute Phone Alerts'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          <span className="hidden md:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>
      </div>
    </nav>
  );
};
