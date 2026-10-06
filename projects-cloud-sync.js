/* Live Supabase synchronisation for Excedere Projects.
   Browser storage remains as a local mirror and recovery copy. */
(() => {
  'use strict';

  const auth =
    window.ExcedereAuth;

  const CloudRepository =
    window.ProjectsCloudRepository;

  const workspace =
    window.ExcedereProjectsWorkspace;

  if (
    !auth ||
    !CloudRepository ||
    !workspace
  ) {
    console.error(
      'Projects cloud sync dependencies are unavailable.'
    );

    return;
  }

  const HYDRATED_KEY =
    'excedereProjectsCloudHydratedV1';

  let repo = null;
  let ready = false;
  let saving = false;
  let pending = false;
  let timer = null;
  let initialisePromise = null;

  function notify(
    text,
    error = false
  ) {
    const notice =
      document.querySelector(
        '.save-notice'
      );

    if (!notice) {
      return;
    }

    notice.textContent = text;

    notice.classList.toggle(
      'error',
      error
    );

    if (!error) {
      clearTimeout(
        notify.timer
      );

      notify.timer =
        setTimeout(() => {
          if (
            notice.textContent === text
          ) {
            notice.textContent = '';
          }
        }, 4000);
    }
  }

  async function initialise() {
    if (initialisePromise) {
      return initialisePromise;
    }

    initialisePromise =
      (async () => {
        const session =
          await auth.getSession();

        if (!session?.user?.id) {
          return false;
        }

        repo =
          new CloudRepository(
            auth.client,
            session.user.id
          );

        const remote =
          await repo.load();

        if (!remote) {
          throw new Error(
            'No Projects cloud workspace exists for this account.'
          );
        }

        /*
         * On a new browser/device, copy
         * the cloud workspace into the
         * local mirror once and reload.
         */
        if (
          sessionStorage.getItem(
            HYDRATED_KEY
          ) !== session.user.id
        ) {
          workspace.apply(remote);

          sessionStorage.setItem(
            HYDRATED_KEY,
            session.user.id
          );

          location.reload();

          return false;
        }

        ready = true;

        return true;
      })();

    try {
      return await initialisePromise;
    } catch (error) {
      initialisePromise = null;
      ready = false;
      throw error;
    }
  }

  async function saveNow() {
    if (
      !(await initialise())
    ) {
      return;
    }

    if (saving) {
      pending = true;
      return;
    }

    saving = true;

    try {
      do {
        pending = false;

        const state =
          workspace.snapshot();

        await repo.save(state);

      } while (pending);

      notify(
        'Saved securely to your account.'
      );

    } catch (error) {
      console.error(error);

      notify(
        `Cloud save stopped safely. ${error.message}`,
        true
      );

    } finally {
      saving = false;
    }
  }

  function scheduleSave() {
    clearTimeout(timer);

    timer =
      setTimeout(
        saveNow,
        400
      );
  }

  window.ExcedereProjectsCloudSync =
    scheduleSave;

  /*
   * app.js already emits this whenever
   * the selected project changes.
   */
  window.addEventListener(
    'excedere:project-change',
    scheduleSave
  );

  auth.onAuthStateChange(
    (event) => {
      if (event === 'SIGNED_OUT') {
        ready = false;
        repo = null;
        initialisePromise = null;

        sessionStorage.removeItem(
          HYDRATED_KEY
        );
      }

      if (event === 'SIGNED_IN') {
        initialisePromise = null;

        initialise().catch(
          error => {
            console.error(error);

            notify(
              `Cloud workspace could not be loaded. ${error.message}`,
              true
            );
          }
        );
      }
    }
  );

  initialise().catch(
    error => {
      console.error(error);

      notify(
        `Cloud workspace could not be loaded. ${error.message}`,
        true
      );
    }
  );
})();
