import React from 'react';
import { ChevronLeft, Settings, Phone, Volume2, VolumeX, Trash2, Smartphone, ShieldAlert } from 'lucide-react';
import { PhoneSettings } from '../../types';

interface SettingsAppProps {
  settings: PhoneSettings;
  onBack: () => void;
  onUpdateSettings: (newSettings: Partial<PhoneSettings>) => void;
  onClearInbox: () => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  settings,
  onBack,
  onUpdateSettings,
  onClearInbox,
}) => {
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
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-100">Phone Settings</h2>
        </div>

        <div className="w-6"></div>
      </div>

      {/* Main Settings Form */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Virtual Phone Device</div>
            <div className="text-[11px] font-mono text-slate-400">{settings.phoneNumber}</div>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-3">
          {/* Section: Number & Carrier */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
            <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>Cellular Config</span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Virtual Phone Number</label>
              <input
                type="text"
                value={settings.phoneNumber}
                onChange={(e) => onUpdateSettings({ phoneNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Carrier Name</label>
              <select
                value={settings.carrier}
                onChange={(e) => onUpdateSettings({ carrier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 mt-1"
              >
                <option value="CyberNet 5G">CyberNet 5G</option>
                <option value="Verizon 5G">Verizon 5G</option>
                <option value="AT&T 5G">AT&T 5G</option>
                <option value="T-Mobile 5G">T-Mobile 5G</option>
                <option value="Google Fi">Google Fi</option>
              </select>
            </div>
          </div>

          {/* Section: Sound & Device Style */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
            <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sounds & Device Frame</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <div className="font-medium text-slate-200">2FA Audio Alerts</div>
                <div className="text-[10px] text-slate-400">Play chime on incoming SMS/Call</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-2 rounded-xl transition ${
                  settings.soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Device Model Style</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => onUpdateSettings({ modelStyle: 'iphone' })}
                  className={`py-1.5 rounded-xl border text-xs font-semibold transition ${
                    settings.modelStyle === 'iphone'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  iPhone Pro Style
                </button>
                <button
                  onClick={() => onUpdateSettings({ modelStyle: 'pixel' })}
                  className={`py-1.5 rounded-xl border text-xs font-semibold transition ${
                    settings.modelStyle === 'pixel'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Pixel Pro Style
                </button>
              </div>
            </div>
          </div>

          {/* Section: Clear Data */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Data Reset</span>
            </div>
            <p className="text-[10px] text-slate-400">Clear all SMS messages, calls, and notification history.</p>
            <button
              onClick={onClearInbox}
              className="w-full py-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Inbox & History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
