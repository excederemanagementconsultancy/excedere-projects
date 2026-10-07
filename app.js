const tasksNav =
  document.getElementById("tasksNav");

const dashboardView =
  document.getElementById("dashboardView");

const tasksView =
  document.getElementById("tasksView");


function renderTasksPage() {
  window.refreshExcedere?.();
}


// =====================================================
// EXCEDERE PROJECTS - MAIN NAVIGATION
// =====================================================

const todayNav =
  document.getElementById("todayNav");

const projectsNav =
  document.getElementById("projectsNav");

const projectsView =
  document.getElementById("projectsView");

const projectWorkspaceView =
  document.getElementById(
    "projectWorkspaceView"
  );

const currentFocusView =
  document.getElementById(
    "currentFocusView"
  );

const projectTasksView =
  document.getElementById(
    "projectTasksView"
  );

const milestonesView =
  document.getElementById(
    "milestonesView"
  );

const projectNotesView =
  document.getElementById(
    "projectNotesView"
  );


const currentFocusCard =
  document.getElementById(
    "currentFocusCard"
  );

const projectTasksCard =
  document.getElementById(
    "projectTasksCard"
  );

const milestonesCard =
  document.getElementById(
    "milestonesCard"
  );

const projectNotesCard =
  document.getElementById(
    "projectNotesCard"
  );


const backToProjects =
  document.getElementById(
    "backToProjects"
  );

const backToWorkspace =
  document.getElementById(
    "backToWorkspace"
  );

const backFromProjectTasks =
  document.getElementById(
    "backFromProjectTasks"
  );

const backFromMilestones =
  document.getElementById(
    "backFromMilestones"
  );

const backFromProjectNotes =
  document.getElementById(
    "backFromProjectNotes"
  );


const currentFocusText =
  document.getElementById(
    "currentFocusText"
  );

const currentStageText =
  document.getElementById(
    "currentStageText"
  );

const nextActionText =
  document.getElementById(
    "nextActionText"
  );

const overallProgressBar =
  document.getElementById(
    "overallProgressBar"
  );

const overallProgressText =
  document.getElementById(
    "overallProgressText"
  );


const projectTasksGrid =
  document.getElementById(
    "projectTasksGrid"
  );


// =====================================================
// PROJECT STORAGE
// =====================================================

const PROJECT_REGISTRY_KEY =
  "excedereProjectRegistryV1";

const ACTIVE_PROJECT_KEY =
  "excedereActiveProjectWorkspace";


// =====================================================
// BUILT-IN PROJECTS
// =====================================================

const BUILT_IN_PROJECTS = {

  projects: {
    name:
      "Excedere Projects",

    shortName:
      "PROJECTS",

    subtitle:
      "Plan, build and track the Excedere ecosystem.",

    focus:
      "Build and improve the Excedere project management platform.",

    stage:
      "Workspace structure, navigation and project intelligence.",

    next:
      "Continue improving the Projects platform and connected Excedere ecosystem.",

    progress:
      40
  },


  crm: {
    name:
      "Excedere CRM",

    shortName:
      "CRM",

    subtitle:
      "Manage prospects, customers, communication and sales activity.",

    focus:
      "Continue building the connected CRM and Call Assist sales workspace.",

    stage:
      "Core CRM, Smart Follow-Up and Dialer V1 are operational.",

    next:
      "Prepare the Multi-Provider Communication Framework.",

    progress:
      10
  },


  flow: {
    name:
      "Excedere Flow",

    shortName:
      "FLOW",

    subtitle:
      "Plan work, organize priorities and keep activity moving.",

    focus:
      "Continue developing the simple Excedere planning and workflow experience.",

    stage:
      "Today, Tasks, Projects and Calendar navigation are operational.",

    next:
      "Improve workflow automation and project integration.",

    progress:
      25
  },


  website: {
    name:
      "Excedere Website",

    shortName:
      "WEBSITE",

    subtitle:
      "Manage the public Excedere consultancy website and digital presence.",

    focus:
      "Improve visibility, search performance and conversion opportunities.",

    stage:
      "Core website, branding and consultation booking are live.",

    next:
      "Complete the next SEO and website visibility improvements.",

    progress:
      75
  }

};


// =====================================================
// REGISTRY HELPERS
// =====================================================

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
      ? parsed.filter(
          project =>
            project &&
            !project.deletedAt &&
            project.name
        )
      : [];

  } catch (error) {

    console.warn(
      "Project registry could not be read.",
      error
    );

    return [];
  }
}


function registryProjectKey(project) {

  return (
    `registry:${project.id}`
  );
}


function getAllProjectEntries() {

  const builtIns =
    Object.entries(
      BUILT_IN_PROJECTS
    ).map(
      ([key, project]) => ({
        key,
        project,
        builtIn:
          true
      })
    );

  const registry =
    readProjectRegistry()
      .map(
        project => ({
          key:
            registryProjectKey(
              project
            ),

          project,

          builtIn:
            false
        })
      );

  return [
    ...builtIns,
    ...registry
  ];
}


function getProjectEntryByKey(
  key
) {

  return (
    getAllProjectEntries()
      .find(
        entry =>
          entry.key === key
      ) ||
    null
  );
}


function getProjectEntryByName(
  name
) {

  const clean =
    String(
      name || ""
    )
      .trim()
      .toLowerCase();

  if (!clean) {
    return null;
  }

  return (
    getAllProjectEntries()
      .find(
        entry =>
          String(
            entry.project.name ||
            ""
          )
            .trim()
            .toLowerCase() ===
          clean
      ) ||
    null
  );
}


// =====================================================
// ACTIVE PROJECT
// =====================================================

let activeProjectKey =
  localStorage.getItem(
    ACTIVE_PROJECT_KEY
  ) ||
  "projects";


function ensureActiveProject() {

  if (
    !getProjectEntryByKey(
      activeProjectKey
    )
  ) {

    activeProjectKey =
      "projects";

    localStorage.setItem(
      ACTIVE_PROJECT_KEY,
      activeProjectKey
    );
  }
}


function getActiveProjectEntry() {

  ensureActiveProject();

  return (
    getProjectEntryByKey(
      activeProjectKey
    ) ||
    {
      key:
        "projects",

      project:
        BUILT_IN_PROJECTS
          .projects,

      builtIn:
        true
    }
  );
}


function getActiveProject() {

  return (
    getActiveProjectEntry()
      .project
  );
}


function setActiveProject(
  key
) {

  const entry =
    getProjectEntryByKey(
      key
    );

  activeProjectKey =
    entry
      ? entry.key
      : "projects";

  localStorage.setItem(
    ACTIVE_PROJECT_KEY,
    activeProjectKey
  );

  window.excedereActiveProject =
    activeProjectKey;

  applyActiveProject();

  window.dispatchEvent(
    new CustomEvent(
      "excedere:project-change",
      {
        detail: {
          key:
            activeProjectKey,

          project:
            getActiveProject()
        }
      }
    )
  );
}


window.getActiveExcedereProject =
  function () {

    const entry =
      getActiveProjectEntry();

    return {
      key:
        entry.key,

      ...entry.project
    };
  };


// =====================================================
// VIEW HELPERS
// =====================================================

function hideMainViews() {

  document
    .querySelectorAll(
      "main.main-content"
    )
    .forEach(
      view => {
        view.style.display =
          "none";
      }
    );
}


function setActiveNav(
  activeNav
) {

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      item => {
        item.classList.remove(
          "active"
        );
      }
    );

  if (activeNav) {

    activeNav.classList.add(
      "active"
    );
  }
}


function showView(
  view,
  activeNav = null
) {

  if (!view) {
    return;
  }

  hideMainViews();

  view.style.display =
    "block";

  if (activeNav) {
    setActiveNav(
      activeNav
    );
  }

  window.scrollTo(
    0,
    0
  );
}


// =====================================================
// TEXT HELPERS
// =====================================================

function setText(
  element,
  value
) {

  if (element) {

    element.textContent =
      value ?? "";
  }
}


function findHeading(
  view,
  selector
) {

  if (!view) {
    return null;
  }

  return (
    view.querySelector(
      selector
    )
  );
}


function clampProgress(
  value
) {

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      number
    )
  );
}


function displayProgress(
  project
) {

  /*
   * Keep the original editable
   * Projects progress value working.
   */
  if (
    project.name ===
    "Excedere Projects"
  ) {

    const saved =
      localStorage.getItem(
        "excedereOverallProgress"
      );

    if (
      saved !== null &&
      Number.isFinite(
        Number(saved)
      )
    ) {

      return clampProgress(
        saved
      );
    }
  }

  return clampProgress(
    project.progress
  );
}


// =====================================================
// APPLY ACTIVE PROJECT
// =====================================================

function applyActiveProject() {

  const project =
    getActiveProject();

  const progress =
    displayProgress(
      project
    );


  // ---------------------------------------------------
  // MAIN PROJECT WORKSPACE
  // ---------------------------------------------------

  setText(
    findHeading(
      projectWorkspaceView,
      ".topbar .eyebrow"
    ),
    project.name
      .toUpperCase()
  );

  setText(
    findHeading(
      projectWorkspaceView,
      ".topbar h1"
    ),
    project.name
  );

  setText(
    findHeading(
      projectWorkspaceView,
      ".topbar .subtitle"
    ),
    project.subtitle
  );

  setText(
    findHeading(
      projectWorkspaceView,
      ".panel-heading h2"
    ),
    project.name
  );


  // ---------------------------------------------------
  // CURRENT FOCUS
  // ---------------------------------------------------

  setText(
    findHeading(
      currentFocusView,
      ".topbar .eyebrow"
    ),
    project.name
      .toUpperCase()
  );

  setText(
    findHeading(
      currentFocusView,
      ".topbar h1"
    ),
    "Current Focus"
  );

  setText(
    findHeading(
      currentFocusView,
      ".topbar .subtitle"
    ),
    `What we're actively building for ${project.name}.`
  );

  setText(
    findHeading(
      currentFocusView,
      ".panel-heading h2"
    ),
    project.name
  );

  setText(
    currentFocusText,
    project.focus
  );

  setText(
    currentStageText,
    project.stage
  );

  setText(
    nextActionText,
    project.next
  );

  if (
    overallProgressBar
  ) {

    overallProgressBar
      .style.width =
      `${progress}%`;
  }

  if (
    overallProgressText
  ) {

    overallProgressText
      .textContent =
      `${progress}% complete`;
  }


  // ---------------------------------------------------
  // PROJECT TASKS
  // ---------------------------------------------------

  setText(
    findHeading(
      projectTasksView,
      ".topbar .eyebrow"
    ),
    project.name
      .toUpperCase()
  );

  setText(
    findHeading(
      projectTasksView,
      ".topbar h1"
    ),
    "Project Tasks"
  );

  setText(
    findHeading(
      projectTasksView,
      ".topbar .subtitle"
    ),
    `Actions required to move ${project.name} forward.`
  );

  setText(
    findHeading(
      projectTasksView,
      ".panel-heading h2"
    ),
    project.name
  );

  if (
    projectTasksGrid
  ) {

    projectTasksGrid
      .dataset.project =
      project.name;
  }


  // ---------------------------------------------------
  // MILESTONES
  // ---------------------------------------------------

  setText(
    findHeading(
      milestonesView,
      ".topbar .eyebrow"
    ),
    project.name
      .toUpperCase()
  );

  setText(
    findHeading(
      milestonesView,
      ".topbar h1"
    ),
    "Milestones"
  );

  setText(
    findHeading(
      milestonesView,
      ".topbar .subtitle"
    ),
    `Major stages and development targets for ${project.name}.`
  );

  setText(
    findHeading(
      milestonesView,
      ".panel-heading h2"
    ),
    project.name
  );


  // ---------------------------------------------------
  // PROJECT NOTES
  // ---------------------------------------------------

  setText(
    findHeading(
      projectNotesView,
      ".topbar .eyebrow"
    ),
    project.name
      .toUpperCase()
  );

  setText(
    findHeading(
      projectNotesView,
      ".topbar h1"
    ),
    "Project Notes"
  );

  setText(
    findHeading(
      projectNotesView,
      ".topbar .subtitle"
    ),
    `Ideas, decisions and important information for ${project.name}.`
  );

  setText(
    findHeading(
      projectNotesView,
      ".panel-heading h2"
    ),
    project.name
  );


  // ---------------------------------------------------
  // BACK BUTTONS
  // ---------------------------------------------------

  if (
    backToWorkspace
  ) {

    backToWorkspace
      .textContent =
      `← Back to ${project.name}`;
  }

  if (
    backFromProjectTasks
  ) {

    backFromProjectTasks
      .textContent =
      `← Back to ${project.name}`;
  }

  if (
    backFromMilestones
  ) {

    backFromMilestones
      .textContent =
      `← Back to ${project.name}`;
  }

  if (
    backFromProjectNotes
  ) {

    backFromProjectNotes
      .textContent =
      `← Back to ${project.name}`;
  }


  /*
   * features.js owns the actual
   * task, milestone and note records.
   */
  window.refreshExcedere?.();
}


// =====================================================
// PROJECT CARDS
// =====================================================

function createProjectCard(
  entry
) {

  const project =
    entry.project;

  const progress =
    displayProgress(
      project
    );

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "project-card";

  card.dataset.projectKey =
    entry.key;

  card.tabIndex =
    0;

  card.setAttribute(
    "role",
    "button"
  );

  card.style.cursor =
    "pointer";


  const icon =
    document.createElement(
      "div"
    );

  icon.className =
    "project-icon";

  const shortName =
    String(
      project.shortName ||
      project.name ||
      "PR"
    )
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .toUpperCase();

  icon.textContent =
    shortName.slice(
      0,
      3
    );


  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    project.name;


  const description =
    document.createElement(
      "p"
    );

  description.textContent =
    project.subtitle ||
    "Excedere project workspace.";


  const progressWrap =
    document.createElement(
      "div"
    );

  progressWrap.className =
    "progress";


  const progressFill =
    document.createElement(
      "span"
    );

  progressFill.style.width =
    `${progress}%`;

  progressWrap.append(
    progressFill
  );


  const footer =
    document.createElement(
      "div"
    );

  footer.className =
    "project-footer";


  const progressText =
    document.createElement(
      "span"
    );

  progressText.textContent =
    `${progress}% complete`;


  const status =
    document.createElement(
      "strong"
    );

  status.textContent =
    progress >= 100
      ? "Complete"
      : "Active";


  footer.append(
    progressText,
    status
  );


  card.append(
    icon,
    title,
    description,
    progressWrap,
    footer
  );


  const open =
    () => {

      setActiveProject(
        entry.key
      );

      showView(
        projectWorkspaceView,
        projectsNav
      );
    };


  card.addEventListener(
    "click",
    open
  );


  card.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
          "Enter" ||
        event.key ===
          " "
      ) {

        event.preventDefault();

        open();
      }
    }
  );


  return card;
}


function renderProjectCards() {

  if (
    !projectsView
  ) {
    return;
  }

  const grid =
    projectsView.querySelector(
      ".project-grid"
    );

  if (!grid) {

    console.warn(
      "Projects grid was not found."
    );

    return;
  }

  const entries =
    getAllProjectEntries();

  grid.replaceChildren(
    ...entries.map(
      createProjectCard
    )
  );
}


// =====================================================
// DASHBOARD PROJECT CARDS
// =====================================================

function wireDashboardProjectCards() {

  document
    .querySelectorAll(
      "#dashboardView .project-card"
    )
    .forEach(
      card => {

        if (
          card.dataset
            .excedereProjectWired ===
          "1"
        ) {
          return;
        }

        const heading =
          card.querySelector(
            "h3"
          );

        if (!heading) {
          return;
        }

        const entry =
          getProjectEntryByName(
            heading.textContent
          );

        if (!entry) {
          return;
        }

        card.dataset
          .excedereProjectWired =
          "1";

        card.dataset.projectKey =
          entry.key;

        card.tabIndex =
          0;

        card.setAttribute(
          "role",
          "button"
        );

        card.style.cursor =
          "pointer";


        const open =
          () => {

            setActiveProject(
              entry.key
            );

            showView(
              projectWorkspaceView,
              projectsNav
            );
          };


        card.addEventListener(
          "click",
          open
        );


        card.addEventListener(
          "keydown",
          event => {

            if (
              event.key ===
                "Enter" ||
              event.key ===
                " "
            ) {

              event.preventDefault();

              open();
            }
          }
        );
      }
    );
}


// =====================================================
// REFRESH PROJECT DIRECTORY
// =====================================================

function refreshProjectDirectory() {

  ensureActiveProject();

  renderProjectCards();

  wireDashboardProjectCards();

  applyActiveProject();
}


window.refreshExcedereProjectDirectory =
  refreshProjectDirectory;


// =====================================================
// TODAY
// =====================================================

if (todayNav) {

  todayNav.addEventListener(
    "click",
    () => {

      showView(
        dashboardView,
        todayNav
      );

      window.refreshExcedere?.();
    }
  );
}


// =====================================================
// TASKS
// =====================================================

if (tasksNav) {

  tasksNav.addEventListener(
    "click",
    () => {

      showView(
        tasksView,
        tasksNav
      );

      renderTasksPage();
    }
  );
}


// =====================================================
// PROJECTS
// =====================================================

if (projectsNav) {

  projectsNav.addEventListener(
    "click",
    () => {

      renderProjectCards();

      showView(
        projectsView,
        projectsNav
      );
    }
  );
}


// =====================================================
// BACK TO ALL PROJECTS
// =====================================================

if (backToProjects) {

  backToProjects.addEventListener(
    "click",
    () => {

      renderProjectCards();

      showView(
        projectsView,
        projectsNav
      );
    }
  );
}


// =====================================================
// CURRENT FOCUS
// =====================================================

if (currentFocusCard) {

  currentFocusCard.addEventListener(
    "click",
    () => {

      applyActiveProject();

      showView(
        currentFocusView,
        projectsNav
      );
    }
  );
}


// =====================================================
// BACK FROM CURRENT FOCUS
// =====================================================

if (backToWorkspace) {

  backToWorkspace.addEventListener(
    "click",
    () => {

      applyActiveProject();

      showView(
        projectWorkspaceView,
        projectsNav
      );
    }
  );
}


// =====================================================
// PROJECT TASKS
// =====================================================

if (projectTasksCard) {

  projectTasksCard.addEventListener(
    "click",
    () => {

      applyActiveProject();

      showView(
        projectTasksView,
        projectsNav
      );

      window
        .renderProjectTasksForProject
        ?.(
          getActiveProject()
            .name
        );
    }
  );
}


// =====================================================
// BACK FROM PROJECT TASKS
// =====================================================

if (backFromProjectTasks) {

  backFromProjectTasks
    .addEventListener(
      "click",
      () => {

        applyActiveProject();

        showView(
          projectWorkspaceView,
          projectsNav
        );
      }
    );
}


// =====================================================
// MILESTONES
// =====================================================

if (milestonesCard) {

  milestonesCard.addEventListener(
    "click",
    () => {

      applyActiveProject();

      showView(
        milestonesView,
        projectsNav
      );

      window.refreshExcedere?.();
    }
  );
}


// =====================================================
// BACK FROM MILESTONES
// =====================================================

if (backFromMilestones) {

  backFromMilestones
    .addEventListener(
      "click",
      () => {

        applyActiveProject();

        showView(
          projectWorkspaceView,
          projectsNav
        );
      }
    );
}


// =====================================================
// PROJECT NOTES
// =====================================================

if (projectNotesCard) {

  projectNotesCard.addEventListener(
    "click",
    () => {

      applyActiveProject();

      showView(
        projectNotesView,
        projectsNav
      );

      window
        .renderProjectNotesForProject
        ?.(
          getActiveProject()
            .name
        );
    }
  );
}


// =====================================================
// BACK FROM PROJECT NOTES
// =====================================================

if (backFromProjectNotes) {

  backFromProjectNotes
    .addEventListener(
      "click",
      () => {

        applyActiveProject();

        showView(
          projectWorkspaceView,
          projectsNav
        );
      }
    );
}


// =====================================================
// PROJECT REGISTRY CHANGES
// =====================================================

window.addEventListener(
  "excedere:projects-registry-updated",
  () => {

    refreshProjectDirectory();
  }
);


// Cloud restore can update localStorage.
// Refresh when another context changes it.

window.addEventListener(
  "storage",
  event => {

    if (
      !event.key ||
      event.key ===
        PROJECT_REGISTRY_KEY ||
      event.key ===
        ACTIVE_PROJECT_KEY
    ) {

      refreshProjectDirectory();
    }
  }
);


// =====================================================
// PAGE VISIBILITY
// =====================================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      !document.hidden
    ) {

      renderProjectCards();

      applyActiveProject();
    }
  }
);


// =====================================================
// INITIALIZE
// =====================================================

function initializeProjectWorkspaces() {

  ensureActiveProject();

  window.excedereActiveProject =
    activeProjectKey;

  renderProjectCards();

  wireDashboardProjectCards();

  applyActiveProject();
}


initializeProjectWorkspaces();
