import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, Mail, Copy, Check, Flame, ExternalLink, ShieldCheck, Search, X } from 'lucide-react';
import { fetchGmailMessages, ParsedGmailMessage } from '../../lib/gmail';
import { getAccessToken } from '../../lib/firebase';

interface GmailAppProps {
  onBack: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}

export const GmailApp: React.FC<GmailAppProps> = ({ onBack, onCopyCode, copiedCode }) => {
  const [messages, setMessages] = useState<ParsedGmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const loadGmail = async () => {
    const token = getAccessToken();
    if (!token) {
      setError('Gmail not connected. Please connect Gmail in the Workspace tab.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGmailMessages(token, 'verification OR code OR OTP OR login OR 2FA', 10);
      setMessages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to sync Gmail messages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGmail();
  }, []);

  const filteredMessages = messages.filter((msg) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const sender = msg.from.toLowerCase();
    const subject = msg.subject.toLowerCase();
    const snippet = msg.snippet.toLowerCase();
    const code = msg.code?.toLowerCase() || '';
    return sender.includes(q) || subject.includes(q) || snippet.includes(q) || code.includes(q);
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-red-950/60 border-b border-red-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-1.5">
            <Mail className="w-4 h-4 text-red-400" />
            <h2 className="text-xs font-bold text-slate-100">Gmail Verification Inbox</h2>
          </div>
        </div>

        <button
          onClick={loadGmail}
          disabled={isLoading}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs transition"
          title="Refresh Gmail"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="px-3 pt-2.5 pb-2 border-b border-slate-800/80 bg-slate-950/90">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by sender or subject..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/60"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {error ? (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-2">
            <Mail className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-slate-300 font-medium">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-red-400 mx-auto" />
            <p>Scanning Gmail inbox for 2FA codes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <Mail className="w-8 h-8 text-slate-700 mx-auto" />
            <p>No verification emails found recently.</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <Search className="w-6 h-6 text-slate-700 mx-auto" />
            <p>No emails match "{filterQuery}".</p>
            <button
              onClick={() => setFilterQuery('')}
              className="text-red-400 font-semibold hover:underline text-xs"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 space-y-2 shadow"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-red-400 truncate max-w-[160px]">
                  {msg.from.replace(/<.*>/, '').trim()}
                </span>
                <span className="text-slate-500 text-[10px]">
                  {msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>

              <div className="text-xs font-medium text-slate-200 line-clamp-1">{msg.subject}</div>

              {msg.code && (
                <div className="bg-amber-950/60 border border-amber-500/40 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="font-mono font-bold text-amber-300 text-sm">{msg.code}</span>
                  </div>
                  <button
                    onClick={() => onCopyCode(msg.code!)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded flex items-center space-x-1 shadow"
                  >
                    {copiedCode === msg.code ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {msg.magicLink && (
                <div className="bg-purple-950/60 border border-purple-500/40 rounded-lg p-2 space-y-1">
                  <div className="text-[10px] text-purple-300 truncate font-mono">{msg.magicLink}</div>
                  <div className="flex justify-end space-x-1.5">
                    <button
                      onClick={() => onCopyCode(msg.magicLink!)}
                      className="px-2 py-1 bg-purple-600 text-white text-[10px] font-semibold rounded"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 line-clamp-2">{msg.snippet}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
