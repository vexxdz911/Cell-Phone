import React, { useEffect } from 'react';
import { MessageSquare, ShieldCheck, PhoneCall, Copy, Check, X, ExternalLink, Link2, Sparkles } from 'lucide-react';
import { AppView } from '../../types';

interface TopBannerProps {
  notification: {
    id: string;
    type: 'sms' | 'push' | 'call';
    title: string;
    message: string;
    code?: string;
    link?: string;
    externalApp?: string;
  };
  onDismiss: () => void;
  onOpenApp: (app: AppView) => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  notification,
  onDismiss,
  onOpenApp,
  onCopyCode,
  copiedCode,
}) => {
  useEffect(() => {
    // Auto dismiss call notification if not answered after 12s, or SMS after 10s
    const timer = setTimeout(() => {
      onDismiss();
    }, notification.type === 'call' ? 12000 : 10000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const handleTap = () => {
    if (notification.type === 'sms') onOpenApp('messages');
    else if (notification.type === 'push') onOpenApp('push');
    else if (notification.type === 'call') onOpenApp('calls');
    onDismiss();
  };

  const isCopiedCode = notification.code && copiedCode === notification.code;
  const isCopiedLink = notification.link && copiedCode === notification.link;

  return (
    <div className="absolute top-12 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 ring-1 ring-indigo-500/20 rounded-2xl p-3 shadow-2xl text-white text-xs">
        <div className="flex items-start justify-between gap-2">
          {/* Icon */}
          <div className="flex items-center gap-2.5 cursor-pointer flex-1" onClick={handleTap}>
            <div
              className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
                notification.externalApp
                  ? 'bg-purple-600 text-white'
                  : notification.type === 'sms'
                  ? 'bg-indigo-600 text-white'
                  : notification.type === 'push'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-600 text-white animate-bounce'
              }`}
            >
              {notification.externalApp ? <Sparkles className="w-4 h-4" /> : notification.type === 'sms' ? <MessageSquare className="w-4 h-4" /> : notification.type === 'push' ? <ShieldCheck className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                  <span>{notification.title}</span>
                  {notification.externalApp && (
                    <span className="text-[9px] bg-purple-500/30 border border-purple-400/40 text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      EXTERNAL
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">now</span>
              </div>
              <p className="text-slate-300 text-[11px] line-clamp-2 mt-0.5">{notification.message}</p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Button if code or link exists */}
        {(notification.code || notification.link) && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            {notification.code && (
              <>
                <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 px-2 py-0.5 rounded">
                  OTP: {notification.code}
                </span>
                <button
                  onClick={() => onCopyCode(notification.code!)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-semibold text-[11px] transition shadow-md ${
                    isCopiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                  }`}
                >
                  {isCopiedCode ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </>
            )}

            {notification.link && !notification.code && (
              <>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded truncate max-w-[150px]">
                  {notification.link}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onCopyCode(notification.link!)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                      isCopiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {isCopiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={notification.link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    title="Open Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

