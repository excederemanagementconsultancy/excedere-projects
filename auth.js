/* Real Supabase authentication for Excedere Projects. */
(() => {
  'use strict';

  const auth = window.ExcedereAuth;
  const $ = id => document.getElementById(id);

  const form = $('signinForm');
  const screen = $('signinScreen');
  const app = $('authenticatedApp');
  const message = $('signinMessage');
  const submit = $('signinSubmit');

  const emailField = $('signinEmail');
  const passwordField = $('signinPassword');
  const rememberField = $('signinRemember');
  const forgotButton = $('forgotPassword');

  const title = $('signinTitle');
  const subtitle =
    document.querySelector('.signin-subtitle');
  const demoNotice = $('demoNotice');

  let recoveryMode = false;

  function setMessage(text, type = '') {
    message.textContent = text || '';

    if (type === 'error') {
      message.style.color = '#ff7b7b';
    } else if (type === 'success') {
      message.style.color = '#35d07f';
    } else {
      message.style.color = '';
    }
  }

  function render(session, focus = false) {
    const signedIn =
      Boolean(session) && !recoveryMode;

    screen.hidden = signedIn;
    app.hidden = !signedIn;
    app.inert = !signedIn;

    if (!recoveryMode) {
      passwordField.value = '';
    }

    if (signedIn) {
      if (
        focus &&
        typeof showView === 'function'
      ) {
        showView(dashboardView, todayNav);
        todayNav?.focus();
      }
    } else {
      document
        .querySelectorAll('dialog[open]')
        .forEach(dialog => dialog.close());

      document
        .querySelectorAll('.save-notice')
        .forEach(notice => {
          notice.textContent = '';
        });

      if (focus) {
        if (recoveryMode) {
          passwordField.focus();
        } else {
          emailField.focus();
        }
      }
    }
  }

  function enterRecoveryMode() {
    recoveryMode = true;

    screen.hidden = false;
    app.hidden = true;
    app.inert = true;

    title.textContent = 'Set a new password';

    if (subtitle) {
      subtitle.textContent =
        'Choose a new password for your Excedere account.';
    }

    if (demoNotice) {
      demoNotice.innerHTML = `
        <strong>Password recovery</strong>
        <p>
          Enter the new password you want to use for Excedere.
        </p>
      `;
    }

    emailField.closest('label')?.setAttribute(
      'hidden',
      ''
    );

    emailField.hidden = true;
    emailField.required = false;

    if (rememberField) {
      rememberField.closest('label')?.setAttribute(
        'hidden',
        ''
      );
    }

    if (forgotButton) {
      forgotButton.hidden = true;
    }

    passwordField.value = '';
    passwordField.placeholder =
      'Enter your new password';

    passwordField.autocomplete =
      'new-password';

    submit.textContent =
      'Set new password';

    setMessage('');
    passwordField.focus();
  }

  function leaveRecoveryMode() {
    recoveryMode = false;

    title.textContent = 'Welcome back';

    if (subtitle) {
      subtitle.textContent =
        'Sign in to pick up where you left off.';
    }

    if (demoNotice) {
      demoNotice.innerHTML = `
        <strong>Secure Excedere sign-in</strong>
        <p>
          Sign in using your Excedere account.
        </p>
      `;
    }

    emailField.hidden = false;
    emailField.required = true;

    if (rememberField) {
      const label =
        rememberField.closest('label');

      if (label) {
        label.hidden = false;
        label.removeAttribute('hidden');
      }
    }

    if (forgotButton) {
      forgotButton.hidden = false;
    }

    passwordField.placeholder =
      'Enter your password';

    passwordField.autocomplete =
      'current-password';

    submit.textContent = 'Sign in';
  }

  form.addEventListener(
    'submit',
    async event => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      submit.disabled = true;
      setMessage('');

      try {
        if (recoveryMode) {
          submit.textContent =
            'Saving password…';

          const password =
            passwordField.value;

          if (password.length < 8) {
            throw new Error(
              'Use a password with at least 8 characters.'
            );
          }

          await auth.updatePassword(password);

          setMessage(
            'Password updated successfully.',
            'success'
          );

          leaveRecoveryMode();

          const session =
            await auth.getSession();

          render(session, true);

          history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          return;
        }

        submit.textContent =
          'Signing in…';

        const session =
          await auth.signIn({
            email: emailField.value,
            password: passwordField.value
          });

        render(session, true);

      } catch (error) {
        setMessage(
          error.message ||
          'Unable to sign in.',
          'error'
        );

        passwordField.value = '';
        passwordField.focus();

      } finally {
        submit.disabled = false;

        if (recoveryMode) {
          submit.textContent =
            'Set new password';
        } else {
          submit.textContent =
            'Sign in';
        }
      }
    }
  );

  forgotButton.addEventListener(
    'click',
    async () => {
      try {
        setMessage(
          await auth.requestPasswordReset(),
          'success'
        );
      } catch (error) {
        setMessage(
          error.message ||
          'Password help is unavailable. Please try again.',
          'error'
        );
      }
    }
  );

  $('signoutButton').addEventListener(
    'click',
    async () => {
      try {
        await auth.signOut();

        form.reset();
        setMessage('');
        leaveRecoveryMode();
        render(null, true);

      } catch (error) {
        render(null, true);

        setMessage(
          'Unable to complete sign out. Please try again.',
          'error'
        );
      }
    }
  );

  auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        enterRecoveryMode();
        return;
      }

      if (event === 'SIGNED_IN') {
        if (!recoveryMode) {
          render(session);
        }
      }

      if (event === 'SIGNED_OUT') {
        render(null);
      }
    }
  );

  async function restore() {
    try {
      const session =
        await auth.getSession();

      render(session);

    } catch (error) {
      render(null);
    }
  }

  window.addEventListener(
    'pageshow',
    restore
  );

  restore();
})();
