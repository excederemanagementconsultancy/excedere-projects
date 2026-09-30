window.ExcedereAuth = (() => {
  'use strict';

  const SUPABASE_URL = 'https://kxxyohagfmexvnzpuwys.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_2gcvru1GxULE5nCVFNPgQw__vOGbDxx';

  if (!window.supabase) {
    throw new Error('Supabase library failed to load.');
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  async function getSession() {
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function signIn({ email, password }) {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async function requestPasswordReset() {
    const emailField = document.getElementById('signinEmail');
    const email = emailField ? emailField.value.trim() : '';

    if (!email) {
      throw new Error('Enter your email address first.');
    }

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href
    });

    if (error) {
      throw error;
    }

    return 'Password reset email sent. Check your inbox.';
  }

  return {
    key: 'excedereSupabaseSession',
    client,
    getSession,
    signIn,
    signOut,
    requestPasswordReset
  };
})();
