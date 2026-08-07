import React, { useState } from 'react';
import { Terminal, Send, Copy, Check, Code, Play } from 'lucide-react';

export const ApiConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sms' | 'push' | 'call' | 'totp'>('sms');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [responseLog, setResponseLog] = useState<string | null>(null);

  // Form states
  const [smsSender, setSmsSender] = useState('GitHub Auth');
  const [smsBody, setSmsBody] = useState('Your authentication code is 482019.');
  const [smsCode, setSmsCode] = useState('482019');

  const [pushService, setPushService] = useState('Okta Identity');
  const [pushLocation, setPushLocation] = useState('San Francisco, USA');

  const [callName, setCallName] = useState('Automated Security');
  const [callCode, setCallCode] = useState('918234');

  const [totpIssuer, setTotpIssuer] = useState('Custom Work Service');
  const [totpSecret, setTotpSecret] = useState('JBSWY3DPEHPK3PXP');

  const getCurlCommand = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    if (activeTab === 'sms') {
      return `curl -X POST "${origin}/api/sms/send" \\
  -H "Content-Type: application/json" \\
  -d '{"senderName": "${smsSender}", "body": "${smsBody}", "code": "${smsCode}"}'`;
    } else if (activeTab === 'push') {
      return `curl -X POST "${origin}/api/push/send" \\
  -H "Content-Type: application/json" \\
  -d '{"service": "${pushService}", "location": "${pushLocation}", "promptType": "number_matching"}'`;
    } else if (activeTab === 'call') {
      return `curl -X POST "${origin}/api/voice/call" \\
  -H "Content-Type: application/json" \\
  -d '{"callerName": "${callName}", "code": "${callCode}"}'`;
    } else {
      return `curl -X POST "${origin}/api/totp/add" \\
  -H "Content-Type: application/json" \\
  -d '{"issuer": "${totpIssuer}", "secret": "${totpSecret}"}'`;
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleTestApi = async () => {
    setResponseLog('Sending request...');
    try {
      let endpoint = '';
      let payload = {};

      if (activeTab === 'sms') {
        endpoint = '/api/sms/send';
        payload = { senderName: smsSender, body: smsBody, code: smsCode };
      } else if (activeTab === 'push') {
        endpoint = '/api/push/send';
        payload = { service: pushService, location: pushLocation, promptType: 'number_matching' };
      } else if (activeTab === 'call') {
        endpoint = '/api/voice/call';
        payload = { callerName: callName, code: callCode };
      } else {
        endpoint = '/api/totp/add';
        payload = { issuer: totpIssuer, secret: totpSecret, accountName: 'dev@test.io' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponseLog(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseLog(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Terminal className="w-6 h-6 text-indigo-400" />
            <span>Developer Webhook & API Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Send HTTP POST requests directly to your on-screen phone from test scripts or Postman.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sms')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'sms'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          POST /api/sms/send
        </button>
        <button
          onClick={() => setActiveTab('push')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'push'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          POST /api/push/send
        </button>
        <button
          onClick={() => setActiveTab('call')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'call'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          POST /api/voice/call
        </button>
        <button
          onClick={() => setActiveTab('totp')}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === 'totp'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          POST /api/totp/add
        </button>
      </div>

      {/* Payload Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
          Request Body Configuration
        </h3>

        {activeTab === 'sms' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400">senderName</label>
              <input
                type="text"
                value={smsSender}
                onChange={(e) => setSmsSender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">code</label>
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[11px] text-slate-400">body</label>
              <input
                type="text"
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
          </div>
        )}

        {activeTab === 'push' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400">service</label>
              <input
                type="text"
                value={pushService}
                onChange={(e) => setPushService(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">location</label>
              <input
                type="text"
                value={pushLocation}
                onChange={(e) => setPushLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
          </div>
        )}

        {activeTab === 'call' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400">callerName</label>
              <input
                type="text"
                value={callName}
                onChange={(e) => setCallName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">code</label>
              <input
                type="text"
                value={callCode}
                onChange={(e) => setCallCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
          </div>
        )}

        {activeTab === 'totp' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400">issuer</label>
              <input
                type="text"
                value={totpIssuer}
                onChange={(e) => setTotpIssuer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">secret (Base32)</label>
              <input
                type="text"
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-purple-500 mt-1"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleTestApi}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Execute Test HTTP Request</span>
        </button>
      </div>

      {/* Curl Command Snippet */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center space-x-1">
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>cURL Command</span>
          </span>

          <button
            onClick={handleCopyCurl}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition"
          >
            {copiedCurl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy cURL</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-indigo-300 overflow-x-auto whitespace-pre">
          {getCurlCommand()}
        </pre>
      </div>

      {/* Response Output */}
      {responseLog && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            API Response Log
          </div>
          <pre className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
            {responseLog}
          </pre>
        </div>
      )}
    </div>
  );
};
