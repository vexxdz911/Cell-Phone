import React from 'react';
import { ChevronLeft, ShieldCheck, CheckCircle2, XCircle, MapPin, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PushRequest } from '../../types';

interface PushVerifyAppProps {
  pushRequests: PushRequest[];
  onBack: () => void;
  onRespondPush: (id: string, status: 'approved' | 'denied', selectedNumber?: number) => void;
}

export const PushVerifyApp: React.FC<PushVerifyAppProps> = ({
  pushRequests,
  onBack,
  onRespondPush,
}) => {
  const pendingRequests = pushRequests.filter((p) => p.status === 'pending');
  const pastRequests = pushRequests.filter((p) => p.status !== 'pending');

  const handleAction = (id: string, status: 'approved' | 'denied', selectedNumber?: number) => {
    if (status === 'approved') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
    onRespondPush(id, status, selectedNumber);
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
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <h2 className="text-xs font-semibold text-slate-100">Push Verify</h2>
        </div>

        <div className="w-6"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-600/50" />
            <p className="text-xs font-medium text-slate-400">No Pending Sign-in Approvals</p>
            <p className="text-[10px] text-slate-500">
              When a service sends a push prompt (Okta, Google, Duo), it will appear here instantly.
            </p>
          </div>
        ) : (
          pendingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-xl space-y-3 animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">{req.service}</h3>
                  <p className="text-[10px] text-slate-400">{req.timestamp}</p>
                </div>
              </div>

              {/* Login Attempt Details */}
              <div className="bg-slate-950 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-slate-800">
                <div className="flex items-center text-slate-300 space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Location: <strong className="text-white">{req.location}</strong></span>
                </div>
                <div className="flex items-center text-slate-300 space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>IP Address: <strong className="text-white font-mono">{req.ipAddress}</strong></span>
                </div>
              </div>

              {/* Prompt Type: Number Matching or Simple Approve/Deny */}
              {req.promptType === 'number_matching' && req.numberOptions ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-center text-amber-300 font-semibold">
                    Tap the number shown on your computer screen to verify:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {req.numberOptions.map((num) => (
                      <button
                        key={num}
                        onClick={() => handleAction(req.id, 'approved', num)}
                        className="py-2.5 bg-slate-800 hover:bg-emerald-600 text-white font-mono font-bold text-base rounded-xl border border-slate-700 hover:border-emerald-400 transition"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAction(req.id, 'denied')}
                    className="w-full py-2 text-xs text-red-400 hover:text-red-300 mt-1 font-medium"
                  >
                    It wasn't me (Deny)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleAction(req.id, 'denied')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-red-900/60 border border-slate-700 text-red-400 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Deny</span>
                  </button>

                  <button
                    onClick={() => handleAction(req.id, 'approved')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* History of Past Requests */}
        {pastRequests.length > 0 && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Recent Activity
            </h4>
            {pastRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">{req.service}</span>
                  <div className="text-[10px] text-slate-500">{req.location}</div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    req.status === 'approved'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {req.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
