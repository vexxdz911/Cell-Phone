import React from 'react';
import {
  MessageSquare,
  ShieldCheck,
  PhoneCall,
  Key,
  FileText,
  Settings,
  Sparkles,
  Search,
  Check,
  Copy,
  Flame,
  Mail,
} from 'lucide-react';
import { AppView, PhoneState } from '../../types';

interface HomeScreenProps {
  phoneState: PhoneState;
  onOpenApp: (app: AppView) => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  phoneState,
  onOpenApp,
  onCopyCode,
  copiedCode,
}) => {
  // Count unread messages & pending push requests
  const unreadMessagesCount = phoneState.messages.filter((m) => !m.read).length;
  const pendingPushCount = phoneState.pushRequests.filter((p) => p.status === 'pending').length;
  const incomingCallsCount = phoneState.calls.filter((c) => c.status === 'incoming').length;

  // Find most recent 2FA code
  const latestMessage = phoneState.messages.find((m) => m.code);
  const latestCode = latestMessage?.code;

  const appGrid = [
    {
      id: 'messages' as AppView,
      name: 'Messages',
      icon: MessageSquare,
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      badge: unreadMessagesCount,
    },
    {
      id: 'gmail' as AppView,
      name: 'Gmail Hub',
      icon: Mail,
      bg: 'bg-gradient-to-br from-red-500 to-red-700',
    },
    {
      id: 'authenticator' as AppView,
      name: 'Authenticator',
      icon: Key,
      bg: 'bg-gradient-to-br from-indigo-600 to-indigo-800',
      badge: phoneState.totpAccounts.length,
      badgeColor: 'bg-slate-700',
    },
    {
      id: 'push' as AppView,
      name: 'Push Verify',
      icon: ShieldCheck,
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-700',
      badge: pendingPushCount,
      badgeColor: 'bg-emerald-500 animate-pulse',
    },
    {
      id: 'calls' as AppView,
      name: 'Phone Calls',
      icon: PhoneCall,
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      badge: incomingCallsCount,
      badgeColor: 'bg-green-500 animate-bounce',
    },
    {
      id: 'ai_assistant' as AppView,
      name: 'AI Code Extractor',
      icon: Sparkles,
      bg: 'bg-gradient-to-br from-purple-600 to-pink-600',
    },
    {
      id: 'notes' as AppView,
      name: 'Backup Vault',
      icon: FileText,
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    },
    {
      id: 'settings' as AppView,
      name: 'Settings',
      icon: Settings,
      bg: 'bg-gradient-to-br from-slate-600 to-slate-800',
    },
  ];

  const currentDate = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col justify-between p-4 z-10 text-white overflow-y-auto">
      {/* Clock & Date Widget */}
      <div className="mt-2 text-center">
        <h1 className="text-4xl font-extralight tracking-tight drop-shadow">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h1>
        <p className="text-xs text-slate-300 font-medium tracking-wide mt-1">{currentDate}</p>

        {/* Quick Latest 2FA Code Widget */}
        {latestCode && (
          <div className="mt-4 bg-slate-900/80 backdrop-blur border border-amber-500/40 rounded-2xl p-3 shadow-lg flex items-center justify-between text-left">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Latest 2FA Code</div>
                <div className="text-sm font-mono font-bold text-amber-300">{latestCode}</div>
              </div>
            </div>
            <button
              onClick={() => onCopyCode(latestCode)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1 shadow transition"
            >
              {copiedCode === latestCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-4 gap-y-5 gap-x-3 my-6 px-1">
        {appGrid.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => onOpenApp(app.id)}
              className="flex flex-col items-center group focus:outline-none"
            >
              <div className="relative">
                <div
                  className={`w-13 h-13 rounded-2xl ${app.bg} flex items-center justify-center shadow-lg group-hover:scale-105 group-active:scale-95 transition-transform duration-200 border border-white/10`}
                >
                  <Icon className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                {app.badge !== undefined && app.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 ${
                      app.badgeColor || 'bg-red-500'
                    } text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-slate-900 shadow`}
                  >
                    {app.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-200 mt-1.5 text-center truncate max-w-[64px] drop-shadow">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar / Fast Action Widget */}
      <div className="mb-2">
        <button
          onClick={() => onOpenApp('ai_assistant')}
          className="w-full bg-slate-900/60 backdrop-blur hover:bg-slate-900/80 border border-slate-700/60 rounded-2xl py-2 px-3 flex items-center justify-between text-xs text-slate-400 shadow-md transition"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Paste email / log to extract code...</span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </button>
      </div>

      {/* Phone App Dock */}
      <div className="bg-slate-900/70 backdrop-blur-md rounded-3xl p-2.5 flex items-center justify-around border border-white/10 shadow-2xl">
        <button
          onClick={() => onOpenApp('messages')}
          className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md hover:scale-105 active:scale-95 transition"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={() => onOpenApp('authenticator')}
          className="p-2.5 rounded-2xl bg-indigo-700 text-white shadow-md hover:scale-105 active:scale-95 transition"
        >
          <Key className="w-5 h-5" />
        </button>
        <button
          onClick={() => onOpenApp('push')}
          className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md hover:scale-105 active:scale-95 transition"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>
        <button
          onClick={() => onOpenApp('calls')}
          className="p-2.5 rounded-2xl bg-green-600 text-white shadow-md hover:scale-105 active:scale-95 transition"
        >
          <PhoneCall className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
