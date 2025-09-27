import { useState } from 'react';

const SESSION_STORAGE_KEY = 'sih-admin-session';

const loadPersistedSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.expiresAt && parsed.expiresAt > Date.now()) {
      return parsed;
    }
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to load admin session', error);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return null;
};

const persistSession = (payload) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist admin session', error);
  }
};

const clearSession = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear admin session', error);
  }
};

export function useAdminSession({ adminId, adminPassword, sessionDuration }) {
  const persisted = loadPersistedSession();
  const [isAuthorized, setIsAuthorized] = useState(Boolean(persisted));
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authorize = async (event) => {
    event?.preventDefault?.();
    setIsSubmitting(true);
    setError('');
    try {
      const trimmedId = credentials.id.trim();
      if (trimmedId === adminId && credentials.password === adminPassword) {
        const payload = {
          issuedAt: Date.now(),
          expiresAt: Date.now() + sessionDuration
        };
        persistSession(payload);
        setIsAuthorized(true);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = () => {
    clearSession();
    setIsAuthorized(false);
    setCredentials({ id: '', password: '' });
    setError('');
  };

  const handleCredentialsChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError('');
    }
  };

  return {
    isAuthorized,
    credentials,
    handleCredentialsChange,
    authorize,
    signOut,
    error,
    isSubmitting
  };
}
