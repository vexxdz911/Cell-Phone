import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, BellOff } from 'lucide-react';

interface StatusBarProps {
  carrier: string;
  isMuted: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ carrier, isMuted }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex items-center justify-between px-6 pt-3 pb-2 text-xs font-semibold text-white select-none z-20">
      <div className="flex items-center space-x-1.5 tracking-tight">
        <span>{time || '10:14 AM'}</span>
        {isMuted && <BellOff className="w-3 h-3 text-amber-400 ml-1 inline" />}
      </div>

      {/* Dynamic Island Notch Area spacer */}
      <div className="w-24 h-5 bg-black rounded-full border border-gray-800 flex items-center justify-center space-x-2">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
        <div className="w-2 h-2 rounded-full bg-blue-900/60 animate-pulse"></div>
      </div>

      <div className="flex items-center space-x-1.5 text-xs text-slate-200">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hidden sm:inline">{carrier}</span>
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center space-x-0.5">
          <Battery className="w-4 h-4 fill-emerald-400 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
