import React, { useState } from 'react';
import { ChevronLeft, PhoneCall, PhoneOff, Volume2, Copy, Check, VolumeX } from 'lucide-react';
import { VoiceCall } from '../../types';
import { soundEngine } from '../../lib/sound';

interface PhoneCallAppProps {
  calls: VoiceCall[];
  onBack: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}

export const PhoneCallApp: React.FC<PhoneCallAppProps> = ({
  calls,
  onBack,
  onCopyCode,
  copiedCode,
}) => {
  const [activeCallId, setActiveCallId] = useState<string | null>(
    calls.length > 0 ? calls[0].id : null
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  const activeCall = calls.find((c) => c.id === activeCallId) || calls[0];

  const handleAnswer = (call: VoiceCall) => {
    call.status = 'answered';
    setIsSpeaking(true);
    soundEngine.speakVerificationCode(call.spokenMessage);
  };

  const handleHangup = () => {
    soundEngine.stopSpeech();
    setIsSpeaking(false);
    if (activeCall) {
      activeCall.status = 'ended';
    }
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
          <PhoneCall className="w-3.5 h-3.5 text-green-400" />
          <h2 className="text-xs font-semibold text-slate-100">Phone Verification Call</h2>
        </div>

        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-between">
        {!activeCall ? (
          <div className="text-center py-16 text-slate-500 space-y-2 my-auto">
            <PhoneCall className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">No active or recent phone calls.</p>
            <p className="text-[10px]">Use the Sandbox or API Console to trigger a voice verification call!</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-4 shadow-2xl my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <PhoneCall className={`w-8 h-8 ${activeCall.status === 'incoming' ? 'animate-bounce' : ''}`} />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{activeCall.callerName}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{activeCall.caller}</p>
              <span
                className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  activeCall.status === 'incoming'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    : activeCall.status === 'answered'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {activeCall.status === 'incoming'
                  ? 'INCOMING CALL...'
                  : activeCall.status === 'answered'
                  ? 'CALL IN PROGRESS'
                  : 'CALL ENDED'}
              </span>
            </div>

            {/* Answer / Hangup Actions */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {activeCall.status === 'incoming' && (
                <button
                  onClick={() => handleAnswer(activeCall)}
                  className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition transform hover:scale-110 active:scale-95"
                  title="Answer Call"
                >
                  <PhoneCall className="w-6 h-6" />
                </button>
              )}

              {activeCall.status === 'answered' && (
                <button
                  onClick={handleHangup}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition transform hover:scale-110 active:scale-95"
                  title="Hang Up"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Live Transcript & Spoken Message */}
            {activeCall.status === 'answered' && (
              <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-left space-y-2 mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Live Audio Transcript</span>
                  </span>
                  <button
                    onClick={() => soundEngine.speakVerificationCode(activeCall.spokenMessage)}
                    className="text-blue-400 hover:text-blue-300 text-[10px]"
                  >
                    Replay Audio
                  </button>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                  "{activeCall.spokenMessage}"
                </p>

                {/* Detected Spoken Code */}
                <div className="bg-amber-950/80 border border-amber-800/80 rounded-xl p-2.5 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Spoken Code</span>
                    <div className="text-xl font-mono font-bold text-amber-300">{activeCall.code}</div>
                  </div>
                  <button
                    onClick={() => onCopyCode(activeCall.code)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 shadow ${
                      copiedCode === activeCall.code
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {copiedCode === activeCall.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
