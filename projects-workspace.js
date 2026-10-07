/* Excedere Projects workspace snapshot and migration helpers.
   This file does not migrate or delete anything automatically. */
(() => {
  'use strict';

  const store = window.ExcedereStore;

  if (!store) {
    throw new Error(
      'Excedere Projects storage is not available.'
    );
  }

  const [
    tasksKey,
    capturesKey,
    milestonesKey,
    notesKey
  ] = store.keys;

  const STATUS_KEYS = {
    currentFocus: 'excedereCurrentFocus',
    currentStage: 'excedereCurrentStage',
    nextAction: 'excedereNextAction',
    overallProgress: 'excedereOverallProgress'
  };

  const ACTIVE_PROJECT_KEY =
    'excedereActiveProjectWorkspace';

  const SEED_KEY =
    'excedereSeedTasksV1';

  const PROJECT_REGISTRY_KEY =
    'excedereProjectRegistryV1';

  const PROJECT_REGISTRY_BACKUP_KEY =
    'excedereProjectRegistryBackupV1';

  const COMMERCIAL_PROJECT_SEED_KEY =
    'excedereCommercialProjectsSeedV1';


  function localValue(key) {
    const value =
      localStorage.getItem(key);

    return value === null
      ? null
      : value;
  }


  function readProjectRegistry() {
    const raw =
      localStorage.getItem(
        PROJECT_REGISTRY_KEY
      );

    if (!raw) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.warn(
        'Could not read project registry.',
        error
      );

      return [];
    }
  }


  function writeProjectRegistry(projects) {
    if (!Array.isArray(projects)) {
      throw new Error(
        'Project registry is invalid.'
      );
    }

    const existing =
      localStorage.getItem(
        PROJECT_REGISTRY_KEY
      );

    if (existing !== null) {
      localStorage.setItem(
        PROJECT_REGISTRY_BACKUP_KEY,
        existing
      );
    }

    localStorage.setItem(
      PROJECT_REGISTRY_KEY,
      JSON.stringify(
        structuredClone(projects)
      )
    );
  }


  function validate(workspace) {
    if (
      !workspace ||
      typeof workspace !== 'object' ||
      Number(workspace.schemaVersion) !== 1
    ) {
      throw new Error(
        'Unsupported Projects workspace.'
      );
    }

    if (
      !workspace.records ||
      !Array.isArray(
        workspace.records.tasks
      ) ||
      !Array.isArray(
        workspace.records.captures
      ) ||
      !Array.isArray(
        workspace.records.milestones
      ) ||
      !Array.isArray(
        workspace.records.notes
      )
    ) {
      throw new Error(
        'Projects workspace records are invalid.'
      );
    }

    /*
     * Older cloud workspaces do not
     * contain a project registry.
     *
     * This is intentionally optional
     * so existing data remains valid.
     */
    if (
      workspace.projects !== undefined &&
      !Array.isArray(workspace.projects)
    ) {
      throw new Error(
        'Projects registry is invalid.'
      );
    }

    return workspace;
  }


  function snapshot() {
    return validate({
      schemaVersion: 1,

      savedAt:
        new Date().toISOString(),

      records: {
        tasks:
          structuredClone(
            store.read(tasksKey)
          ),

        captures:
          structuredClone(
            store.read(capturesKey)
          ),

        milestones:
          structuredClone(
            store.read(milestonesKey)
          ),

        notes:
          structuredClone(
            store.read(notesKey)
          )
      },

      /*
       * User-created projects now
       * travel with the cloud workspace.
       */
      projects:
        structuredClone(
          readProjectRegistry()
        ),

      projectStatus: {
        currentFocus:
          localValue(
            STATUS_KEYS.currentFocus
          ),

        currentStage:
          localValue(
            STATUS_KEYS.currentStage
          ),

        nextAction:
          localValue(
            STATUS_KEYS.nextAction
          ),

        overallProgress:
          localValue(
            STATUS_KEYS.overallProgress
          )
      },

      preferences: {
        activeProjectWorkspace:
          localValue(
            ACTIVE_PROJECT_KEY
          ),

        seedTasksV1:
          localValue(
            SEED_KEY
          ),

        commercialProjectsSeedV1:
          localValue(
            COMMERCIAL_PROJECT_SEED_KEY
          )
      }
    });
  }


  function restoreValue(
    key,
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(
        key,
        String(value)
      );
    }
  }


  function apply(workspace) {
    const state =
      validate(
        structuredClone(workspace)
      );

    /*
     * ExcedereStore.write keeps the
     * existing browser backup behaviour.
     */
    store.write(
      tasksKey,
      state.records.tasks
    );

    store.write(
      capturesKey,
      state.records.captures
    );

    store.write(
      milestonesKey,
      state.records.milestones
    );

    store.write(
      notesKey,
      state.records.notes
    );


    /*
     * Important:
     *
     * Older cloud snapshots have no
     * projects property.
     *
     * In that situation we DO NOT erase
     * a newer local project registry.
     */
    if (
      Array.isArray(
        state.projects
      )
    ) {
      writeProjectRegistry(
        state.projects
      );
    }


    restoreValue(
      STATUS_KEYS.currentFocus,
      state.projectStatus?.currentFocus
    );

    restoreValue(
      STATUS_KEYS.currentStage,
      state.projectStatus?.currentStage
    );

    restoreValue(
      STATUS_KEYS.nextAction,
      state.projectStatus?.nextAction
    );

    restoreValue(
      STATUS_KEYS.overallProgress,
      state.projectStatus?.overallProgress
    );

    restoreValue(
      ACTIVE_PROJECT_KEY,
      state.preferences
        ?.activeProjectWorkspace
    );

    restoreValue(
      SEED_KEY,
      state.preferences?.seedTasksV1
    );


    /*
     * Only restore this when the incoming
     * workspace actually contains it.
     *
     * This protects the first upgrade
     * from older cloud snapshots.
     */
    if (
      state.preferences
        ?.commercialProjectsSeedV1 !==
      undefined
    ) {
      restoreValue(
        COMMERCIAL_PROJECT_SEED_KEY,
        state.preferences
          .commercialProjectsSeedV1
      );
    }


    window.dispatchEvent(
      new CustomEvent(
        'excedere:projects-registry-updated'
      )
    );

    window.refreshExcedere?.();

    return state;
  }


  function summary() {
    const state =
      snapshot();

    return {
      projects:
        state.projects.length,

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


  window.ExcedereProjectsWorkspace = {
    snapshot,
    apply,
    validate,
    summary
  };
})();
