/* Keep account-specific pending work until Supabase confirms its save. */
(() => {
  'use strict';
  const auth = window.ExcedereAuth;
  const CloudRepository = window.ProjectsCloudRepository;
  const workspace = window.ExcedereProjectsWorkspace;
  if (!auth || !CloudRepository || !workspace) return;
  const HYDRATED_KEY = 'excedereProjectsCloudHydratedV1';
  const PREFIX = 'excedereProjectsPendingV1:';
  let repo = null, owner = null, ready = false, saving = false;
  let blocked = false, timer = null, initialising = null, generation = 0;
  let journal = null, recoveryFailed = false, refreshing = false;
  const app = document.getElementById('authenticatedApp');
  if (app) app.inert = true;
  const key = user => PREFIX + user;
  const marker = () => `${owner}:${repo.version}`;

  function notify(text, error = false) {
    const notice = document.querySelector('.save-notice');
    if (notice) {
      notice.textContent = text;
      notice.classList.toggle('error', error);
    }
    let status = document.getElementById('projects-sync-status');
    if (!status) {
      const host = document.getElementById('authenticatedApp');
      if (!host) return;
      status = document.createElement('p');
      status.id = 'projects-sync-status';
      status.setAttribute('role', 'status');
      const sidebar = host.querySelector('.sidebar');
      if (!sidebar) return;
      sidebar.append(status);
    }
    status.textContent = text;
    if (error && journal) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'focus-edit-button';
      retry.textContent = 'Retry sync';
      retry.disabled = blocked || recoveryFailed;
      retry.onclick = saveNow;
      status.append(' ', retry);
    }
  }

  function readPending(user) {
    const raw = localStorage.getItem(key(user));
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value.userId !== user || !Number.isInteger(value.baseVersion) ||
        typeof value.revision !== 'string') throw Error('Recovery copy is invalid. Export a backup before continuing.');
    workspace.validate(value.payload);
    return value;
  }

  function capture() {
    if (!ready || !owner) {
      notify('Changes remain in this browser. Cloud sync is not ready. Export a backup before leaving.', true);
      return false;
    }
    const next = {
      userId: owner, baseVersion: journal?.baseVersion ?? repo.version,
      revision: crypto.randomUUID(), payload: workspace.snapshot()
    };
    try {
      localStorage.setItem(key(owner), JSON.stringify(next));
    } catch (error) {
      recoveryFailed = true;
      throw error;
    }
    journal = next;
    recoveryFailed = false;
    notify(blocked
      ? 'Saved in this browser. Sync is paused because another version needs review. Export a backup before resolving it.'
      : 'Saved in this browser. Waiting to sync to your account.', true);
    return true;
  }

  async function initialise() {
    if (initialising) return initialising;
    const token = generation;
    initialising = (async () => {
      const session = await auth.getSession();
      if (token !== generation || !session?.user?.id) {
        if (token === generation) initialising = null;
        return false;
      }
      owner = session.user.id;
      repo = new CloudRepository(auth.client, owner);
      journal = readPending(owner);
      if (journal) workspace.apply(journal.payload);
      const remote = await repo.load();
      if (token !== generation) return false;
      if (journal) {
        ready = true;
        if (app) app.inert = false;
        blocked = repo.version !== journal.baseVersion;
        notify(blocked
          ? 'Recovered unsynced changes. Your account has newer work. Export a backup before resolving the conflict. Automatic sync is paused.'
          : 'Recovered unsynced changes in this browser. Use Retry sync to save them to your account.', true);
        window.ExcedereProjectsOpenLinkedTask?.();
        return true;
      }
      if (!remote) throw Error('No Projects cloud workspace exists for this account.');
      if (sessionStorage.getItem(HYDRATED_KEY) !== marker()) {
        workspace.apply(remote);
        sessionStorage.setItem(HYDRATED_KEY, marker());
        location.reload();
        return false;
      }
      ready = true;
      if (app) app.inert = false;
      notify('Your account workspace is up to date.');
      window.ExcedereProjectsOpenLinkedTask?.();
      return true;
    })();
    try { return await initialising; }
    catch (error) {
      if (token !== generation) return false;
      initialising = null;
      ready = Boolean(journal);
      if (app) app.inert = !ready;
      notify(`Cloud workspace could not be loaded. Local recovery copies are retained. ${error.message}`, true);
      return false;
    }
  }

  const samePayload = (a, b) => {
    const { savedAt: ignoredA, ...left } = a;
    const { savedAt: ignoredB, ...right } = b;
    return JSON.stringify(left) === JSON.stringify(right);
  };

  function storageWarning() {
    notify('Not synced. Latest changes could not be protected in recovery storage. Export a backup before leaving. Save your latest edit again after storage is available.', true);
  }

  async function saveNow() {
    if (recoveryFailed) { storageWarning(); return; }
    if (!(await initialise()) || !ready || saving || blocked || !journal) return;
    saving = true;
    const token = generation, savingRepo = repo, savingOwner = owner;
    try {
      while (journal && token === generation) {
        if (recoveryFailed) { storageWarning(); return; }
        if (!samePayload(workspace.snapshot(), journal.payload)) capture();
        if (recoveryFailed) { storageWarning(); return; }
        const sent = structuredClone(journal);
        const disk = readPending(savingOwner);
        if (disk?.revision !== sent.revision) throw Error('Another tab changed the recovery copy. Reload to recover its latest work.');
        await savingRepo.save(sent.payload);
        if (!Number.isInteger(savingRepo.version) || savingRepo.version <= sent.baseVersion) {
          throw Error('The server did not confirm the save. Your recovery copy is retained.');
        }
        if (token !== generation) return;
        journal.baseVersion = savingRepo.version;
        if (recoveryFailed) { storageWarning(); return; }
        if (!samePayload(workspace.snapshot(), journal.payload)) capture();
        const latest = readPending(savingOwner);
        if (latest?.revision !== journal.revision) throw Error('Another tab has pending work. Reload before syncing again.');
        if (journal.revision === sent.revision) {
          localStorage.removeItem(key(savingOwner));
          journal = null;
        } else {
          journal.baseVersion = savingRepo.version;
          try {
            localStorage.setItem(key(savingOwner), JSON.stringify(journal));
          } catch (error) {
            recoveryFailed = true;
            throw error;
          }
        }
        sessionStorage.setItem(HYDRATED_KEY, marker());
      }
      if (recoveryFailed) { storageWarning(); return; }
      notify('Saved securely to your account.');
    } catch (error) {
      if (token === generation) {
        if (recoveryFailed) { storageWarning(); return; }
        blocked = /conflict|Another tab/.test(error.message);
        notify(`Not synced. Your changes remain in this browser. ${error.message}`, true);
      }
    } finally { if (token === generation) saving = false; }
  }

  function scheduleSave() {
    clearTimeout(timer);
    try { if (capture()) timer = setTimeout(saveNow, 400); }
    catch (error) { recoveryFailed = true; storageWarning(); }
  }
  window.ExcedereProjectsCloudSync = scheduleSave;
  window.ExcedereProjectsCloudReady = () => ready;

  // Do not hydrate over pending edits, conflicts, failed recovery or an open editor.
  async function refreshRemote() {
    if (!ready || !repo || !owner || journal || saving || blocked || recoveryFailed || refreshing ||
        document.hidden || document.querySelector('dialog[open]')) return;
    const token = generation, currentRepo = repo, currentOwner = owner;
    refreshing = true;
    try {
      if (readPending(currentOwner)) return;
      const before = workspace.snapshot();
      const candidate = new CloudRepository(auth.client, currentOwner);
      const remote = await candidate.load();
      if (token !== generation || repo !== currentRepo || journal || saving || blocked || recoveryFailed ||
          document.querySelector('dialog[open]') || readPending(currentOwner) ||
          !samePayload(before, workspace.snapshot())) return;
      if (!remote || candidate.version < currentRepo.version) throw Error('The account version could not be verified.');
      if (candidate.version === currentRepo.version) return;
      workspace.validate(remote);
      workspace.apply(remote);
      repo = candidate;
      sessionStorage.setItem(HYDRATED_KEY, marker());
      notify('Updated from your account.');
      window.ExcedereProjectsOpenLinkedTask?.();
    } catch (error) {
      if (token === generation) notify(`Account refresh could not finish. Your browser data is retained. ${error.message}`, true);
    } finally { refreshing = false; }
  }
  window.ExcedereProjectsRefresh = refreshRemote;
  window.addEventListener('focus', refreshRemote);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshRemote(); });
  document.addEventListener('close', refreshRemote, true);
  setInterval(refreshRemote, 60000);
  window.addEventListener('excedere:project-change', scheduleSave);
  window.addEventListener('beforeunload', event => {
    if (journal || recoveryFailed) { event.preventDefault(); event.returnValue = ''; }
  });
  window.addEventListener('storage', event => {
    if (owner && event.key === key(owner)) {
      blocked = true;
      notify('Another tab changed pending work. Export a backup and reload before syncing.', true);
    }
  });
  auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') {
      generation++;
      clearTimeout(timer);
      ready = false;
      saving = false;
      repo = owner = journal = initialising = null;
      sessionStorage.removeItem(HYDRATED_KEY);
    }
    if (event === 'SIGNED_IN' && !ready && !initialising) {
      if (app) app.inert = true;
      setTimeout(() => initialise(), 0);
    }
  });
  initialise();
})();
