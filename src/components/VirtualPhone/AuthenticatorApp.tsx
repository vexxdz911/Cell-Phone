import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Copy, Check, Trash2, Key, Shield } from 'lucide-react';
import { TOTPAccount } from '../../types';
import { generateTOTP } from '../../lib/totp';

interface AuthenticatorAppProps {
  accounts: TOTPAccount[];
  onBack: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onAddAccount: (issuer: string, accountName: string, secret: string) => void;
  onDeleteAccount: (id: string) => void;
}

export const AuthenticatorApp: React.FC<AuthenticatorAppProps> = ({
  accounts,
  onBack,
  onCopyCode,
  copiedCode,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [showAddModal, setShowAddModal] = useState(false);
  const [issuer, setIssuer] = useState('');
  const [accountName, setAccountName] = useState('');
  const [secret, setSecret] = useState('');

  // Refresh codes every second and update progress ring
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const rem = 30 - (now % 30);
      setSecondsRemaining(rem);
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuer || !secret) return;
    onAddAccount(issuer, accountName || 'user@work.com', secret);
    setIssuer('');
    setAccountName('');
    setSecret('');
    setShowAddModal(false);
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
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <h2 className="text-xs font-semibold text-slate-100">Authenticator</h2>
        </div>

        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="p-1 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-slate-800"
          title="Add TOTP Key"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <form onSubmit={handleAddSubmit} className="p-3 bg-slate-900 border-b border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-300 flex justify-between items-center">
            <span>Add 2FA Secret Key</span>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">Cancel</button>
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Issuer / App Name</label>
            <input
              type="text"
              required
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Stripe, AWS, Slack"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Account Username / Email</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Base32 Secret Key</label>
            <input
              type="text"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
              placeholder="JBSWY3DPEHPK3PXP"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium mt-1"
          >
            Save TOTP Account
          </button>
        </form>
      )}

      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Key className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No 2FA Authenticator accounts added.</p>
            <p className="text-[10px]">Click "+" above to add a secret key.</p>
          </div>
        ) : (
          accounts.map((acc) => {
            const totp = generateTOTP(acc.secret);
            const formattedCode = `${totp.code.slice(0, 3)} ${totp.code.slice(3)}`;
            const isCopied = copiedCode === totp.code;

            return (
              <div
                key={acc.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 space-y-2 transition shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-white uppercase tracking-wider">{acc.issuer}</span>
                    <div className="text-[10px] text-slate-400">{acc.accountName}</div>
                  </div>

                  {/* Circular Timer Ring */}
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <svg className="w-7 h-7 transform -rotate-90">
                      <circle
                        cx="14"
                        cy="14"
                        r="11"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="14"
                        cy="14"
                        r="11"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={secondsRemaining < 5 ? 'text-red-500' : 'text-indigo-400'}
                        fill="transparent"
                        strokeDasharray={69}
                        strokeDashoffset={69 - (69 * secondsRemaining) / 30}
                      />
                    </svg>
                    <span className="absolute text-[9px] font-mono font-bold text-slate-300">
                      {secondsRemaining}
                    </span>
                  </div>
                </div>

                {/* TOTP 6-digit code display */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-2xl font-mono font-bold text-indigo-300 tracking-widest">
                    {formattedCode}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onCopyCode(totp.code)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center space-x-1 shadow transition ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isCopied ? (
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

                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
