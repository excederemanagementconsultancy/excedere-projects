/* Sign-in presentation depends only on the replaceable async auth adapter. */
(() => {
  'use strict';
  const auth = window.ExcedereAuth;
  const $ = id => document.getElementById(id);
  const form = $('signinForm'), screen = $('signinScreen'), app = $('authenticatedApp');
  const message = $('signinMessage'), submit = $('signinSubmit');
  function render(session, focus = false) {
    const signedIn = Boolean(session);
    screen.hidden = signedIn;
    app.hidden = !signedIn;
    app.inert = !signedIn;
    $('signinPassword').value = '';
    if (signedIn) {
      if (focus) { showView(dashboardView, todayNav); $('todayNav').focus(); }
    } else {
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      document.querySelectorAll('.save-notice').forEach(notice => notice.textContent = '');
      if (focus) $('signinEmail').focus();
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true; submit.textContent = 'Signing in…'; message.textContent = '';
    try {
      const session = await auth.signIn({email: $('signinEmail').value, password: $('signinPassword').value, remember: $('signinRemember').checked});
      render(session, true);
    } catch (error) { message.textContent = error.message; $('signinPassword').value = ''; $('signinPassword').focus(); }
    finally { submit.disabled = false; submit.textContent = 'Sign in'; }
  });
  $('forgotPassword').addEventListener('click', async () => {
    try { message.textContent = await auth.requestPasswordReset(); } catch (_) { message.textContent = 'Password help is unavailable. Please try again.'; }
  });
  $('signoutButton').addEventListener('click', async () => {
    try { await auth.signOut(); form.reset(); message.textContent = ''; render(null, true); }
    catch (_) { render(null, true); message.textContent = 'The saved demo session could not be removed. Enable browser storage and sign out again before leaving a shared device.'; }
  });
  async function restore() {
    try { render(await auth.getSession()); } catch (_) { render(null); }
  }
  window.addEventListener('storage', event => { if (event.key === auth.key || event.key === null) restore(); });
  window.addEventListener('pageshow', restore);
  restore();
})();
