import React, { useState } from 'react';
import {
  Globe,
  Send,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Sparkles,
  ShieldAlert,
  Terminal,
  Zap,
  ArrowRight,
  Layers,
  Link2,
} from 'lucide-react';

interface ExternalAppSimulatorProps {
  onSendExternalCode: (appName: string, code?: string, magicLink?: string, body?: string) => void;
  onSendTestSMS: (senderName: string, body: string, code?: string) => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onAutoFillSandbox?: (code: string) => void;
}

const PRESET_EXTERNAL_APPS = [
  {
    id: 'acme_saas',
    name: 'Acme Cloud Portal',
    logo: '⚡',
    bgColor: 'from-amber-600 to-orange-600',
    type: 'code',
    defaultCode: '829401',
    body: 'Acme Security: Your login verification code is 829401.',
  },
  {
    id: 'stripe_pay',
    name: 'Stripe Checkout',
    logo: '💳',
    bgColor: 'from-indigo-600 to-purple-600',
    type: 'code',
    defaultCode: '391024',
    body: 'Stripe Verification: Enter 391024 to authorize purchase of $149.00.',
  },
  {
    id: 'slack_magic',
    name: 'Slack Workspaces',
    logo: '💬',
    bgColor: 'from-emerald-600 to-teal-600',
    type: 'magic_link',
    magicLink: 'https://slack.com/magic-login?token=xoxp-982104-a1b2c3',
    body: 'Click your Slack magic login link: https://slack.com/magic-login?token=xoxp-982104-a1b2c3',
  },
  {
    id: 'github_cli',
    name: 'GitHub CLI Auth',
    logo: '🐙',
    bgColor: 'from-slate-700 to-slate-900',
    type: 'code',
    defaultCode: '482019',
    body: '[GitHub] Device verification code: 482019. Valid for 10 minutes.',
  },
  {
    id: 'shopify_store',
    name: 'Shopify Admin',
    logo: '🛍️',
    bgColor: 'from-green-600 to-emerald-700',
    type: 'magic_link',
    magicLink: 'https://admin.shopify.com/verify?code=772810',
    body: 'Verify Shopify Admin login: https://admin.shopify.com/verify?code=772810',
  },
];

export const ExternalAppSimulator: React.FC<ExternalAppSimulatorProps> = ({
  onSendExternalCode,
  onCopyCode,
  copiedCode,
  onAutoFillSandbox,
}) => {
  const [activeTab, setActiveTab] = useState<'sim' | 'sdk' | 'postmessage'>('sim');
  
  // Form state
  const [appName, setAppName] = useState('External SaaS Portal');
  const [customCode, setCustomCode] = useState('948201');
  const [customLink, setCustomLink] = useState('https://app.example.com/magic-verify?token=8831');
  const [customBody, setCustomBody] = useState('Verification request triggered from External Application.');
  const [triggerType, setTriggerType] = useState<'code' | 'magic_link'>('code');

  const [copiedSdk, setCopiedSdk] = useState(false);
  const [logResponse, setLogResponse] = useState<string | null>(null);

  const handleTriggerPreset = (preset: typeof PRESET_EXTERNAL_APPS[0]) => {
    if (preset.type === 'magic_link') {
      onSendExternalCode(preset.name, undefined, preset.magicLink, preset.body);
    } else {
      onSendExternalCode(preset.name, preset.defaultCode, undefined, preset.body);
    }
    setLogResponse(`[PRESET TRIGGERED] Sent ${preset.name} verification payload to virtual phone.`);
  };

  const handleCustomTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogResponse('Triggering external verification endpoint...');

    try {
      const payload = {
        appName,
        code: triggerType === 'code' ? customCode : undefined,
        magicLink: triggerType === 'magic_link' ? customLink : undefined,
        body: customBody,
      };

      const res = await fetch('/api/webhook/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLogResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setLogResponse(`Error: ${err.message}`);
    }
  };

  const handleTriggerPostMessage = () => {
    const msgPayload = {
      type: 'DEVFLOW_2FA_TRIGGER',
      appName: 'Browser Extension / Embedded App',
      code: customCode || '552109',
      magicLink: customLink,
      body: 'Triggered via window.postMessage cross-frame event!',
    };

    window.postMessage(msgPayload, '*');
    setLogResponse(`[POSTMESSAGE DISPATCHED] Sent message to window listeners: ${JSON.stringify(msgPayload)}`);
  };

  const getSdkSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    if (activeTab === 'sdk') {
      return `// 1. Send 2FA Verification Code via Webhook HTTP POST
fetch('${origin}/api/webhook/2fa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appName: '${appName}',
    code: '${customCode}',
    body: 'Your verification code is ${customCode}.'
  })
});`;
    } else if (activeTab === 'postmessage') {
      return `// 2. Trigger via Client-side window.postMessage (No Backend required!)
window.postMessage({
  type: 'DEVFLOW_2FA_TRIGGER',
  appName: '${appName}',
  code: '${customCode}',
  magicLink: '${customLink}',
  body: 'External verification code triggered from client app.'
}, '*');`;
    } else {
      return `// 3. Using JavaScript Helper SDK
window.DevFlowVirtualPhone?.send2FA({
  sender: '${appName}',
  code: '${customCode}',
  link: '${customLink}'
});`;
    }
  };

  const handleCopySdk = () => {
    navigator.clipboard.writeText(getSdkSnippet());
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 text-white max-w-4xl mx-auto relative">
      {/* Glow background decoration */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Globe className="w-6 h-6 text-purple-400" />
            <span>External Application Integration Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seamlessly trigger 2FA codes, magic links, or OAuth verification from external web apps, cURL, or postMessage.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-purple-600/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold rounded-lg flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Webhook Ready</span>
          </span>
        </div>
      </div>

      {/* Quick App Presets Grid */}
      <div className="space-y-3 relative z-10">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Preset External Application Triggers</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_EXTERNAL_APPS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleTriggerPreset(preset)}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 p-3 rounded-xl transition text-left flex flex-col justify-between space-y-3 shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{preset.logo}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-purple-300 transition">
                  {preset.type === 'magic_link' ? 'Magic Link' : '2FA Code'}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                  {preset.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                  {preset.type === 'magic_link' ? 'URL Link Auth' : `Code: ${preset.defaultCode}`}
                </div>
              </div>
              <div className="w-full py-1.5 bg-purple-600/20 group-hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1 transition">
                <Send className="w-3 h-3" />
                <span>Trigger to Phone</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Custom Integration Form & Webhook Tester */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Custom Webhook Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Custom External App Trigger</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">POST /api/webhook/2fa</span>
          </div>

          <form onSubmit={handleCustomTrigger} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">External App Name</label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Stripe, Acme, GitHub"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Verification Payload Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTriggerType('code')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    triggerType === 'code'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>2FA Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerType('magic_link')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    triggerType === 'magic_link'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Magic Link</span>
                </button>
              </div>
            </div>

            {triggerType === 'code' ? (
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">2FA Verification Code</label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="e.g. 948201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Magic Verification Link URL</label>
                <input
                  type="url"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  placeholder="https://app.example.com/magic-verify?token=..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Message Body Payload</label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 transition"
              >
                <Send className="w-4 h-4" />
                <span>Send via Webhook API</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerPostMessage}
                title="Trigger in-browser postMessage event"
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition border border-purple-500/30"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>postMessage</span>
              </button>
            </div>
          </form>
        </div>

        {/* Integration Code Snippet & Live Response Log */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex space-x-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('sdk')}
                  className={`pb-1 border-b-2 transition ${
                    activeTab === 'sdk'
                      ? 'border-purple-500 text-purple-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Fetch API
                </button>
                <button
                  onClick={() => setActiveTab('postmessage')}
                  className={`pb-1 border-b-2 transition ${
                    activeTab === 'postmessage'
                      ? 'border-purple-500 text-purple-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  postMessage
                </button>
                <button
                  onClick={() => setActiveTab('sim')}
                  className={`pb-1 border-b-2 transition ${
                    activeTab === 'sim'
                      ? 'border-purple-500 text-purple-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  JS Helper SDK
                </button>
              </div>

              <button
                onClick={handleCopySdk}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1"
              >
                {copiedSdk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSdk ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-3.5 rounded-xl text-[11px] font-mono text-purple-300 overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
              {getSdkSnippet()}
            </pre>
          </div>

          {/* Response Console Log */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>Integration Event Log</span>
              </span>
              <button
                onClick={() => setLogResponse(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear Log
              </button>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl font-mono text-[11px] text-slate-300 min-h-[90px] max-h-[160px] overflow-y-auto whitespace-pre border border-slate-800">
              {logResponse || '// Trigger an action above to see live integration logs...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
