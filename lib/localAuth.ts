import type { UserProfile } from './types';
import { normalizeLoginName } from './date';

export const SESSION_KEY = 'storeSalesUser';
export const DEFAULT_ADMIN_NAME = '심민준';
export const DEFAULT_ADMIN_PASSWORD = '12345678';

export function userDocId(name: string) {
  return normalizeLoginName(name);
}

export function saveSession(user: UserProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as UserProfile : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function requireSession(): UserProfile | null {
  const user = getSession();
  if (!user && typeof window !== 'undefined') location.href = '/login';
  return user;
}
