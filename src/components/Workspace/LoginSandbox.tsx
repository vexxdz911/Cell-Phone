import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginSandboxProps {
  onTriggerSMS: (senderName: string, body: string, code?: string) => void;
  onTriggerPush: (service: string, promptType?: 'simple' | 'number_matching') => void;
  onTriggerCall: (callerName: string, code?: string) => void;
  latestCode: string | null;
}

export const LoginSandbox: React.FC<LoginSandboxProps> = ({
  onTriggerSMS,
  onTriggerPush,
  onTriggerCall,
  latestCode,
}) => {
  const [activePortal, setActivePortal] = useState<string>('google');
  const [username, setUsername] = useState('user@company.com');
  const [password, setPassword] = useState('••••••••••••');
  const [mfaMethod, setMfaMethod] = useState<'sms' | 'totp' | 'push' | 'call'>('sms');
  const [mfaStepActive, setMfaStepActive] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const portals = [
    {
      id: 'google',
      name: 'Google Workspace',
      category: 'Single Sign-On',
      bg: 'from-blue-600 to-indigo-700',
      icon: 'G',
      methods: ['sms', 'push', 'totp', 'call'] as const,
    },
    {
      id: 'github',
      name: 'GitHub Enterprise',
      category: 'Developer Platform',
      bg: 'from-gray-800 to-slate-900',
      icon: 'GH',
      methods: ['totp', 'sms', 'push'] as const,
    },
    {
      id: 'okta',
      name: 'Okta SSO Portal',
      category: 'Corporate Auth',
      bg: 'from-indigo-700 to-blue-900',
      icon: 'O',
      methods: ['push', 'sms', 'totp'] as const,
    },
    {
      id: 'chase',
      name: 'Chase Online Bank',
      category: 'Financial Services',
      bg: 'from-blue-800 to-cyan-900',
      icon: 'C',
      methods: ['sms', 'call'] as const,
    },
    {
      id: 'aws',
      name: 'AWS Cloud Console',
      category: 'Cloud Infrastructure',
      bg: 'from-amber-600 to-orange-800',
      icon: 'AWS',
      methods: ['totp', 'sms'] as const,
    },
  ];

  const currentPortal = portals.find((p) => p.id === activePortal) || portals[0];

  const handleStartSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(false);

    // Generate random 6 digit code for SMS/Call verification
    const randomCode = String(Math.floor(100000 + Math.random() * 900000));
    setExpectedCode(randomCode);
    setMfaStepActive(true);

    if (mfaMethod === 'sms') {
      onTriggerSMS(
        currentPortal.name,
        `${currentPortal.name}: Your security verification code is ${randomCode}. Expires in 10 minutes.`,
        randomCode
      );
    } else if (mfaMethod === 'push') {
      onTriggerPush(currentPortal.name, 'number_matching');
    } else if (mfaMethod === 'call') {
      onTriggerCall(currentPortal.name, randomCode);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEntered = enteredCode.trim().replace(/\s+/g, '');

    if (cleanEntered === expectedCode || (latestCode && cleanEntered === latestCode)) {
      setLoginSuccess(true);
      setLoginError(null);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      setLoginError('Incorrect 2FA code. Check your virtual phone screen and try again.');
    }
  };

  const handleAutoFillFromPhone = () => {
    if (latestCode) {
      setEnteredCode(latestCode);
    }
  };

  return (
    <div className="p-6 space-y-6 text-white max-w-4xl mx-auto relative">
      {/* Background Radial Decoration */}
      <div className="absolute top-10 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="border-b border-slate-800 pb-4 relative z-10">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <span>Security & Verification Sandbox</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select an enterprise authentication workspace, trigger 2FA, and verify identity using your Virtual Device.
        </p>
      </div>

      {/* Service Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
        {portals.map((portal) => (
          <button
            key={portal.id}
            onClick={() => {
              setActivePortal(portal.id);
              setMfaStepActive(false);
              setLoginSuccess(false);
              setLoginError(null);
            }}
            className={`p-3 rounded-xl border text-left transition duration-200 flex flex-col justify-between ${
              activePortal === portal.id
                ? 'bg-slate-800 border-indigo-500 shadow-lg ring-1 ring-indigo-500/50'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${portal.bg} flex items-center justify-center font-bold text-xs text-white shadow`}
              >
                {portal.icon}
              </div>
              {activePortal === portal.id && (
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              )}
            </div>
            <div>
              <div className="font-bold text-xs text-white">{portal.name}</div>
              <div className="text-[10px] text-slate-400">{portal.category}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Interactive Login Card Simulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6 relative z-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentPortal.bg} flex items-center justify-center font-bold text-sm text-white shadow-lg`}
            >
              {currentPortal.icon}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{currentPortal.name} Security Portal</h3>
              <p className="text-xs text-slate-400">Enter your credentials to access the environment</p>
            </div>
          </div>

          <button
            onClick={() => {
              setMfaStepActive(false);
              setLoginSuccess(false);
              setLoginError(null);
            }}
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Flow</span>
          </button>
        </div>

        {/* Step 1: Username & MFA Method Selection */}
        {!mfaStepActive && !loginSuccess && (
          <form onSubmit={handleStartSignIn} className="space-y-5 max-w-md mx-auto">
            <div>
              <label className="text-xs text-slate-300 font-medium">Work Email / User Identity</label>
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mt-1.5 transition"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mt-1.5 transition"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium">Verification Method</label>
              <div className="grid grid-cols-2 gap-2.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setMfaMethod('sms')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition ${
                    mfaMethod === 'sms'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-indigo-300" />
                  <span>SMS Security Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMfaMethod('push')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition ${
                    mfaMethod === 'push'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-300" />
                  <span>Push Approval</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMfaMethod('totp')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition ${
                    mfaMethod === 'totp'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Key className="w-4 h-4 text-indigo-300" />
                  <span>Authenticator TOTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMfaMethod('call')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition ${
                    mfaMethod === 'call'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <PhoneCall className="w-4 h-4 text-indigo-300" />
                  <span>Voice Call</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              <span>Trigger Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: 2FA Verification Entry */}
        {mfaStepActive && !loginSuccess && (
          <form onSubmit={handleVerifyCode} className="space-y-6 max-w-md mx-auto text-center">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Security Verification</h2>
              <p className="text-slate-400 text-xs">
                Enter the 6-digit code sent to your registered device to access the Environment.
              </p>
            </div>

            {/* Digit Visual Boxes Preview */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const char = enteredCode[idx] || '';
                const isCurrent = enteredCode.length === idx;
                return (
                  <div
                    key={idx}
                    className={`w-11 h-13 sm:w-12 sm:h-14 bg-slate-800 rounded-lg border flex items-center justify-center text-xl font-bold text-white transition-all ${
                      isCurrent
                        ? 'border-indigo-500 ring-1 ring-indigo-500 animate-pulse text-indigo-400'
                        : char
                        ? 'border-indigo-500/50 text-indigo-300 bg-slate-800/90'
                        : 'border-slate-700 text-slate-500'
                    }`}
                  >
                    {char || (isCurrent ? '|' : '')}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="Enter 6 digits"
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-center text-indigo-300 tracking-widest focus:outline-none transition"
                />

                {latestCode && (
                  <button
                    type="button"
                    onClick={handleAutoFillFromPhone}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shrink-0 shadow-lg shadow-indigo-500/20 transition"
                  >
                    Paste Latest
                  </button>
                )}
              </div>

              {loginError && (
                <div className="p-2.5 bg-red-950/80 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center justify-center space-x-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMfaStepActive(false)}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Back
              </button>

              <button
                type="submit"
                className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all"
              >
                Verify Identity
              </button>
            </div>
          </form>
        )}

        {/* Success State */}
        {loginSuccess && (
          <div className="text-center py-8 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-white">Identity Verified Successfully</h3>
            <p className="text-xs text-slate-400">
              Authenticated into <strong className="text-white">{currentPortal.name}</strong> as{' '}
              <span className="font-mono text-indigo-300">{username}</span>.
            </p>

            <button
              onClick={() => {
                setLoginSuccess(false);
                setMfaStepActive(false);
                setEnteredCode('');
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition"
            >
              Test Another Login Flow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
