import React, { useState, useEffect } from 'react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../../lib/firebase';
import {
  fetchGmailMessages,
  ParsedGmailMessage,
  sendGmailEmail,
  trashGmailMessage,
} from '../../lib/gmail';
import {
  Mail,
  Search,
  RefreshCw,
  LogOut,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Send,
  ShieldCheck,
  Flame,
  KeyRound,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GmailConsoleProps {
  onSendTestSMS: (senderName: string, body: string, code?: string) => Promise<void>;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onAutoFillSandbox?: (code: string) => void;
}

export const GmailConsole: React.FC<GmailConsoleProps> = ({
  onSendTestSMS,
  onCopyCode,
  copiedCode,
  onAutoFillSandbox,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Email state
  const [messages, setMessages] = useState<ParsedGmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ParsedGmailMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('verification OR code OR OTP OR login OR 2FA');
  const [activeFilter, setActiveFilter] = useState<'verification' | 'unread' | 'primary' | 'all'>('verification');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Send Email Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('Your 2FA Verification Code: 849201');
  const [sendBody, setSendBody] = useState(
    'Hello,\n\nYour one-time security verification code for DevFlow Authenticator is 849201.\n\nIf you did not request this code, please ignore this email.'
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  // Confirmation Modals State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [pushedToPhoneToast, setPushedToPhoneToast] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, tok) => {
        setUser(u);
        setToken(tok);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch messages whenever authenticated or filter changes
  const loadMessages = async (queryToUse?: string) => {
    const activeTok = token || getAccessToken();
    if (!activeTok) {
      setNeedsAuth(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const q = queryToUse !== undefined ? queryToUse : searchQuery;
      const fetched = await fetchGmailMessages(activeTok, q, 20);
      setMessages(fetched);
      if (fetched.length > 0 && !selectedMessage) {
        setSelectedMessage(fetched[0]);
      }
    } catch (err: any) {
      console.error('Error fetching Gmail messages:', err);
      setErrorMsg(err.message || 'Failed to fetch emails from Gmail API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadMessages();
    }
  }, [token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Sign in failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setMessages([]);
    setSelectedMessage(null);
    setNeedsAuth(true);
  };

  const handleFilterClick = (filter: 'verification' | 'unread' | 'primary' | 'all') => {
    setActiveFilter(filter);
    let q = '';
    if (filter === 'verification') {
      q = 'verification OR code OR OTP OR login OR 2FA';
    } else if (filter === 'unread') {
      q = 'is:unread';
    } else if (filter === 'primary') {
      q = 'category:primary';
    }
    setSearchQuery(q);
    loadMessages(q);
  };

  const handlePushToPhone = async (msg: ParsedGmailMessage) => {
    const sender = msg.from.split('<')[0].replace(/"/g, '').trim() || 'Gmail Code';
    const bodyText = msg.body.slice(0, 160);
    await onSendTestSMS(sender, bodyText, msg.code);
    setPushedToPhoneToast(`Pushed code ${msg.code} to Virtual Cell Phone!`);
    setTimeout(() => setPushedToPhoneToast(null), 3000);
  };

  const handleConfirmSend = async () => {
    setShowSendConfirm(false);
    const activeTok = token || getAccessToken();
    if (!activeTok) return;

    setIsSending(true);
    setErrorMsg(null);
    try {
      await sendGmailEmail(activeTok, sendTo, sendSubject, sendBody);
      setSendSuccessMsg(`Verification email successfully sent to ${sendTo}!`);
      setShowSendModal(false);
      setTimeout(() => setSendSuccessMsg(null), 4000);
      // Reload inbox
      loadMessages();
    } catch (err: any) {
      console.error('Send error:', err);
      setErrorMsg(err.message || 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMessage) return;
    setShowDeleteConfirm(false);
    const activeTok = token || getAccessToken();
    if (!activeTok) return;

    try {
      await trashGmailMessage(activeTok, selectedMessage.id);
      setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
      setSelectedMessage(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMsg(err.message || 'Failed to trash email.');
    }
  };

  if (needsAuth) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 text-slate-100 space-y-6 shadow-2xl max-w-2xl mx-auto my-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Connect Your Gmail Account</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Integrate your real Gmail inbox to inspect live 2FA verification codes, magic login links, and automated security emails directly in your virtual phone sandbox.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left space-y-3 text-xs text-slate-300">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Info className="w-4 h-4 text-red-400" />
            <span>What Gmail permissions allow:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Search and read your Gmail inbox for 2FA security verification emails</li>
            <li>Automatically extract 6-digit codes & magic verification URLs</li>
            <li>Optionally send test 2FA verification emails to test login workflows</li>
          </ul>
        </div>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-500/40 p-3 rounded-xl text-red-200 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button focus:outline-none focus:ring-2 focus:ring-red-500/50"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #747775',
              padding: '10px 16px',
              cursor: isLoggingIn ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper flex items-center space-x-3">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block', width: '20px', height: '20px' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                </svg>
              </div>
              <span className="text-slate-900 font-semibold text-sm">
                {isLoggingIn ? 'Connecting to Gmail...' : 'Sign in with Google'}
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 text-slate-100 space-y-5 shadow-2xl">
      {/* Toast notifications */}
      {pushedToPhoneToast && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{pushedToPhoneToast}</span>
        </div>
      )}

      {sendSuccessMsg && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold z-50">
          <CheckCircle2 className="w-4 h-4" />
          <span>{sendSuccessMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Google Avatar"
                className="w-10 h-10 rounded-full border-2 border-red-500/50"
              />
            ) : (
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold text-white">
                {user?.email?.[0].toUpperCase() || 'G'}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-100">
                {user?.displayName || 'Connected Account'}
              </span>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-500/30">
                Gmail API Active
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono truncate max-w-xs">{user?.email}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setSendTo(user?.email || '');
              setShowSendModal(true);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Email</span>
          </button>

          <button
            onClick={() => loadMessages()}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
            <span>Sync Inbox</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700/60 transition"
            title="Disconnect Gmail Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => handleFilterClick('verification')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeFilter === 'verification'
                  ? 'bg-red-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Verification Emails</span>
            </button>

            <button
              onClick={() => handleFilterClick('unread')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeFilter === 'unread'
                  ? 'bg-red-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Unread</span>
            </button>

            <button
              onClick={() => handleFilterClick('primary')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeFilter === 'primary'
                  ? 'bg-red-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Primary</span>
            </button>
          </div>

          {/* Search form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadMessages(searchQuery);
            }}
            className="flex-1 max-w-md flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Gmail (e.g. code, verification, OTP)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500/60"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-500/40 p-3 rounded-xl text-red-200 text-xs font-medium flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Mail Inspector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[480px]">
        {/* Email List Column */}
        <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Gmail Messages ({messages.length})</span>
            {isLoading && <span className="text-red-400 animate-pulse">Scanning...</span>}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {messages.length === 0 && !isLoading ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Mail className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No matching emails found.</p>
                <button
                  onClick={() => handleFilterClick('verification')}
                  className="text-xs text-red-400 hover:underline font-semibold"
                >
                  Clear search & fetch 2FA emails
                </button>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full p-3 text-left transition flex flex-col space-y-1.5 focus:outline-none ${
                      isSelected
                        ? 'bg-red-950/40 border-l-4 border-red-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                        {msg.from.replace(/<.*>/, '').trim()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-300 truncate">
                      {msg.subject}
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {msg.snippet}
                    </div>

                    {/* Detected Code Badge */}
                    {msg.code && (
                      <div className="flex items-center space-x-1.5 pt-1">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono font-bold text-[11px] border border-amber-500/30 flex items-center space-x-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Code: {msg.code}</span>
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Email Details Column */}
        <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message Header */}
              <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/40">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100 leading-snug">
                    {selectedMessage.subject}
                  </h3>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                    title="Trash message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500 font-medium">From: </span>
                    <span className="text-slate-200 font-medium">{selectedMessage.from}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{selectedMessage.date}</span>
                </div>

                {/* Prominent Verification Code Box */}
                {selectedMessage.code && (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                          Detected 2FA Verification Code
                        </div>
                        <div className="text-xl font-mono font-bold text-amber-200">
                          {selectedMessage.code}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onCopyCode(selectedMessage.code!)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition ${
                          copiedCode === selectedMessage.code
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        {copiedCode === selectedMessage.code ? (
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

                      <button
                        onClick={() => handlePushToPhone(selectedMessage)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Push to Virtual Phone</span>
                      </button>

                      {onAutoFillSandbox && (
                        <button
                          onClick={() => onAutoFillSandbox(selectedMessage.code!)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Fill to Sandbox</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Magic Link Box */}
                {selectedMessage.magicLink && (
                  <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-3 space-y-2">
                    <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                      Magic Login / Verification URL
                    </div>
                    <div className="text-xs font-mono text-purple-200 truncate bg-slate-950 p-2 rounded border border-purple-500/20">
                      {selectedMessage.magicLink}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onCopyCode(selectedMessage.magicLink!)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </button>
                      <a
                        href={selectedMessage.magicLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Link</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Body Content */}
              <div className="flex-1 p-4 overflow-y-auto text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap bg-slate-950/60">
                {selectedMessage.body || selectedMessage.snippet}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2 p-8">
              <Mail className="w-10 h-10 text-slate-700" />
              <p className="text-xs font-medium">Select an email to view full content and extract 2FA codes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal (Required by Workspace Integration Skill) */}
      {showDeleteConfirm && selectedMessage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Trash Gmail Message?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to move <strong>"{selectedMessage.subject}"</strong> to Gmail trash?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
              >
                Trash Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Form Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-red-400">
                <Send className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-100">Send Test Verification Email</h3>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">To Email Address</label>
                <input
                  type="email"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Subject Line</label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Content Body</label>
                <textarea
                  rows={4}
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500/60 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSendConfirm(true)}
                disabled={!sendTo.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Email...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal (Required by Workspace Integration Skill) */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Confirm Sending Email?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to send this email to <strong>{sendTo}</strong> from your connected Gmail account?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSendConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={isSending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
              >
                {isSending ? 'Sending via Gmail...' : 'Confirm & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
