import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Send, Copy, Check, MessageSquare } from 'lucide-react';

interface AIAssistantAppProps {
  onBack: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onInjectSMS: (senderName: string, body: string, code?: string) => void;
}

export const AIAssistantApp: React.FC<AIAssistantAppProps> = ({
  onBack,
  onCopyCode,
  copiedCode,
  onInjectSMS,
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    code: string | null;
    sender: string;
    summary: string;
  } | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/extract-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: inputText }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInjectToPhone = () => {
    if (!result) return;
    onInjectSMS(
      result.sender || 'Extracted Code',
      result.summary || inputText,
      result.code || undefined
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white z-10 overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-blue-400 font-medium text-xs hover:text-blue-300"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Home</span>
        </button>

        <div className="flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <h2 className="text-xs font-semibold text-slate-100">AI Code Extractor</h2>
        </div>

        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-3 space-y-1">
          <h3 className="font-bold text-xs text-purple-300 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Gemini Extractor</span>
          </h3>
          <p className="text-[10px] text-slate-300 leading-normal">
            Paste any unformatted email body, webhook log, or multi-line text below. AI will isolate the 2FA security code and format it for 1-click verification!
          </p>
        </div>

        <form onSubmit={handleExtract} className="space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw email/text here, e.g.:&#10;'Hi developer, your security pass code for Azure SSO is 984021. Expires in 5 minutes.'"
            className="w-full h-24 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none font-sans"
          />

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition"
          >
            {loading ? (
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting with AI...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Extract 2FA Code</span>
              </span>
            )}
          </button>
        </form>

        {/* Result Box */}
        {result && (
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl p-3.5 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">{result.sender}</span>
              <span className="text-[10px] text-purple-400 font-medium">Extracted Result</span>
            </div>

            {result.code ? (
              <div className="bg-amber-950/80 border border-amber-800/80 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">2FA Code Found</span>
                  <div className="text-xl font-mono font-bold text-amber-300">{result.code}</div>
                </div>

                <button
                  onClick={() => onCopyCode(result.code!)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 shadow ${
                    copiedCode === result.code
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {copiedCode === result.code ? (
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
            ) : (
              <p className="text-amber-400 text-xs italic">No clear numeric code found in text.</p>
            )}

            <p className="text-[11px] text-slate-300 leading-snug">{result.summary}</p>

            <button
              onClick={handleInjectToPhone}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Push as Incoming SMS on Phone</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
