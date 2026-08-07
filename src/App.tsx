import React, { useState, useEffect } from 'react';
import { PhoneState, PhoneSettings } from './types';
import { PhoneFrame } from './components/VirtualPhone/PhoneFrame';
import { FastFillToolbar } from './components/Workspace/FastFillToolbar';
import { LoginSandbox } from './components/Workspace/LoginSandbox';
import { ApiConsole } from './components/Workspace/ApiConsole';
import { ExternalAppSimulator } from './components/Workspace/ExternalAppSimulator';
import { GmailConsole } from './components/Workspace/GmailConsole';
import { DockControls, PhoneDockPosition } from './components/Workspace/DockControls';
import { soundEngine } from './lib/sound';
import {
  ShieldCheck,
  Terminal,
  Smartphone,
  Info,
  Check,
  Copy,
  Flame,
  Sparkles,
  Globe,
  Zap,
  Mail,
} from 'lucide-react';

export default function App() {
  const [phoneState, setPhoneState] = useState<PhoneState | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Layout Controls
  const [activeTab, setActiveTab] = useState<'sandbox' | 'external' | 'gmail' | 'api'>('sandbox');
  const [dockPosition, setDockPosition] = useState<PhoneDockPosition>('dock_right');
  const [phoneScale, setPhoneScale] = useState(1);

  // Floating window position state
  const [floatingPos, setFloatingPos] = useState({ x: 40, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Fetch phone state on load
  const fetchPhoneState = async () => {
    try {
      const res = await fetch('/api/phone/state');
      if (res.ok) {
        const data: PhoneState = await res.json();
        setPhoneState(data);
      }
    } catch (err) {
      console.error('Failed to fetch phone state:', err);
    }
  };

  useEffect(() => {
    fetchPhoneState();
  }, []);

  // Copy code or link to clipboard helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setCopiedToast(`Copied ${code.length > 20 ? 'Verification Link' : code} to clipboard!`);
    soundEngine.playSuccess();
    setTimeout(() => {
      setCopiedToast(null);
    }, 3000);
  };

  // Trigger External App Verification Code or Magic Link
  const handleSendExternalCode = async (
    appName: string,
    code?: string,
    magicLink?: string,
    body?: string
  ) => {
    try {
      const res = await fetch('/api/webhook/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, code, magicLink, body }),
      });
      if (res.ok) {
        await fetchPhoneState();
        if (phoneState?.settings.soundEnabled) {
          soundEngine.playSMSNotification();
        }
      }
    } catch (err) {
      console.error('External app API error:', err);
    }
  };

  // Attach window.postMessage and global SDK helper
  useEffect(() => {
    const handleMessageEvent = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'DEVFLOW_2FA_TRIGGER' || event.data.action === 'send_2fa')) {
        const { appName, senderName, code, magicLink, body } = event.data;
        handleSendExternalCode(appName || senderName || 'External App', code, magicLink, body);
      }
    };

    window.addEventListener('message', handleMessageEvent);

    (window as any).DevFlowVirtualPhone = {
      send2FA: ({ sender, code, link, body }: { sender?: string; code?: string; link?: string; body?: string }) => {
        handleSendExternalCode(sender || 'External Service', code, link, body);
      },
      sendMagicLink: (link: string, sender?: string) => {
        handleSendExternalCode(sender || 'External Service', undefined, link);
      },
    };

    return () => {
      window.removeEventListener('message', handleMessageEvent);
    };
  }, []);

  // Trigger SMS API
  const handleSendTestSMS = async (senderName: string, body: string, code?: string) => {
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName, body, code }),
      });
      if (res.ok) {
        await fetchPhoneState();
        if (phoneState?.settings.soundEnabled) {
          soundEngine.playSMSNotification();
        }
      }
    } catch (err) {
      console.error('SMS API error:', err);
    }
  };

  // Trigger Push Approval API
  const handleSendTestPush = async (service: string, promptType: 'simple' | 'number_matching' = 'simple') => {
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, promptType }),
      });
      if (res.ok) {
        await fetchPhoneState();
        if (phoneState?.settings.soundEnabled) {
          soundEngine.playSMSNotification();
        }
      }
    } catch (err) {
      console.error('Push API error:', err);
    }
  };

  // Trigger Voice Call API
  const handleSendTestCall = async (callerName: string, code?: string) => {
    try {
      const res = await fetch('/api/voice/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callerName, code }),
      });
      if (res.ok) {
        await fetchPhoneState();
      }
    } catch (err) {
      console.error('Call API error:', err);
    }
  };

  // Respond Push
  const handleRespondPush = async (id: string, status: 'approved' | 'denied', selectedNumber?: number) => {
    try {
      const res = await fetch('/api/push/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, selectedNumber }),
      });
      if (res.ok) {
        if (status === 'approved') soundEngine.playSuccess();
        else soundEngine.playDenied();
        await fetchPhoneState();
      }
    } catch (err) {
      console.error('Push response error:', err);
    }
  };

  // Add TOTP
  const handleAddTOTP = async (issuer: string, accountName: string, secret: string) => {
    try {
      const res = await fetch('/api/totp/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuer, accountName, secret }),
      });
      if (res.ok) {
        soundEngine.playSuccess();
        await fetchPhoneState();
      }
    } catch (err) {
      console.error('TOTP add error:', err);
    }
  };

  // Delete TOTP
  const handleDeleteTOTP = async (id: string) => {
    try {
      const res = await fetch('/api/totp/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchPhoneState();
      }
    } catch (err) {
      console.error('TOTP delete error:', err);
    }
  };

  // Add Backup Note
  const handleAddNote = (title: string, service: string, codes: string[]) => {
    if (!phoneState) return;
    const newNote = {
      id: 'note_' + Date.now(),
      title,
      service,
      codes,
      createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };
    setPhoneState({
      ...phoneState,
      notes: [newNote, ...phoneState.notes],
    });
    soundEngine.playSuccess();
  };

  // Settings update
  const handleUpdateSettings = async (newSettings: Partial<PhoneSettings>) => {
    try {
      const res = await fetch('/api/phone/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        await fetchPhoneState();
      }
    } catch (err) {
      console.error('Settings update error:', err);
    }
  };

  // Clear Inbox
  const handleClearInbox = async () => {
    try {
      const res = await fetch('/api/phone/clear', { method: 'POST' });
      if (res.ok) {
        await fetchPhoneState();
      }
    } catch (err) {
      console.error('Clear inbox error:', err);
    }
  };

  // Dismiss notification banner
  const handleDismissNotification = () => {
    if (phoneState) {
      setPhoneState({
        ...phoneState,
        activeNotification: undefined,
      });
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (phoneState) {
      handleUpdateSettings({ soundEnabled: !phoneState.settings.soundEnabled });
    }
  };

  // Dragging logic for floating mode
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - floatingPos.x,
      y: e.clientY - floatingPos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setFloatingPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!phoneState) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-400 text-sm">
          <Smartphone className="w-5 h-5 animate-bounce text-blue-500" />
          <span>Booting Virtual Phone Authenticator...</span>
        </div>
      </div>
    );
  }

  // Latest active code
  const latestMsg = phoneState.messages.find((m) => m.code);
  const latestCode = latestMsg?.code || null;
  const latestSender = latestMsg?.senderName || null;

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden"
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={isDragging ? handleMouseUp : undefined}
    >
      {/* Top Fast Fill & Active OTP Bar */}
      <FastFillToolbar
        latestCode={latestCode}
        latestSender={latestSender}
        onCopyCode={handleCopyCode}
        copiedCode={copiedCode}
        phoneNumber={phoneState.settings.phoneNumber}
        isMuted={!phoneState.settings.soundEnabled}
        onToggleMute={handleToggleMute}
      />

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Left Side: Navigation Tabs & Workspace */}
        {dockPosition !== 'dock_left' && (
          <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
            {/* Workspace Sub-Header Navigation */}
            <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'sandbox'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login Sandbox</span>
                </button>

                <button
                  onClick={() => setActiveTab('external')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'external'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>External App Integrations</span>
                </button>

                <button
                  onClick={() => setActiveTab('gmail')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'gmail'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Gmail Verification Hub</span>
                </button>

                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'api'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Webhook API Console</span>
                </button>
              </div>

              <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>On-screen phone receives external app verification codes live!</span>
              </div>
            </div>

            {/* Workspace View Component */}
            <div className="flex-1 p-2 md:p-6">
              {activeTab === 'sandbox' && (
                <LoginSandbox
                  onTriggerSMS={(sender, body, code) => handleSendTestSMS(sender, body, code)}
                  onTriggerPush={(service) => handleSendTestPush(service, 'number_matching')}
                  onTriggerCall={(caller, code) => handleSendTestCall(caller, code)}
                  latestCode={latestCode}
                />
              )}

              {activeTab === 'external' && (
                <ExternalAppSimulator
                  onSendExternalCode={handleSendExternalCode}
                  onSendTestSMS={handleSendTestSMS}
                  onCopyCode={handleCopyCode}
                  copiedCode={copiedCode}
                  onAutoFillSandbox={(code) => {
                    handleCopyCode(code);
                    setActiveTab('sandbox');
                  }}
                />
              )}

              {activeTab === 'gmail' && (
                <GmailConsole
                  onSendTestSMS={handleSendTestSMS}
                  onCopyCode={handleCopyCode}
                  copiedCode={copiedCode}
                  onAutoFillSandbox={(code) => {
                    handleCopyCode(code);
                    setActiveTab('sandbox');
                  }}
                />
              )}

              {activeTab === 'api' && <ApiConsole />}
            </div>
          </div>
        )}

        {/* DOCKED PHONE PANEL (Right or Left) */}
        {(dockPosition === 'dock_right' || dockPosition === 'dock_left') && (
          <div
            className={`w-full lg:w-[420px] bg-slate-900/80 border-l border-slate-800 p-4 md:p-6 flex flex-col items-center justify-center shrink-0 ${
              dockPosition === 'dock_left' ? 'order-first border-r border-l-0' : ''
            }`}
          >
            <PhoneFrame
              phoneState={phoneState}
              onCopyCode={handleCopyCode}
              copiedCode={copiedCode}
              onSendTestSMS={handleSendTestSMS}
              onAddTOTP={handleAddTOTP}
              onDeleteTOTP={handleDeleteTOTP}
              onRespondPush={handleRespondPush}
              onAddNote={handleAddNote}
              onUpdateSettings={handleUpdateSettings}
              onClearInbox={handleClearInbox}
              onDismissNotification={handleDismissNotification}
              scale={phoneScale}
            />
          </div>
        )}

        {/* Left Side Content if Phone is Docked Left */}
        {dockPosition === 'dock_left' && (
          <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
            <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'sandbox'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login Sandbox</span>
                </button>

                <button
                  onClick={() => setActiveTab('external')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'external'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>External App Integrations</span>
                </button>

                <button
                  onClick={() => setActiveTab('gmail')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'gmail'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Gmail Verification Hub</span>
                </button>

                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeTab === 'api'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Webhook API Console</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-2 md:p-6">
              {activeTab === 'sandbox' && (
                <LoginSandbox
                  onTriggerSMS={(sender, body, code) => handleSendTestSMS(sender, body, code)}
                  onTriggerPush={(service) => handleSendTestPush(service, 'number_matching')}
                  onTriggerCall={(caller, code) => handleSendTestCall(caller, code)}
                  latestCode={latestCode}
                />
              )}

              {activeTab === 'external' && (
                <ExternalAppSimulator
                  onSendExternalCode={handleSendExternalCode}
                  onSendTestSMS={handleSendTestSMS}
                  onCopyCode={handleCopyCode}
                  copiedCode={copiedCode}
                  onAutoFillSandbox={(code) => {
                    handleCopyCode(code);
                    setActiveTab('sandbox');
                  }}
                />
              )}

              {activeTab === 'gmail' && (
                <GmailConsole
                  onSendTestSMS={handleSendTestSMS}
                  onCopyCode={handleCopyCode}
                  copiedCode={copiedCode}
                  onAutoFillSandbox={(code) => {
                    handleCopyCode(code);
                    setActiveTab('sandbox');
                  }}
                />
              )}

              {activeTab === 'api' && <ApiConsole />}
            </div>
          </div>
        )}

        {/* FLOATING OVERLAY PHONE MODE */}
        {(dockPosition === 'floating' || dockPosition === 'mini') && (
          <div
            style={{
              position: 'fixed',
              left: `${floatingPos.x}px`,
              top: `${floatingPos.y}px`,
              zIndex: 50,
            }}
            className="shadow-2xl rounded-3xl overflow-hidden bg-slate-900/95 border border-slate-700"
          >
            {/* Draggable Header */}
            <div
              onMouseDown={handleMouseDown}
              className="bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-300 flex items-center justify-between cursor-move select-none border-b border-slate-700"
            >
              <div className="flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>On-Screen Virtual Cell Phone</span>
              </div>
              <span className="text-[10px] text-slate-500">Hold & Drag</span>
            </div>

            <div className="p-3">
              <PhoneFrame
                phoneState={phoneState}
                onCopyCode={handleCopyCode}
                copiedCode={copiedCode}
                onSendTestSMS={handleSendTestSMS}
                onAddTOTP={handleAddTOTP}
                onDeleteTOTP={handleDeleteTOTP}
                onRespondPush={handleRespondPush}
                onAddNote={handleAddNote}
                onUpdateSettings={handleUpdateSettings}
                onClearInbox={handleClearInbox}
                onDismissNotification={handleDismissNotification}
                scale={dockPosition === 'mini' ? 0.75 : phoneScale}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dock & Layout Controls Bottom Bar */}
      <DockControls
        dockPosition={dockPosition}
        onChangePosition={(pos) => setDockPosition(pos)}
        scale={phoneScale}
        onChangeScale={(s) => setPhoneScale(s)}
        isMuted={!phoneState.settings.soundEnabled}
        onToggleMute={handleToggleMute}
        onQuickSMS={() => handleSendTestSMS('Google Auth', 'G-849201 is your Google security code.', '849201')}
        onQuickPush={() => handleSendTestPush('Okta SSO', 'number_matching')}
        onQuickCall={() => handleSendTestCall('Automated Auth', '391028')}
      />

      {/* Floating Toast Notification on Code Copy */}
      {copiedToast && (
        <div className="fixed bottom-14 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4" />
          <span>{copiedToast}</span>
        </div>
      )}
    </div>
  );
}
