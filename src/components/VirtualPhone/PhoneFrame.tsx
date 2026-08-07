import React, { useState } from 'react';
import { AppView, PhoneSettings, PhoneState } from '../../types';
import { StatusBar } from './StatusBar';
import { TopBanner } from './TopBanner';
import { HomeScreen } from './HomeScreen';
import { MessagesApp } from './MessagesApp';
import { AuthenticatorApp } from './AuthenticatorApp';
import { PushVerifyApp } from './PushVerifyApp';
import { PhoneCallApp } from './PhoneCallApp';
import { NotesApp } from './NotesApp';
import { SettingsApp } from './SettingsApp';
import { AIAssistantApp } from './AIAssistantApp';
import { GmailApp } from './GmailApp';
import { soundEngine } from '../../lib/sound';

interface PhoneFrameProps {
  phoneState: PhoneState;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onSendTestSMS: (senderName: string, body: string, code?: string) => void;
  onAddTOTP: (issuer: string, accountName: string, secret: string) => void;
  onDeleteTOTP: (id: string) => void;
  onRespondPush: (id: string, status: 'approved' | 'denied', selectedNumber?: number) => void;
  onAddNote: (title: string, service: string, codes: string[]) => void;
  onUpdateSettings: (newSettings: Partial<PhoneSettings>) => void;
  onClearInbox: () => void;
  onDismissNotification: () => void;
  scale?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  phoneState,
  onCopyCode,
  copiedCode,
  onSendTestSMS,
  onAddTOTP,
  onDeleteTOTP,
  onRespondPush,
  onAddNote,
  onUpdateSettings,
  onClearInbox,
  onDismissNotification,
  scale = 1,
}) => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isLocked, setIsLocked] = useState(false);

  const handleOpenApp = (app: AppView) => {
    if (phoneState.settings.soundEnabled) {
      soundEngine.playKeypadClick();
    }
    setCurrentView(app);
  };

  const handleHomeClick = () => {
    if (phoneState.settings.soundEnabled) {
      soundEngine.playKeypadClick();
    }
    setCurrentView('home');
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
  };

  const isIphone = phoneState.settings.modelStyle === 'iphone';

  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      className="relative select-none transition-all duration-300"
    >
      {/* Physical Hardware Buttons */}
      {/* Volume Up */}
      <div
        onClick={() => soundEngine.playKeypadClick()}
        className="absolute -left-3 top-24 w-1.5 h-10 bg-slate-700 hover:bg-slate-600 rounded-l cursor-pointer shadow"
        title="Volume Up"
      ></div>
      {/* Volume Down */}
      <div
        onClick={() => soundEngine.playKeypadClick()}
        className="absolute -left-3 top-38 w-1.5 h-10 bg-slate-700 hover:bg-slate-600 rounded-l cursor-pointer shadow"
        title="Volume Down"
      ></div>
      {/* Lock / Power Button */}
      <div
        onClick={toggleLock}
        className="absolute -right-3 top-28 w-1.5 h-14 bg-slate-700 hover:bg-slate-600 rounded-r cursor-pointer shadow"
        title="Lock / Unlock Screen"
      ></div>

      {/* Smartphone Chassis Outer Ring */}
      <div className="w-[340px] h-[660px] bg-slate-900 p-3 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[4px] border-slate-700/80 relative flex flex-col overflow-hidden">
        
        {/* Inner Screen Bezel */}
        <div className="w-full h-full bg-slate-950 rounded-[38px] relative flex flex-col overflow-hidden border border-slate-800">
          
          {/* Status Bar */}
          <StatusBar carrier={phoneState.settings.carrier} isMuted={!phoneState.settings.soundEnabled} />

          {/* Top Banner Dropdown Notification */}
          {phoneState.activeNotification && !isLocked && (
            <TopBanner
              notification={phoneState.activeNotification}
              onDismiss={onDismissNotification}
              onOpenApp={handleOpenApp}
              onCopyCode={onCopyCode}
              copiedCode={copiedCode}
            />
          )}

          {/* Locked Screen Overlay */}
          {isLocked ? (
            <div
              onClick={() => setIsLocked(false)}
              className="flex-1 flex flex-col items-center justify-between p-6 z-40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white cursor-pointer"
            >
              <div className="mt-8 text-center space-y-1">
                <div className="text-5xl font-extralight tracking-tight">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-slate-400">Tap anywhere to unlock virtual phone</div>
              </div>

              {phoneState.activeNotification && (
                <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3.5 w-full text-xs shadow-xl">
                  <div className="font-bold text-amber-400">{phoneState.activeNotification.title}</div>
                  <div className="text-slate-300 text-[11px] mt-0.5 line-clamp-2">
                    {phoneState.activeNotification.message}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 font-medium tracking-wide">
                Virtual Phone Active • {phoneState.settings.phoneNumber}
              </div>
            </div>
          ) : (
            /* Active View Content */
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {currentView === 'home' && (
                <HomeScreen
                  phoneState={phoneState}
                  onOpenApp={handleOpenApp}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                />
              )}

              {currentView === 'messages' && (
                <MessagesApp
                  messages={phoneState.messages}
                  onBack={handleHomeClick}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                  onSendTestSMS={onSendTestSMS}
                />
              )}

              {currentView === 'authenticator' && (
                <AuthenticatorApp
                  accounts={phoneState.totpAccounts}
                  onBack={handleHomeClick}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                  onAddAccount={onAddTOTP}
                  onDeleteAccount={onDeleteTOTP}
                />
              )}

              {currentView === 'push' && (
                <PushVerifyApp
                  pushRequests={phoneState.pushRequests}
                  onBack={handleHomeClick}
                  onRespondPush={onRespondPush}
                />
              )}

              {currentView === 'calls' && (
                <PhoneCallApp
                  calls={phoneState.calls}
                  onBack={handleHomeClick}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                />
              )}

              {currentView === 'notes' && (
                <NotesApp
                  notes={phoneState.notes}
                  onBack={handleHomeClick}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                  onAddNote={onAddNote}
                />
              )}

              {currentView === 'settings' && (
                <SettingsApp
                  settings={phoneState.settings}
                  onBack={handleHomeClick}
                  onUpdateSettings={onUpdateSettings}
                  onClearInbox={onClearInbox}
                />
              )}

              {currentView === 'ai_assistant' && (
                <AIAssistantApp
                  onBack={handleHomeClick}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                  onInjectSMS={onSendTestSMS}
                />
              )}

              {currentView === 'gmail' && (
                <GmailApp
                  onBack={handleHomeClick}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                />
              )}
            </div>
          )}

          {/* Bottom Home Indicator Bar */}
          <div
            onClick={handleHomeClick}
            className="w-full py-2 flex items-center justify-center cursor-pointer group bg-slate-950 z-30"
          >
            <div className="w-32 h-1 bg-slate-600 group-hover:bg-slate-300 rounded-full transition-colors"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
