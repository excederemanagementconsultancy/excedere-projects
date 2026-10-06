/* One-time safe migration of Excedere Projects browser data to Supabase.
   Existing browser data is never deleted. */
(() => {
  'use strict';

  const auth = window.ExcedereAuth;
  const CloudRepository =
    window.ProjectsCloudRepository;
  const workspace =
    window.ExcedereProjectsWorkspace;

  if (!auth || !CloudRepository || !workspace) {
    console.error(
      'Projects cloud migration dependencies are unavailable.'
    );
    return;
  }

  const MIGRATION_KEY =
    'excedereProjectsCloudMigratedV1';

  const settingsPanel =
    document.querySelector(
      '#settingsView .panel'
    );

  if (!settingsPanel) {
    console.error(
      'Projects Settings panel was not found.'
    );
    return;
  }

  const heading =
    document.createElement('h2');

  heading.textContent =
    'Cloud storage';

  heading.className =
    'settings-heading';

  const description =
    document.createElement('p');

  description.className =
    'subtitle';

  description.textContent =
    'Copy your current Excedere Projects browser workspace into your secure Excedere account. Your existing browser copy will be kept as a backup.';

  const status =
    document.createElement('p');

  status.className =
    'subtitle';

  status.setAttribute(
    'role',
    'status'
  );

  const button =
    document.createElement('button');

  button.type = 'button';

  button.className =
    'focus-edit-button';

  button.textContent =
    'Copy Projects data to cloud';

  async function getRepository() {
    const session =
      await auth.getSession();

    if (!session?.user?.id) {
      throw new Error(
        'Sign in before migrating your Projects data.'
      );
    }

    return new CloudRepository(
      auth.client,
      session.user.id
    );
  }

  function counts(state) {
    return {
      tasks:
        state.records.tasks.length,

      captures:
        state.records.captures.length,

      milestones:
        state.records.milestones.length,

      notes:
        state.records.notes.length
    };
  }

  function sameCounts(a, b) {
    const left = counts(a);
    const right = counts(b);

    return (
      left.tasks === right.tasks &&
      left.captures === right.captures &&
      left.milestones === right.milestones &&
      left.notes === right.notes
    );
  }

  async function migrate() {
    button.disabled = true;
    status.textContent =
      'Checking cloud workspace…';

    try {
      const repo =
        await getRepository();

      const existing =
        await repo.load();

      if (existing) {
        status.textContent =
          'A Projects cloud workspace already exists. Nothing was overwritten.';
        return;
      }

      const local =
        workspace.snapshot();

      status.textContent =
        'Copying Projects data securely…';

      await repo.save(local);

      /*
       * Load it again from Supabase so we
       * verify the cloud copy independently.
       */
      const verifyRepo =
        await getRepository();

      const remote =
        await verifyRepo.load();

      if (
        !remote ||
        !sameCounts(local, remote)
      ) {
        throw new Error(
          'Cloud verification did not match the browser workspace.'
        );
      }

      localStorage.setItem(
        MIGRATION_KEY,
        new Date().toISOString()
      );

      const summary =
        counts(remote);

      status.textContent =
        `Cloud copy verified: ${summary.tasks} tasks, ${summary.captures} captured items, ${summary.milestones} milestones and ${summary.notes} notes. Browser data has been kept.`;

      button.textContent =
        'Projects data copied ✓';

    } catch (error) {
      console.error(error);

      status.textContent =
        `Migration stopped safely. ${error.message}`;

      button.disabled = false;
    }
  }

  button.addEventListener(
    'click',
    migrate
  );

  const migrated =
    localStorage.getItem(
      MIGRATION_KEY
    );

  if (migrated) {
    status.textContent =
      `A cloud copy was previously verified on ${new Date(migrated).toLocaleString()}. Your browser copy is still retained.`;
  }

  settingsPanel.append(
    heading,
    description,
    button,
    status
  );
})();
