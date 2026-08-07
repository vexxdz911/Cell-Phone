import React from 'react';
import {
  Maximize2,
  Minimize2,
  Smartphone,
  Volume2,
  VolumeX,
  MessageSquare,
  ShieldCheck,
  PhoneCall,
  Layout,
  Move,
} from 'lucide-react';

export type PhoneDockPosition = 'dock_right' | 'dock_left' | 'floating' | 'mini';

interface DockControlsProps {
  dockPosition: PhoneDockPosition;
  onChangePosition: (pos: PhoneDockPosition) => void;
  scale: number;
  onChangeScale: (scale: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onQuickSMS: () => void;
  onQuickPush: () => void;
  onQuickCall: () => void;
}

export const DockControls: React.FC<DockControlsProps> = ({
  dockPosition,
  onChangePosition,
  scale,
  onChangeScale,
  isMuted,
  onToggleMute,
  onQuickSMS,
  onQuickPush,
  onQuickCall,
}) => {
  return (
    <footer className="min-h-10 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center px-6 py-1.5 justify-between text-[10px] uppercase tracking-widest text-slate-500 shrink-0 font-bold gap-3 z-20">
      {/* Status & ID Indicator */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-1.5 text-slate-400">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>VIRTUAL DEVICE CONNECTED (ID: V-782)</span>
        </div>
        <span className="opacity-30 hidden sm:inline">|</span>
        <span className="hidden sm:inline">SYNC LATENCY: 12MS</span>
      </div>

      {/* Position Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-slate-400 text-[10px] uppercase tracking-wider hidden sm:inline">Layout:</span>
        <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center space-x-1">
          <button
            onClick={() => onChangePosition('dock_right')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              dockPosition === 'dock_right'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dock Right
          </button>
          <button
            onClick={() => onChangePosition('dock_left')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              dockPosition === 'dock_left'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dock Left
          </button>
          <button
            onClick={() => onChangePosition('floating')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
              dockPosition === 'floating'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Move className="w-2.5 h-2.5" />
            <span>Floating</span>
          </button>
          <button
            onClick={() => onChangePosition('mini')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              dockPosition === 'mini'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mini
          </button>
        </div>
      </div>

      {/* Zoom Scale Control */}
      <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
        <button
          onClick={() => onChangeScale(Math.max(0.7, scale - 0.1))}
          className="p-0.5 text-slate-400 hover:text-white"
          title="Zoom Out"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
        <span className="font-mono text-[10px] px-1 font-bold text-slate-300">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => onChangeScale(Math.min(1.2, scale + 0.1))}
          className="p-0.5 text-slate-400 hover:text-white"
          title="Zoom In"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Quick Triggers */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onQuickSMS}
          className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded text-[10px] font-bold flex items-center space-x-1 transition"
        >
          <MessageSquare className="w-2.5 h-2.5" />
          <span>+SMS</span>
        </button>
        <button
          onClick={onQuickPush}
          className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded text-[10px] font-bold flex items-center space-x-1 transition"
        >
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>+Push</span>
        </button>
        <button
          onClick={onQuickCall}
          className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded text-[10px] font-bold flex items-center space-x-1 transition"
        >
          <PhoneCall className="w-2.5 h-2.5" />
          <span>+Call</span>
        </button>
      </div>

      <div className="hidden lg:flex gap-4">
        <span>ENCRYPTION: AES-256</span>
        <span>BUILD 1.0.4-STABLE</span>
      </div>
    </footer>
  );
};
