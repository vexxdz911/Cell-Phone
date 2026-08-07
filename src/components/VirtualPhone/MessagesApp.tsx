import React, { useState } from 'react';
import { ChevronLeft, Copy, Check, MessageSquare, Plus, Send, ExternalLink } from 'lucide-react';
import { SMSMessage } from '../../types';

interface MessagesAppProps {
  messages: SMSMessage[];
  onBack: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onSendTestSMS: (senderName: string, body: string, code?: string) => void;
}

export const MessagesApp: React.FC<MessagesAppProps> = ({
  messages,
  onBack,
  onCopyCode,
  copiedCode,
  onSendTestSMS,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<SMSMessage | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeSender, setComposeSender] = useState('Google Security');
  const [composeBody, setComposeBody] = useState('G-928410 is your Google verification code.');
  const [composeCode, setComposeCode] = useState('928410');

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeBody) return;
    onSendTestSMS(composeSender, composeBody, composeCode);
    setShowCompose(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white z-10 overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={selectedMessage ? () => setSelectedMessage(null) : onBack}
          className="flex items-center text-indigo-400 font-medium text-xs hover:text-indigo-300"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>{selectedMessage ? 'Messages' : 'Home'}</span>
        </button>

        <h2 className="text-xs font-semibold text-slate-100">
          {selectedMessage ? selectedMessage.senderName : 'SMS Messages'}
        </h2>

        {!selectedMessage ? (
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="p-1 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800"
            title="Compose Test SMS"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-6"></div>
        )}
      </div>

      {/* Compose Test SMS Drawer */}
      {showCompose && !selectedMessage && (
        <form onSubmit={handleSendCustom} className="p-3 bg-slate-900 border-b border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-300 flex justify-between items-center">
            <span>Simulate Incoming SMS</span>
            <button type="button" onClick={() => setShowCompose(false)} className="text-slate-500 hover:text-slate-300">Cancel</button>
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Sender Name</label>
            <input
              type="text"
              value={composeSender}
              onChange={(e) => setComposeSender(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. GitHub"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Message Body</label>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500 h-14"
              placeholder="Your code is 123456..."
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400">OTP Code (Optional)</label>
              <input
                type="text"
                value={composeCode}
                onChange={(e) => setComposeCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              className="self-end px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center space-x-1"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </div>
        </form>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {selectedMessage ? (
          /* Single Message Detail View */
          <div className="space-y-4">
            <div className="text-center text-[10px] text-slate-500">{selectedMessage.timestamp}</div>
            
            <div className="bg-slate-900 border border-indigo-500/30 ring-1 ring-indigo-500/20 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center space-x-2.5 border-b border-slate-800/80 pb-2.5">
                <div className={`w-8 h-8 rounded-full ${selectedMessage.avatarColor || 'bg-indigo-600'} flex items-center justify-center font-bold text-xs`}>
                  {selectedMessage.senderName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-xs text-indigo-400">{selectedMessage.senderName}</div>
                  <div className="text-[10px] text-slate-400">{selectedMessage.sender}</div>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">{selectedMessage.body}</p>

              {selectedMessage.code && (
                <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Detected Code</div>
                    <div className="text-lg font-mono font-bold text-indigo-300 tracking-widest">{selectedMessage.code}</div>
                  </div>
                  <button
                    onClick={() => onCopyCode(selectedMessage.code!)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center space-x-1.5 shadow transition ${
                      copiedCode === selectedMessage.code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copiedCode === selectedMessage.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {selectedMessage.link && (
                <div className="bg-purple-950/60 border border-purple-500/40 rounded-xl p-2.5 space-y-2">
                  <div className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">Magic Verification Link</div>
                  <div className="text-xs font-mono text-purple-200 truncate bg-slate-950 p-2 rounded border border-purple-500/20">
                    {selectedMessage.link}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onCopyCode(selectedMessage.link!)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center space-x-1.5 shadow transition ${
                        copiedCode === selectedMessage.link
                          ? 'bg-emerald-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {copiedCode === selectedMessage.link ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <a
                      href={selectedMessage.link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Link</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Messages Inbox List */
          messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No SMS messages received yet.</p>
              <p className="text-[10px]">Use the Sandbox or API Console to trigger test 2FA codes!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 cursor-pointer transition flex items-start justify-between gap-2"
              >
                <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full ${msg.avatarColor || 'bg-indigo-600'} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {msg.senderName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-100 truncate">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate mt-0.5">{msg.body}</p>
                    
                    {msg.code && (
                      <span className="inline-block mt-1 font-mono text-[10px] bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                        OTP: {msg.code}
                      </span>
                    )}
                  </div>
                </div>

                {msg.code && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyCode(msg.code!);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg transition"
                    title="Copy Code"
                  >
                    {copiedCode === msg.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
