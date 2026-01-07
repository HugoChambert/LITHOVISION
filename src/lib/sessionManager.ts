import { supabase } from './supabase';
import { type StoneMaterial } from './supabase';

export interface SessionData {
  currentStep: 'upload' | 'select-area' | 'choose-stone' | 'preview';
  uploadedImage: string | null;
  imageId: string | null;
  maskData: string | null;
  maskId: string | null;
  selectedStones: StoneMaterial[];
  previewImages: Array<{ stone: StoneMaterial; imageUrl: string }>;
  timestamp: number;
}

const SESSION_KEY = 'stone_replacement_session';
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000;

function generateSessionKey(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getLocalSessionKey(): string {
  let key = localStorage.getItem('session_key');
  if (!key) {
    key = generateSessionKey();
    localStorage.setItem('session_key', key);
  }
  return key;
}

export function saveSessionLocal(data: Partial<SessionData>): void {
  try {
    const existing = loadSessionLocal();
    const updated: SessionData = {
      ...existing,
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail - session saving is not critical
  }
}

export function loadSessionLocal(): SessionData {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      return getEmptySession();
    }

    const data = JSON.parse(stored) as SessionData;

    if (Date.now() - data.timestamp > SESSION_EXPIRY) {
      clearSessionLocal();
      return getEmptySession();
    }

    return data;
  } catch (error) {
    return getEmptySession();
  }
}

export function clearSessionLocal(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    // Silently fail - session clearing is not critical
  }
}

export async function saveSessionRemote(data: Partial<SessionData>): Promise<void> {
  try {
    const sessionKey = getLocalSessionKey();
    const existing = loadSessionLocal();
    const updated: SessionData = {
      ...existing,
      ...data,
      timestamp: Date.now(),
    };

    await supabase
      .from('project_sessions')
      .upsert({
        session_key: sessionKey,
        project_data: updated,
        expires_at: new Date(Date.now() + SESSION_EXPIRY).toISOString(),
      }, {
        onConflict: 'session_key'
      });
  } catch (error) {
    // Silently fail - remote session saving is not critical
  }
}

export async function loadSessionRemote(): Promise<SessionData | null> {
  try {
    const sessionKey = getLocalSessionKey();

    const { data, error } = await supabase
      .from('project_sessions')
      .select('project_data, expires_at')
      .eq('session_key', sessionKey)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const expiresAt = new Date(data.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await clearSessionRemote();
      return null;
    }

    return data.project_data as SessionData;
  } catch (error) {
    return null;
  }
}

export async function clearSessionRemote(): Promise<void> {
  try {
    const sessionKey = getLocalSessionKey();

    await supabase
      .from('project_sessions')
      .delete()
      .eq('session_key', sessionKey);
  } catch (error) {
    // Silently fail - remote session clearing is not critical
  }
}

export function hasStoredSession(): boolean {
  const data = loadSessionLocal();
  return data.currentStep !== 'upload' || data.uploadedImage !== null;
}

function getEmptySession(): SessionData {
  return {
    currentStep: 'upload',
    uploadedImage: null,
    imageId: null,
    maskData: null,
    maskId: null,
    selectedStones: [],
    previewImages: [],
    timestamp: Date.now(),
  };
}

export async function syncSession(localData: Partial<SessionData>): Promise<void> {
  saveSessionLocal(localData);
  await saveSessionRemote(localData);
}
