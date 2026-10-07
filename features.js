/* Excedere Projects features, project registry and task tools. */
(() => {
  'use strict';

  const store = window.ExcedereStore;

  if (!store) {
    throw new Error('Excedere Projects storage is not available.');
  }

  const [tasksKey, capturesKey, milestonesKey, notesKey] = store.keys;
  const $ = id => document.getElementById(id);

  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };

  const button = (text, action, cls = 'focus-edit-button') => {
    const b = el('button', text, cls);
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
  };

  const PROJECT_REGISTRY_KEY = 'excedereProjectRegistryV1';
  const PROJECT_REGISTRY_BACKUP_KEY = 'excedereProjectRegistryBackupV1';
  const COMMERCIAL_PROJECT_SEED_KEY = 'excedereCommercialProjectsSeedV1';
  const ACTIVE_PROJECT_KEY = 'excedereActiveProjectWorkspace';

  const BUILT_IN_PROJECTS = [
    'Excedere Projects',
    'Excedere CRM',
    'Excedere Flow',
    'Excedere Website'
  ];

  const COMMERCIAL_PROJECTS = [
    {
      id: 'crm-core-launch',
      name: 'Excedere CRM Core Launch',
      shortName: 'CORE',
      subtitle: 'Prepare and launch the first commercial Excedere CRM service level.',
      focus: 'Prepare Excedere CRM Core for its first commercial customers.',
      stage: 'Launch planning.',
      next: 'Define the Core launch checklist and Founding Customer release plan.',
      progress: 0
    },
    {
      id: 'crm-growth-launch',
      name: 'Excedere CRM Growth Launch',
      shortName: 'GROWTH',
      subtitle: 'Build and release the second Excedere CRM service level.',
      focus: 'Prepare the Growth edition for larger teams and expanded workflows.',
      stage: 'Planned after Core launch.',
      next: 'Define the additional Growth features after Core is stable.',
      progress: 0
    },
    {
      id: 'excedere-intelligence',
      name: 'Excedere Intelligence',
      shortName: 'INTELLIGENCE',
      subtitle: 'Develop the AI powered Sales Intelligence layer for Excedere CRM.',
      focus: 'Plan practical AI features that improve sales follow-up and CRM decision making.',
      stage: 'Product planning.',
      next: 'Prioritise the first Intelligence features and operating costs.',
      progress: 0
    },
    {
      id: 'crm-custom',
      name: 'Excedere CRM Custom',
      shortName: 'CUSTOM',
      subtitle: 'Create the branded and configurable Excedere CRM service level.',
      focus: 'Define the repeatable framework for branded customer CRM editions.',
      stage: 'Product planning.',
      next: 'Define what is included as standard customisation and what is separately quoted.',
      progress: 0
    },
    {
      id: 'excedere-ai-voice',
      name: 'Excedere AI Voice',
      shortName: 'AI VOICE',
      subtitle: 'Research and later develop AI powered calling for Excedere CRM.',
      focus: 'Research providers, telephony costs, compliance and commercial viability.',
      stage: 'Future research.',
      next: 'Compare provider, telephony, compliance and usage pricing options before development.',
      progress: 0
    },
    {
      id: 'crm-commercial-strategy',
      name: 'Excedere CRM Commercial Strategy',
      shortName: 'COMMERCIAL',
      subtitle: 'Manage CRM pricing, market positioning, discounts and phased product rollout.',
      focus: 'Build a competitive pricing and launch strategy that supports controlled market growth.',
      stage: 'Commercial planning.',
      next: 'Finalise launch pricing, payment terms, founding offer and phased release messaging.',
      progress: 0
    },
    {
      id: 'hey-rachel-crm-partnership',
      name: 'Hey Rachel CRM Partnership',
      shortName: 'HEY RACHEL',
      subtitle: 'Build the Hey Rachel CRM partnership, branded edition and commercial relationship.',
      focus: 'Define the Hey Rachel edition, Mario partnership terms and calling integration.',
      stage: 'Partnership planning.',
      next: 'Prepare the partnership proposal for Mario.',
      progress: 0
    }
  ];

  const MARIO_TASK_TITLE = 'Prepare Partnership Proposal for Mario';

  let noticeTimer;

  const notice = el('div', '', 'save-notice');
  notice.setAttribute('role', 'status');
  document.body.append(notice);

  function report(text, error = false) {
    clearTimeout(noticeTimer);
    notice.textContent = text;
    notice.classList.toggle('error', error);

    if (!error) {
      noticeTimer = setTimeout(() => {
        notice.textContent = '';
      }, 4000);
    }
  }

  function attempt(action) {
    try {
      action();
      return true;
    } catch (error) {
      report(
        `Could not save or load data. Existing data has been kept. ${error.message}`,
        true
      );
      return false;
    }
  }

  function requestCloudSync() {
    window.ExcedereProjectsCloudSync?.();
  }

  function mutate(action) {
    if (!attempt(action)) return false;

    report('Saved.');
    refresh();
    requestCloudSync();
    return true;
  }

  const localDate = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;

  const dateLabel = value =>
    value
      ? new Date(value + 'T12:00:00').toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'No due date';

  function normaliseProjectName(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function readProjectRegistry() {
    const raw = localStorage.getItem(PROJECT_REGISTRY_KEY);

    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      report('The project registry could not be read.', true);
      return [];
    }
  }

  function writeProjectRegistry(projects) {
    if (!Array.isArray(projects)) {
      throw new Error('Project registry is invalid.');
    }

    const existing = localStorage.getItem(PROJECT_REGISTRY_KEY);

    if (existing !== null) {
      localStorage.setItem(PROJECT_REGISTRY_BACKUP_KEY, existing);
    }

    localStorage.setItem(
      PROJECT_REGISTRY_KEY,
      JSON.stringify(structuredClone(projects))
    );
  }

  function liveRegistryProjects() {
    return readProjectRegistry().filter(
      project => project && project.name && !project.deletedAt
    );
  }

  function projectNames(includeGeneral = false) {
    const names = [
      ...new Set([
        ...BUILT_IN_PROJECTS,
        ...liveRegistryProjects().map(project =>
          normaliseProjectName(project.name)
        )
      ])
    ];

    if (includeGeneral) names.push('General');

    return names;
  }

  function findRegistryProject(name) {
    const clean = normaliseProjectName(name).toLowerCase();

    return (
      liveRegistryProjects().find(
        project =>
          normaliseProjectName(project.name).toLowerCase() === clean
      ) || null
    );
  }

  function findRegistryProjectById(id) {
    return (
      liveRegistryProjects().find(project => String(project.id) === String(id)) ||
      null
    );
  }

  function addRegistryProject(project) {
    const name = normaliseProjectName(project?.name);

    if (!name) {
      throw new Error('Enter a project name.');
    }

    if (
      projectNames().some(
        existing => existing.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new Error('A project with that name already exists.');
    }

    const now = new Date().toISOString();

    const record = {
      id:
        project.id ||
        (crypto.randomUUID ? crypto.randomUUID() : `project-${Date.now()}`),

      name,

      shortName: normaliseProjectName(project.shortName || name)
        .toUpperCase()
        .slice(0, 24),

      subtitle:
        String(project.subtitle || '').trim() ||
        'Plan and manage this Excedere project.',

      focus:
        String(project.focus || '').trim() ||
        'Define the current project focus.',

      stage: String(project.stage || '').trim() || 'Planning.',

      next:
        String(project.next || '').trim() ||
        'Define the next action.',

      progress: Math.max(0, Math.min(100, Number(project.progress) || 0)),

      createdAt: project.createdAt || now,
      updatedAt: now
    };

    const registry = readProjectRegistry();
    registry.push(record);
    writeProjectRegistry(registry);

    dispatchRegistryUpdate(record);

    return record;
  }

  function dispatchRegistryUpdate(project = null) {
    window.dispatchEvent(
      new CustomEvent('excedere:projects-registry-updated', {
        detail: { project }
      })
    );
  }

  function updateRegistryProjectById(id, changes) {
    const registry = readProjectRegistry();

    const index = registry.findIndex(
      project =>
        String(project?.id) === String(id) &&
        !project?.deletedAt
    );

    if (index === -1) return null;

    registry[index] = {
      ...registry[index],
      ...structuredClone(changes),
      updatedAt: new Date().toISOString()
    };

    writeProjectRegistry(registry);
    dispatchRegistryUpdate(registry[index]);

    return registry[index];
  }

  function updateRegistryProject(name, changes) {
    const project = findRegistryProject(name);
    if (!project) return null;

    return updateRegistryProjectById(project.id, changes);
  }

  function renameProjectRecords(oldName, newName) {
    if (oldName === newName) return;

    for (const key of store.keys) {
      const records = store.read(key);
      let changed = false;

      const updated = records.map(record => {
        if (
          !record ||
          normaliseProjectName(record.project) !== oldName
        ) {
          return record;
        }

        changed = true;

        return {
          ...record,
          project: newName,
          updatedAt: new Date().toISOString()
        };
      });

      if (changed) {
        store.write(key, updated);
      }
    }
  }

  function saveExistingProject(project, data) {
    const oldName = normaliseProjectName(project.name);
    const newName = normaliseProjectName(data.name);

    if (!newName) {
      throw new Error('Enter a project name.');
    }

    const duplicate = projectNames().some(
      name =>
        name.toLowerCase() === newName.toLowerCase() &&
        name.toLowerCase() !== oldName.toLowerCase()
    );

    if (duplicate) {
      throw new Error('A project with that name already exists.');
    }

    renameProjectRecords(oldName, newName);

    return updateRegistryProjectById(project.id, {
      name: newName,

      shortName: normaliseProjectName(data.shortName || newName)
        .toUpperCase()
        .slice(0, 24),

      subtitle:
        String(data.subtitle || '').trim() ||
        'Plan and manage this Excedere project.',

      focus:
        String(data.focus || '').trim() ||
        'Define the current project focus.',

      stage: String(data.stage || '').trim() || 'Planning.',

      next:
        String(data.next || '').trim() ||
        'Define the next action.',

      progress: Math.max(0, Math.min(100, Number(data.progress) || 0))
    });
  }

  function linkedProjectRecords(projectName) {
    return readAll().filter(
      item =>
        !item.deletedAt &&
        normaliseProjectName(item.project) ===
          normaliseProjectName(projectName)
    );
  }

  function softDeleteProject(project) {
    const linked = linkedProjectRecords(project.name);

    if (linked.length) {
      throw new Error(
        `This project still contains ${linked.length} saved item${
          linked.length === 1 ? '' : 's'
        }. Delete or move those items first.`
      );
    }

    const registry = readProjectRegistry();

    const index = registry.findIndex(
      item =>
        String(item?.id) === String(project.id) &&
        !item?.deletedAt
    );

    if (index === -1) {
      throw new Error('Project could not be found.');
    }

    registry[index] = {
      ...registry[index],
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    writeProjectRegistry(registry);

    const active = window.getActiveExcedereProject?.();

    if (
      active &&
      String(active.key) === `registry:${project.id}`
    ) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, 'projects');
    }

    dispatchRegistryUpdate(null);
  }

  function seedCommercialProjects() {
    if (localStorage.getItem(COMMERCIAL_PROJECT_SEED_KEY) === '1') {
      return false;
    }

    let changed = false;
    const registry = readProjectRegistry();

    const existingNames = new Set(
      [
        ...BUILT_IN_PROJECTS,
        ...registry.map(project => normaliseProjectName(project?.name))
      ].map(name => name.toLowerCase())
    );

    for (const seed of COMMERCIAL_PROJECTS) {
      if (!existingNames.has(seed.name.toLowerCase())) {
        const now = new Date().toISOString();

        registry.push({
          ...structuredClone(seed),
          createdAt: now,
          updatedAt: now
        });

        existingNames.add(seed.name.toLowerCase());
        changed = true;
      }
    }

    if (changed) {
      writeProjectRegistry(registry);
    }

    const tasks = store.read(tasksKey);

    const marioExists = tasks.some(
      task =>
        task &&
        !task.deletedAt &&
        task.type === 'Task' &&
        normaliseProjectName(task.project) ===
          'Hey Rachel CRM Partnership' &&
        String(task.title || '').trim().toLowerCase() ===
          MARIO_TASK_TITLE.toLowerCase()
    );

    if (!marioExists) {
      store.add(tasksKey, {
        title: MARIO_TASK_TITLE,
        project: 'Hey Rachel CRM Partnership',
        priority: 'High',
        dueDate: '',
        notes:
          'Prepare a simple partnership proposal for Mario covering the free dedicated Hey Rachel CRM and Call Assist edition, no Excedere monthly software subscription, reasonable ongoing maintenance and Hey Rachel specific customisation at no charge, and third party costs such as telephony, Twilio, SMS and email remaining separate. Proposed revenue share: 5% of gross software revenue received by Excedere from CRM and Call Assist related sales for 36 months once commercial sales begin, and 10% of gross software revenue from customers Mario directly introduces. Confirm in the final proposal that the introduced customer rate is not cumulative with the 5% unless separately agreed. Exclude pass through third party charges from software revenue. Excedere retains ownership of the underlying software, source code and core platform, while Hey Rachel receives ongoing use of its branded edition. Once agreed in principle, prepare a formal signed agreement.',
        type: 'Task',
        status: 'active'
      });

      changed = true;
    }

    localStorage.setItem(COMMERCIAL_PROJECT_SEED_KEY, '1');

    if (changed) {
      dispatchRegistryUpdate();
    }

    return changed;
  }

  window.ExcedereProjectRegistry = {
    read: readProjectRegistry,
    names: projectNames,
    findByName: findRegistryProject,
    add: addRegistryProject,
    update: updateRegistryProject
  };

  const views = {};

  for (const name of ['Ideas', 'Calendar', 'Completed', 'Settings']) {
    const nav = [...document.querySelectorAll('.nav-item')].find(button =>
      button.textContent.trim().endsWith(name)
    );

    if (!nav) continue;

    nav.id = `${name.toLowerCase()}Nav`;

    const view = el('main', undefined, 'main-content');
    view.id = `${name.toLowerCase()}View`;
    view.style.display = 'none';

    const header = el('header', undefined, 'topbar');
    const heading = el('div');

    heading.append(
      el('p', 'EXCEDERE WORKSPACE', 'eyebrow'),
      el('h1', name)
    );

    header.append(heading);

    const panel = el('section', undefined, 'panel');

    view.append(header, panel);

    document.querySelector('.app-shell')?.append(view);

    nav.addEventListener('click', () => {
      refresh();
      showView(view, nav);
    });

    views[name] = {
      view,
      header,
      panel
    };
  }

  const dialog = el('dialog', undefined, 'editor-dialog');
  document.body.append(dialog);

  function activeProjectName() {
    return window.getActiveExcedereProject?.().name || 'Excedere Projects';
  }

  function projectField(form, label, name, value = '', kind = 'input') {
    const wrap = el('label', label);
    const input = el(kind);

    input.name = name;
    input.value = value ?? '';

    wrap.append(input);
    form.append(wrap);

    return input;
  }

  function editProject(project = null) {
    dialog.replaceChildren();

    const editing = Boolean(project);

    const form = el('form');

    form.append(
      el('h2', editing ? 'Edit project' : 'Add project')
    );

    const nameInput = projectField(
      form,
      'Project name',
      'name',
      project?.name || ''
    );

    nameInput.required = true;
    nameInput.maxLength = 120;

    const shortInput = projectField(
      form,
      'Short name',
      'shortName',
      project?.shortName || ''
    );

    shortInput.maxLength = 24;

    projectField(
      form,
      'Description',
      'subtitle',
      project?.subtitle || '',
      'textarea'
    );

    projectField(
      form,
      'Current focus',
      'focus',
      project?.focus || '',
      'textarea'
    );

    projectField(
      form,
      'Current stage',
      'stage',
      project?.stage || ''
    );

    projectField(
      form,
      'Next action',
      'next',
      project?.next || '',
      'textarea'
    );

    const progress = projectField(
      form,
      'Progress (0 to 100)',
      'progress',
      String(project?.progress ?? 0)
    );

    progress.type = 'number';
    progress.min = '0';
    progress.max = '100';
    progress.step = '1';

    const actions = el('div', undefined, 'item-actions');

    const save = el(
      'button',
      editing ? 'Save Changes' : 'Save Project',
      'capture-button'
    );

    save.type = 'submit';

    actions.append(
      button('Cancel', () => dialog.close()),
      save
    );

    form.append(actions);
    dialog.append(form);

    form.addEventListener('submit', event => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(form));
      data.name = normaliseProjectName(data.name);

      if (!data.name) {
        nameInput.setCustomValidity('Enter a project name.');
        nameInput.reportValidity();
        return;
      }

      const success = mutate(() => {
        if (editing) {
          saveExistingProject(project, data);
        } else {
          addRegistryProject(data);
        }
      });

      if (success) {
        dialog.close();
      }
    });

    nameInput.addEventListener('input', () =>
      nameInput.setCustomValidity('')
    );

    dialog.showModal();
    nameInput.focus();
  }

  function showDeleteProject(project) {
    const linked = linkedProjectRecords(project.name);

    dialog.replaceChildren(
      el('h2', 'Delete project?')
    );

    if (linked.length) {
      dialog.append(
        el(
          'p',
          `"${project.name}" still contains ${linked.length} saved item${
            linked.length === 1 ? '' : 's'
          }. Delete or move those items first so no work becomes orphaned.`,
          'subtitle'
        )
      );

      const actions = el('div', undefined, 'item-actions');

      actions.append(
        button('Close', () => dialog.close())
      );

      dialog.append(actions);
      dialog.showModal();
      return;
    }

    dialog.append(
      el(
        'p',
        `Remove "${project.name}" from Excedere Projects? This project currently has no saved tasks, notes, milestones or ideas.`,
        'subtitle'
      )
    );

    const actions = el('div', undefined, 'item-actions');

    actions.append(
      button('Cancel', () => dialog.close()),

      button('Delete Project', () => {
        if (
          mutate(() => {
            softDeleteProject(project);
          })
        ) {
          dialog.close();

          document
            .getElementById('projectsNav')
            ?.click();
        }
      })
    );

    dialog.append(actions);
    dialog.showModal();
  }

  function editItem(
    key,
    item = null,
    type = 'Task',
    project = activeProjectName()
  ) {
    dialog.replaceChildren();

    const form = el('form');

    form.append(
      el(
        'h2',
        item
          ? `Edit ${type.toLowerCase()}`
          : `Add ${type.toLowerCase()}`
      )
    );

    function field(label, name, value, kind = 'input', options = []) {
      const wrap = el('label', label);
      const input = el(kind);

      input.name = name;

      if (kind === 'select') {
        options.forEach(value => {
          const option = el('option', value);
          option.value = value;
          input.append(option);
        });
      }

      if (name === 'dueDate') {
        input.type = 'date';
      }

      if (name === 'title') {
        input.required = true;
        input.maxLength = 500;
      }

      input.value = value || '';

      wrap.append(input);
      form.append(wrap);

      return input;
    }

    const nameInput = field('Title', 'title', item?.title);

    if (type === 'Task' || type === 'Idea') {
      field(
        'Project',
        'project',
        item?.project || project,
        'select',
        projectNames(true)
      );
    }

    if (type === 'Task') {
      field(
        'Priority',
        'priority',
        item?.priority || 'Normal',
        'select',
        ['Low', 'Normal', 'High', 'Urgent']
      );
    }

    if (type === 'Task' || type === 'Milestone') {
      field(
        'Due date (optional)',
        'dueDate',
        item?.dueDate
      );
    }

    field(
      type === 'Note' ? 'Note' : 'Notes (optional)',
      'notes',
      item?.notes,
      'textarea'
    );

    const actions = el('div', undefined, 'item-actions');

    const save = el('button', 'Save', 'capture-button');
    save.type = 'submit';

    actions.append(
      button('Cancel', () => dialog.close()),
      save
    );

    form.append(actions);
    dialog.append(form);

    form.addEventListener('submit', event => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(form));
      data.title = data.title.trim();

      if (!data.title) {
        nameInput.setCustomValidity('Enter a title.');
        nameInput.reportValidity();
        return;
      }

      const record = {
        ...data,
        type,
        project: data.project || project
      };

      const success = mutate(() =>
        item
          ? store.change(key, item.id, record)
          : store.add(key, record)
      );

      if (success) {
        dialog.close();
      }
    });

    nameInput.addEventListener('input', () =>
      nameInput.setCustomValidity('')
    );

    dialog.showModal();
    nameInput.focus();
  }

  function capture() {
    dialog.replaceChildren(
      el('h2', 'Quick Capture'),
      el('p', 'Capture a task or an idea.', 'subtitle')
    );

    const actions = el('div', undefined, 'item-actions');

    actions.append(
      button('Task', () => {
        dialog.close();
        editItem(capturesKey, null, 'Task', activeProjectName());
      }),

      button('Idea', () => {
        dialog.close();
        editItem(capturesKey, null, 'Idea', activeProjectName());
      }),

      button('Cancel', () => dialog.close())
    );

    dialog.append(actions);
    dialog.showModal();
  }

  $('captureButton')?.addEventListener('click', capture);
  $('tasksCaptureButton')?.addEventListener('click', capture);

  $('addProjectTask')?.addEventListener('click', () =>
    editItem(tasksKey, null, 'Task', activeProjectName())
  );

  views.Ideas?.header.append(
    button(
      '+ Add Idea',
      () =>
        editItem(
          capturesKey,
          null,
          'Idea',
          activeProjectName()
        ),
      'capture-button'
    )
  );

  const projectsHeading = document.querySelector(
    '#projectsView .panel-heading'
  );

  if (
    projectsHeading &&
    !document.getElementById('addProjectButton')
  ) {
    const addProjectButton = button(
      '+ Add Project',
      () => editProject(),
      'capture-button'
    );

    addProjectButton.id = 'addProjectButton';

    projectsHeading.append(addProjectButton);
  }

  const projectWorkspaceHeading = document.querySelector(
    '#projectWorkspaceView .panel-heading'
  );

  let projectAdminActions = null;
  let editProjectButton = null;
  let deleteProjectButton = null;

  if (projectWorkspaceHeading) {
    projectAdminActions = document.getElementById(
      'projectAdminActions'
    );

    if (!projectAdminActions) {
      projectAdminActions = el(
        'div',
        undefined,
        'item-actions'
      );

      projectAdminActions.id =
        'projectAdminActions';

      editProjectButton = button(
        'Edit Project',
        () => {
          const project = findRegistryProject(
            activeProjectName()
          );

          if (project) {
            editProject(project);
          }
        }
      );

      deleteProjectButton = button(
        'Delete Project',
        () => {
          const project = findRegistryProject(
            activeProjectName()
          );

          if (project) {
            showDeleteProject(project);
          }
        }
      );

      projectAdminActions.append(
        editProjectButton,
        deleteProjectButton
      );

      projectWorkspaceHeading.append(
        projectAdminActions
      );
    }
  }

  function refreshProjectAdmin() {
    if (!projectAdminActions) return;

    const project = findRegistryProject(
      activeProjectName()
    );

    projectAdminActions.style.display =
      project ? 'flex' : 'none';
  }

  const milestonesGrid = document.querySelector(
    '#milestonesView .project-grid'
  );

  const notesGrid = document.querySelector(
    '#projectNotesView .project-grid'
  );

  document
    .querySelector('#milestonesView .panel-heading')
    ?.append(
      button(
        '+ Add Milestone',
        () =>
          editItem(
            milestonesKey,
            null,
            'Milestone',
            activeProjectName()
          ),
        'capture-button'
      )
    );

  document
    .querySelector('#projectNotesView .panel-heading')
    ?.append(
      button(
        '+ Add Note',
        () =>
          editItem(
            notesKey,
            null,
            'Note',
            activeProjectName()
          ),
        'capture-button'
      )
    );

  function readAll() {
    return store.keys.flatMap(key => {
      try {
        return store.read(key).map(item => ({
          ...item,
          key
        }));
      } catch (error) {
        report(
          `A saved list could not be read (${key}). It has not been overwritten.`,
          true
        );

        return [];
      }
    });
  }

  function row(item, compact = false) {
    const card = el(
      'article',
      undefined,
      'project-card record-card'
    );

    card.dataset.itemId = item.id;

    card.append(el('h3', item.title));

    card.append(
      el(
        'p',
        `${item.project} · ${item.type}${
          item.priority ? ` · ${item.priority}` : ''
        }`,
        'item-meta'
      )
    );

    if (item.notes) {
      card.append(
        el('p', item.notes, 'record-notes')
      );
    }

    if (
      item.type === 'Task' ||
      item.type === 'Milestone'
    ) {
      card.append(
        el(
          'small',
          dateLabel(item.dueDate),
          'subtitle'
        )
      );
    }

    if (item.completedAt) {
      card.append(
        el(
          'small',
          `Completed ${new Date(
            item.completedAt
          ).toLocaleString()}`,
          'subtitle'
        )
      );
    }

    if (compact) return card;

    const actions = el(
      'div',
      undefined,
      'item-actions'
    );

    if (item.deletedAt) {
      actions.append(
        button('Restore', () =>
          mutate(() =>
            store.change(item.key, item.id, {
              deletedAt: null
            })
          )
        )
      );
    } else {
      actions.append(
        button('Edit', () =>
          editItem(
            item.key,
            item,
            item.type,
            item.project
          )
        )
      );

      if (
        ['Task', 'Milestone'].includes(
          item.type
        )
      ) {
        actions.append(
          button(
            item.status === 'completed'
              ? 'Reopen'
              : 'Complete',

            () =>
              mutate(() =>
                store.change(
                  item.key,
                  item.id,
                  item.status === 'completed'
                    ? {
                        status: 'active',
                        completedAt: null
                      }
                    : {
                        status: 'completed',
                        completedAt:
                          new Date().toISOString()
                      }
                )
              )
          )
        );
      }

      actions.append(
        button('Delete', () => {
          dialog.replaceChildren(
            el('h2', 'Delete this item?'),

            el(
              'p',
              `Move "${item.title}" to Recently deleted? You can restore it in Settings.`,
              'subtitle'
            )
          );

          const controls = el(
            'div',
            undefined,
            'item-actions'
          );

          controls.append(
            button('Cancel', () =>
              dialog.close()
            ),

            button(
              'Move to Recently deleted',
              () => {
                if (
                  mutate(() =>
                    store.change(
                      item.key,
                      item.id,
                      {
                        deletedAt:
                          new Date().toISOString()
                      }
                    )
                  )
                ) {
                  dialog.close();
                }
              }
            )
          );

          dialog.append(controls);
          dialog.showModal();
        })
      );
    }

    card.append(actions);
    return card;
  }

  function list(
    target,
    items,
    empty = 'Nothing here yet.'
  ) {
    if (!target) return;

    target.replaceChildren();

    if (!items.length) {
      target.append(
        el('p', empty, 'empty-state')
      );

      return;
    }

    items.forEach(item =>
      target.append(row(item))
    );
  }

  function editFocus(
    key,
    textId,
    label,
    progress = false
  ) {
    const activeName =
      activeProjectName();

    const registryProject =
      findRegistryProject(activeName);

    dialog.replaceChildren(
      el('h2', label)
    );

    const form = el('form');

    const wrap = el(
      'label',
      progress
        ? 'Progress (0 to 100)'
        : 'Value'
    );

    const input = el('input');

    input.required = true;

    const registryField =
      key === 'excedereCurrentFocus'
        ? 'focus'
        : key === 'excedereCurrentStage'
        ? 'stage'
        : key === 'excedereNextAction'
        ? 'next'
        : key === 'excedereOverallProgress'
        ? 'progress'
        : null;

    input.value =
      registryProject && registryField
        ? registryProject[registryField] ?? ''
        : progress
        ? parseInt(
            $('overallProgressText')
              ?.textContent || '0'
          )
        : $(textId)?.textContent || '';

    if (progress) {
      input.type = 'number';
      input.min = '0';
      input.max = '100';
      input.step = '1';
    }

    wrap.append(input);

    const controls = el(
      'div',
      undefined,
      'item-actions'
    );

    const save = el(
      'button',
      'Save',
      'capture-button'
    );

    save.type = 'submit';

    controls.append(
      button('Cancel', () =>
        dialog.close()
      ),
      save
    );

    form.append(wrap, controls);
    dialog.append(form);

    form.addEventListener('submit', event => {
      event.preventDefault();

      const value = input.value.trim();

      if (!value && !progress) {
        input.setCustomValidity(
          'Enter a value.'
        );

        input.reportValidity();
        return;
      }

      const success = mutate(() => {
        if (
          registryProject &&
          registryField
        ) {
          updateRegistryProjectById(
            registryProject.id,
            {
              [registryField]: progress
                ? Number(value)
                : value
            }
          );
        } else {
          localStorage.setItem(key, value);

          if (!progress && $(textId)) {
            $(textId).textContent =
              value;
          }
        }
      });

      if (success) {
        dialog.close();
      }
    });

    input.addEventListener('input', () =>
      input.setCustomValidity('')
    );

    dialog.showModal();
    input.focus();
  }

  function focusSetup() {
    for (const [key, textId, editId, label] of [
      [
        'excedereCurrentFocus',
        'currentFocusText',
        'editCurrentFocus',
        'What are you working on now?'
      ],
      [
        'excedereCurrentStage',
        'currentStageText',
        'editCurrentStage',
        'What stage is the project currently at?'
      ],
      [
        'excedereNextAction',
        'nextActionText',
        'editNextAction',
        'What is the next action?'
      ]
    ]) {
      $(editId)?.addEventListener(
        'click',
        () =>
          editFocus(
            key,
            textId,
            label
          )
      );
    }

    $('editOverallProgress')?.addEventListener(
      'click',
      () =>
        editFocus(
          'excedereOverallProgress',
          null,
          'Overall Progress',
          true
        )
    );
  }

  attempt(() => {
    if (
      localStorage.getItem(
        milestonesKey
      ) === null &&
      milestonesGrid
    ) {
      store.write(
        milestonesKey,
        [
          ...milestonesGrid.querySelectorAll(
            '.project-card'
          )
        ].map((card, i) => ({
          id: `roadmap-${i}`,
          title:
            card.querySelector('h3')
              ?.textContent ||
            `Milestone ${i + 1}`,
          notes:
            card.querySelector('p')
              ?.textContent || '',
          type: 'Milestone',
          project: 'Excedere Projects',
          status:
            card.querySelector(
              '.project-footer strong'
            )?.textContent ===
            'Complete'
              ? 'completed'
              : 'active'
        }))
      );
    }

    const raw =
      localStorage.getItem(tasksKey);

    if (raw !== null) {
      const tasks =
        store.read(tasksKey);

      if (
        JSON.stringify(tasks) !== raw
      ) {
        store.write(
          tasksKey,
          tasks
        );
      }
    }
  });

  attempt(() => {
    if (
      !localStorage.getItem(
        'excedereSeedTasksV1'
      )
    ) {
      const tasks =
        store.read(tasksKey);

      [
        ...(
          $('projectTasksGrid')
            ?.querySelectorAll(
              '.project-card'
            ) || []
        )
      ].forEach((card, i) => {
        if (
          !tasks.some(
            task =>
              task.id ===
              `starter-${i}`
          )
        ) {
          tasks.push({
            id: `starter-${i}`,
            title:
              card.querySelector('h3')
                ?.textContent ||
              `Starter task ${i + 1}`,
            notes:
              card.querySelector('p')
                ?.textContent || '',
            type: 'Task',
            project:
              'Excedere Projects',
            status: 'active'
          });
        }
      });

      store.write(
        tasksKey,
        tasks
      );

      localStorage.setItem(
        'excedereSeedTasksV1',
        '1'
      );
    }
  });

  attempt(() =>
    seedCommercialProjects()
  );

  setTimeout(
    requestCloudSync,
    0
  );

  window.addEventListener(
    'load',
    requestCloudSync,
    {
      once: true
    }
  );

  focusSetup();

  const taskFilter = el('select');

  taskFilter.setAttribute(
    'aria-label',
    'Filter tasks by project'
  );

  function rebuildTaskFilter() {
    const previous =
      taskFilter.value ||
      'All projects';

    taskFilter.replaceChildren();

    [
      'All projects',
      ...projectNames(true)
    ].forEach(name => {
      const option = el(
        'option',
        name
      );

      option.value = name;

      taskFilter.append(option);
    });

    taskFilter.value = [
      ...taskFilter.options
    ].some(
      option =>
        option.value === previous
    )
      ? previous
      : 'All projects';
  }

  rebuildTaskFilter();

  document
    .querySelector(
      '#tasksView .panel-heading'
    )
    ?.append(taskFilter);

  taskFilter.addEventListener(
    'change',
    refresh
  );

  const monthInput = el('input');

  monthInput.type = 'month';
  monthInput.value =
    localDate().slice(0, 7);

  monthInput.setAttribute(
    'aria-label',
    'Calendar month'
  );

  views.Calendar?.header.append(
    monthInput
  );

  monthInput.addEventListener(
    'change',
    refresh
  );

  views.Settings?.panel.append(
    el('h2', 'Your data'),

    el(
      'p',
      'Saved locally and synced to your Excedere Projects cloud workspace when signed in. Export a backup before clearing browser data or changing devices.',
      'subtitle'
    )
  );

  views.Settings?.panel.append(
    button('Export backup', () =>
      attempt(() => {
        const data = {};

        for (
          let i = 0;
          i < localStorage.length;
          i++
        ) {
          const key =
            localStorage.key(i);

          if (
            key?.startsWith(
              'excedere'
            )
          ) {
            data[key] =
              localStorage.getItem(
                key
              );
          }
        }

        const url =
          URL.createObjectURL(
            new Blob(
              [
                JSON.stringify(
                  {
                    format:
                      'excedere-backup',
                    version: 1,
                    data
                  },
                  null,
                  2
                )
              ],
              {
                type:
                  'application/json'
              }
            )
          );

        const a = el('a');

        a.href = url;

        a.download =
          `excedere-backup-${localDate()}.json`;

        a.click();

        setTimeout(
          () =>
            URL.revokeObjectURL(
              url
            ),
          1000
        );
      })
    )
  );

  const deletedHeading = el(
    'h2',
    'Recently deleted'
  );

  deletedHeading.className =
    'settings-heading';

  const deletedList = el(
    'div',
    undefined,
    'record-list'
  );

  views.Settings?.panel.append(
    deletedHeading,
    deletedList
  );

  function refresh() {
    const all = readAll();

    const live = all.filter(
      item => !item.deletedAt
    );

    const active = live.filter(
      item =>
        item.status !== 'completed'
    );

    const tasks = active.filter(
      item =>
        item.type === 'Task'
    );

    const ideas = active.filter(
      item =>
        item.type === 'Idea'
    );

    const activeName =
      activeProjectName();

    list(
      $('allTasksList'),
      tasks.filter(
        item =>
          taskFilter.value ===
            'All projects' ||
          item.project ===
            taskFilter.value
      ),
      'No open tasks for this selection. Use Quick Capture to add one.'
    );

    list(
      $('projectTasksGrid'),
      tasks.filter(
        item =>
          item.project ===
          activeName
      ),
      `No open tasks for ${activeName}. Add one or reopen completed work.`
    );

    list(
      milestonesGrid,
      live.filter(
        item =>
          item.type ===
            'Milestone' &&
          item.project ===
            activeName
      ),
      `No milestones for ${activeName} yet.`
    );

    list(
      notesGrid,
      live.filter(
        item =>
          item.type === 'Note' &&
          item.project ===
            activeName
      ),
      `No notes for ${activeName} yet.`
    );

    list(
      views.Ideas?.panel,
      ideas,
      'No ideas yet. Capture one when inspiration strikes.'
    );

    list(
      views.Completed?.panel,
      live
        .filter(
          item =>
            item.status ===
            'completed'
        )
        .sort(
          (a, b) =>
            (
              b.completedAt || ''
            ).localeCompare(
              a.completedAt || ''
            )
        ),
      'Completed tasks and milestones will appear here.'
    );

    list(
      deletedList,
      all.filter(
        item =>
          item.deletedAt
      ),
      'No deleted items.'
    );

    const today = localDate();
    const next = new Date();

    next.setDate(
      next.getDate() + 7
    );

    const counts = [
      tasks.filter(
        item =>
          item.dueDate === today
      ).length,

      tasks.filter(
        item =>
          item.dueDate &&
          item.dueDate < today
      ).length,

      tasks.filter(
        item =>
          item.dueDate > today &&
          item.dueDate <=
            localDate(next)
      ).length,

      ideas.length
    ];

    document
      .querySelectorAll(
        '.stat-card strong'
      )
      .forEach((node, i) => {
        if (
          counts[i] !== undefined
        ) {
          node.textContent =
            counts[i];
        }
      });

    const firstStatSmall =
      document.querySelector(
        '.stat-card small'
      );

    if (firstStatSmall) {
      firstStatSmall.textContent =
        'Tasks due today';
    }

    const priority =
      document.querySelector(
        '.priority-panel .task-list'
      );

    if (priority) {
      const rank = {
        Urgent: 0,
        High: 1,
        Normal: 2,
        Low: 3
      };

      priority.replaceChildren();

      [...tasks]
        .sort(
          (a, b) =>
            (
              a.dueDate ||
              '9999'
            ).localeCompare(
              b.dueDate ||
              '9999'
            ) ||
            (rank[a.priority] ?? 2) -
              (rank[b.priority] ??
                2)
        )
        .slice(0, 5)
        .forEach(item => {
          const row =
            el(
              'div',
              undefined,
              'task-row'
            );

          const info =
            el(
              'div',
              undefined,
              'task-info'
            );

          info.append(
            el(
              'strong',
              item.title
            ),
            el(
              'small',
              item.project
            )
          );

          row.append(
            el(
              'span',
              '',
              `priority-dot ${
                item.priority ===
                'Urgent'
                  ? 'red'
                  : item.priority ===
                    'High'
                  ? 'amber'
                  : 'green'
              }`
            ),
            info,
            el(
              'span',
              item.dueDate
                ? dateLabel(
                    item.dueDate
                  )
                : item.priority ||
                    'Active',
              'task-status'
            )
          );

          priority.append(row);
        });

      if (!tasks.length) {
        priority.append(
          el(
            'p',
            'No open tasks. Enjoy the breathing room.',
            'empty-state'
          )
        );
      }
    }

    const ideaBox =
      document.querySelector(
        '.idea-box'
      );

    if (ideaBox) {
      ideaBox.replaceChildren();

      ideas
        .slice(-3)
        .reverse()
        .forEach(item =>
          ideaBox.append(
            row(item, true)
          )
        );

      if (!ideas.length) {
        ideaBox.append(
          el(
            'p',
            'Capture an idea now and decide what to do with it later.'
          )
        );
      }
    }

    const events = active
      .filter(
        item =>
          [
            'Task',
            'Milestone'
          ].includes(
            item.type
          ) &&
          item.dueDate?.startsWith(
            monthInput.value
          )
      )
      .sort((a, b) =>
        a.dueDate.localeCompare(
          b.dueDate
        )
      );

    list(
      views.Calendar?.panel,
      events,
      'No dated tasks or milestones this month. Set a due date when adding or editing one.'
    );

    const taskFooter =
      $('projectTasksCard')
        ?.querySelector(
          '.project-footer span'
        );

    if (taskFooter) {
      taskFooter.textContent =
        `${
          tasks.filter(
            item =>
              item.project ===
              activeName
          ).length
        } open tasks`;
    }

    const projectMilestones =
      live.filter(
        item =>
          item.type ===
            'Milestone' &&
          item.project ===
            activeName
      );

    const milestoneFooter =
      $('milestonesCard')
        ?.querySelector(
          '.project-footer span'
        );

    if (milestoneFooter) {
      milestoneFooter.textContent =
        `${
          projectMilestones.filter(
            item =>
              item.status ===
              'completed'
          ).length
        } of ${
          projectMilestones.length
        } complete`;
    }

    const notesFooter =
      $('projectNotesCard')
        ?.querySelector(
          '.project-footer span'
        );

    if (notesFooter) {
      notesFooter.textContent =
        `${
          live.filter(
            item =>
              item.type ===
                'Note' &&
              item.project ===
                activeName
          ).length
        } notes`;
    }

    refreshProjectAdmin();

    attempt(() => {
      const registryProject =
        findRegistryProject(
          activeName
        );

      const saved =
        localStorage.getItem(
          'excedereOverallProgress'
        );

      const progress =
        registryProject
          ? Math.max(
              0,
              Math.min(
                100,
                Number(
                  registryProject.progress
                ) || 0
              )
            )
          : saved !== null &&
            Number.isFinite(
              Number(saved)
            )
          ? Math.max(
              0,
              Math.min(
                100,
                Number(saved)
              )
            )
          : 40;

      if (
        $('overallProgressBar')
      ) {
        $('overallProgressBar').style.width =
          `${progress}%`;
      }

      if (
        $('overallProgressText')
      ) {
        $('overallProgressText').textContent =
          `${progress}% complete`;
      }
    });
  }

  document
    .querySelectorAll(
      '#currentFocusCard,#projectTasksCard,#milestonesCard,#projectNotesCard,#excedereProjectsCard'
    )
    .forEach(card => {
      card.tabIndex = 0;

      card.setAttribute(
        'role',
        'button'
      );

      card.addEventListener(
        'keydown',
        event => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault();
            card.click();
          }
        }
      );
    });

  document
    .querySelector(
      '.priority-panel .text-button'
    )
    ?.addEventListener(
      'click',
      () =>
        $('tasksNav')?.click()
    );

  document
    .querySelector(
      '.ideas-panel .text-button'
    )
    ?.addEventListener(
      'click',
      () =>
        $('ideasNav')?.click()
    );

  document
    .querySelector(
      '.projects-section .text-button'
    )
    ?.addEventListener(
      'click',
      () =>
        $('projectsNav')?.click()
    );

  $('tasksNav')?.addEventListener(
    'click',
    () => {
      taskFilter.value =
        'All projects';

      refresh();
    }
  );

  $('todayNav')?.addEventListener(
    'click',
    refresh
  );

  window.addEventListener(
    'excedere:project-change',
    () => {
      refresh();
      refreshProjectAdmin();
    }
  );

  window.addEventListener(
    'excedere:projects-registry-updated',
    () => {
      rebuildTaskFilter();
      refresh();
      refreshProjectAdmin();
    }
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      if (
        !document.hidden &&
        !dialog.open
      ) {
        refresh();
      }
    }
  );

  window.renderProjectTasksForProject =
    () => refresh();

  window.renderProjectNotesForProject =
    () => refresh();

  window.refreshExcedere =
    refresh;

  window.addEventListener(
    'storage',
    () => {
      if (!dialog.open) {
        rebuildTaskFilter();
        refresh();
      }
    }
  );

  refresh();
})();
