/* Temporary demo adapter. This is a UI gate, not an authorization boundary.
   Replace this adapter with server-verified sessions and per-user storage together.
   Never store passwords or reuse this demo session as a backend credential. */
window.ExcedereAuth = (() => {
  'use strict';
  // Separate namespace deliberately excluded from the existing project backup export.
  const key = 'ExcedereProjectsDemoSessionV1';
  const valid = value => value && value.version === 1 && value.mode === 'demo';
  async function getSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try { const value = JSON.parse(storage.getItem(key)); if (valid(value)) return value; } catch (_) { /* Invalid session means signed out. */ }
    }
    return null;
  }
  async function signIn({email, password, remember}) {
    if (!email.trim() || password !== 'projects-demo') throw Error('Use any valid email and the demo password projects-demo. Do not use a real password.');
    const session = {version: 1, mode: 'demo'};
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      (remember ? localStorage : sessionStorage).setItem(key, JSON.stringify(session));
    } catch (_) { throw Error('This browser could not save the demo session. Allow browser storage and try again. Your project data has not been changed.'); }
    return session;
  }
  async function signOut() {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  async function requestPasswordReset() {
    return 'No account or reset email is needed in this demo. Use projects-demo as the password. Secure account recovery will come with backend accounts.';
  }
  return {key, getSession, signIn, signOut, requestPasswordReset};
})();
