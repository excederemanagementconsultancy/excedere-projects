window.ExcedereAuth = (() => {
  'use strict';

  const SUPABASE_URL =
  'https://ydgbfupdyibayndvqamq.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable__-trTGzCx4SsNb6Knilcag__3oiv71f';;

  if (!window.supabase) {
    throw new Error('Supabase library failed to load.');
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  async function getSession() {
    const { data, error } =
      await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function signIn({ email, password }) {
    const { data, error } =
      await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function signOut() {
    const { error } =
      await client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async function requestPasswordReset() {
    const emailField =
      document.getElementById('signinEmail');

    const email =
      emailField
        ? emailField.value.trim()
        : '';

    if (!email) {
      throw new Error(
        'Enter your email address first.'
      );
    }

    const { error } =
      await client.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            'https://excederemanagementconsultancy.github.io/excedere-projects/'
        }
      );

    if (error) {
      throw error;
    }

    return 'Password reset email sent. Check your inbox.';
  }

  async function updatePassword(password) {
    const { data, error } =
      await client.auth.updateUser({
        password
      });

    if (error) {
      throw error;
    }

    return data.user;
  }

  function onAuthStateChange(callback) {
    return client.auth.onAuthStateChange(
      callback
    );
  }

  return {
    key: 'excedereSupabaseSession',
    client,
    getSession,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    onAuthStateChange
  };
})();
