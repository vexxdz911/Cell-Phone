export type AppView = 'home' | 'messages' | 'authenticator' | 'push' | 'calls' | 'notes' | 'settings' | 'ai_assistant' | 'gmail';

export interface SMSMessage {
  id: string;
  sender: string;
  senderName: string;
  avatarColor: string;
  body: string;
  code?: string;
  link?: string;
  externalApp?: string;
  timestamp: string;
  read: boolean;
}

export interface TOTPAccount {
  id: string;
  issuer: string;
  accountName: string;
  secret: string;
  icon?: string;
  period?: number;
  digits?: number;
}

export interface PushRequest {
  id: string;
  service: string;
  serviceLogo?: string;
  location: string;
  ipAddress: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  promptType: 'simple' | 'number_matching';
  matchingNumber?: number;
  numberOptions?: number[];
}

export interface VoiceCall {
  id: string;
  caller: string;
  callerName: string;
  code: string;
  spokenMessage: string;
  timestamp: string;
  status: 'incoming' | 'answered' | 'ended' | 'missed';
}

export interface BackupNote {
  id: string;
  title: string;
  service: string;
  codes: string[];
  createdAt: string;
}

export interface PhoneSettings {
  phoneNumber: string;
  carrier: string;
  wallpaper: string;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  autoCopyOTP: boolean;
  modelStyle: 'iphone' | 'pixel';
}

export interface PhoneState {
  messages: SMSMessage[];
  totpAccounts: TOTPAccount[];
  pushRequests: PushRequest[];
  calls: VoiceCall[];
  notes: BackupNote[];
  settings: PhoneSettings;
  activeNotification?: {
    id: string;
    type: 'sms' | 'push' | 'call';
    title: string;
    message: string;
    code?: string;
    link?: string;
    externalApp?: string;
  };
}

export interface LoginDemoService {
  id: string;
  name: string;
  category: string;
  icon: string;
  bgColor: string;
  authMethods: ('sms' | 'totp' | 'push' | 'call')[];
  defaultUsername: string;
}
