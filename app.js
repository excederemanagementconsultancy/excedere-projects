const tasksNav = document.getElementById("tasksNav");
const dashboardView = document.getElementById("dashboardView");
const tasksView = document.getElementById("tasksView");

function renderTasksPage() {
  window.refreshExcedere?.();
}


// =====================================================
// EXCEDERE PROJECTS - MAIN NAVIGATION
// =====================================================

const todayNav = document.getElementById("todayNav");
const projectsNav = document.getElementById("projectsNav");

const projectsView = document.getElementById("projectsView");
const projectWorkspaceView = document.getElementById("projectWorkspaceView");
const currentFocusView = document.getElementById("currentFocusView");
const projectTasksView = document.getElementById("projectTasksView");
const milestonesView = document.getElementById("milestonesView");
const projectNotesView = document.getElementById("projectNotesView");

const currentFocusCard = document.getElementById("currentFocusCard");
const projectTasksCard = document.getElementById("projectTasksCard");
const milestonesCard = document.getElementById("milestonesCard");
const projectNotesCard = document.getElementById("projectNotesCard");

const backToProjects = document.getElementById("backToProjects");
const backToWorkspace = document.getElementById("backToWorkspace");
const backFromProjectTasks = document.getElementById("backFromProjectTasks");
const backFromMilestones = document.getElementById("backFromMilestones");
const backFromProjectNotes = document.getElementById("backFromProjectNotes");

const currentFocusText = document.getElementById("currentFocusText");
const currentStageText = document.getElementById("currentStageText");
const nextActionText = document.getElementById("nextActionText");
const overallProgressBar = document.getElementById("overallProgressBar");
const overallProgressText = document.getElementById("overallProgressText");

const editCurrentFocus = document.getElementById("editCurrentFocus");
const editCurrentStage = document.getElementById("editCurrentStage");
const editNextAction = document.getElementById("editNextAction");
const editOverallProgress = document.getElementById("editOverallProgress");

const addProjectTask = document.getElementById("addProjectTask");
const projectTasksGrid = document.getElementById("projectTasksGrid");


// =====================================================
// PROJECT WORKSPACE CONFIGURATION
// =====================================================

const PROJECT_WORKSPACES = {

  projects: {
    name: "Excedere Projects",
    shortName: "PROJECTS",
    subtitle: "Plan, build and track the Excedere ecosystem.",

    focus:
      "Build and improve the Excedere project management platform.",

    stage:
      "Workspace structure, navigation and project intelligence.",

    next:
      "Enable dedicated workspaces across every Excedere project.",

    progress: 40,

    milestones: [
      {
        number: "01",
        title: "Core Workspace",
        description:
          "Build the main Excedere Projects dashboard and navigation.",
        stage: "Foundation",
        status: "Complete"
      },
      {
        number: "02",
        title: "Project Workspaces",
        description:
          "Build Current Focus, Project Tasks, Milestones and Project Notes.",
        stage: "Development",
        status: "Complete"
      },
      {
        number: "03",
        title: "Task Integration",
        description:
          "Connect project workspaces with the main task management system.",
        stage: "Integration",
        status: "Complete"
      },
      {
        number: "04",
        title: "Project Intelligence",
        description:
          "Add progress tracking, project history and smarter workspace tools.",
        stage: "Future Stage",
        status: "In Progress"
      }
    ]
  },


  crm: {
    name: "Excedere CRM",
    shortName: "CRM",
    subtitle:
      "Manage prospects, customers, communication and sales activity.",

    focus:
      "Continue building the connected CRM and Call Assist sales workspace.",

    stage:
      "Core CRM, Smart Follow-Up and Dialer V1 are operational.",

    next:
      "Prepare the Multi-Provider Communication Framework.",

    progress: 10,

    milestones: [
      {
        number: "01",
        title: "Core CRM",
        description:
          "Build companies, contacts, pipeline, activities and task management.",
        stage: "Foundation",
        status: "Complete"
      },
      {
        number: "02",
        title: "Smart Follow-Up",
        description:
          "Automatically connect contact follow-ups with CRM tasks.",
        stage: "Automation",
        status: "Complete"
      },
      {
        number: "03",
        title: "Dialer V1",
        description:
          "Connect CRM to Call Assist with call logging, timer and duration.",
        stage: "Communication",
        status: "Complete"
      },
      {
        number: "04",
        title: "Multi-Provider Communication",
        description:
          "Prepare support for device phone, GHL/Twilio, WhatsApp, Teams and Google.",
        stage: "Next Stage",
        status: "Planned"
      }
    ]
  },


  flow: {
    name: "Excedere Flow",
    shortName: "FLOW",
    subtitle:
      "Plan work, organize priorities and keep activity moving.",

    focus:
      "Continue developing the simple Excedere planning and workflow experience.",

    stage:
      "Today, Tasks, Projects and Calendar navigation are operational.",

    next:
      "Improve workflow automation and project integration.",

    progress: 25,

    milestones: [
      {
        number: "01",
        title: "Core Navigation",
        description:
          "Build the Today, Tasks, Projects and Calendar experience.",
        stage: "Foundation",
        status: "Complete"
      },
      {
        number: "02",
        title: "Project Workspace",
        description:
          "Organize project activity and current priorities.",
        stage: "Development",
        status: "Complete"
      },
      {
        number: "03",
        title: "Calendar",
        description:
          "Connect planned work with a clear calendar view.",
        stage: "Planning",
        status: "Complete"
      },
      {
        number: "04",
        title: "Workflow Intelligence",
        description:
          "Add smarter automation and workflow assistance.",
        stage: "Future Stage",
        status: "Planned"
      }
    ]
  },


  website: {
    name: "Excedere Website",
    shortName: "WEBSITE",
    subtitle:
      "Manage the public Excedere consultancy website and digital presence.",

    focus:
      "Improve visibility, search performance and conversion opportunities.",

    stage:
      "Core website, branding and consultation booking are live.",

    next:
      "Complete the next SEO and website visibility improvements.",

    progress: 75,

    milestones: [
      {
        number: "01",
        title: "Core Website",
        description:
          "Build and launch the Excedere Management Consultancy website.",
        stage: "Foundation",
        status: "Complete"
      },
      {
        number: "02",
        title: "Brand & Booking",
        description:
          "Deploy Excedere branding and consultation booking.",
        stage: "Conversion",
        status: "Complete"
      },
      {
        number: "03",
        title: "Social Presence",
        description:
          "Connect the website with Excedere's wider marketing presence.",
        stage: "Marketing",
        status: "In Progress"
      },
      {
        number: "04",
        title: "SEO & Visibility",
        description:
          "Improve search visibility and organic discovery.",
        stage: "Optimization",
        status: "Planned"
      }
    ]
  }

};


// =====================================================
// ACTIVE PROJECT
// =====================================================

const ACTIVE_PROJECT_KEY = "excedereActiveProjectWorkspace";

let activeProjectKey =
  localStorage.getItem(ACTIVE_PROJECT_KEY) || "projects";


function getActiveProject() {

  return (
    PROJECT_WORKSPACES[activeProjectKey] ||
    PROJECT_WORKSPACES.projects
  );
}


function setActiveProject(key) {

  if (!PROJECT_WORKSPACES[key]) {
    key = "projects";
  }

  activeProjectKey = key;

  localStorage.setItem(
    ACTIVE_PROJECT_KEY,
    activeProjectKey
  );

  window.excedereActiveProject = activeProjectKey;

  applyActiveProject();

  window.dispatchEvent(
    new CustomEvent(
      "excedere:project-change",
      {
        detail: {
          key: activeProjectKey,
          project: getActiveProject()
        }
      }
    )
  );
}


window.getActiveExcedereProject = function () {
  return {
    key: activeProjectKey,
    ...getActiveProject()
  };
};


// =====================================================
// VIEW HELPERS
// =====================================================

function hideMainViews() {

  document
    .querySelectorAll("main.main-content")
    .forEach(view => {
      view.style.display = "none";
    });
}


function setActiveNav(activeNav) {

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {
      item.classList.remove("active");
    });

  if (activeNav) {
    activeNav.classList.add("active");
  }
}


function showView(view, activeNav = null) {

  if (!view) return;

  hideMainViews();

  view.style.display = "block";

  if (activeNav) {
    setActiveNav(activeNav);
  }

  window.scrollTo(0, 0);
}


// =====================================================
// TEXT HELPERS
// =====================================================

function setText(element, value) {

  if (element) {
    element.textContent = value;
  }
}


function findHeading(view, selector) {

  if (!view) return null;

  return view.querySelector(selector);
}


// =====================================================
// APPLY ACTIVE PROJECT TO WORKSPACES
// =====================================================

function applyActiveProject() {

  const project = getActiveProject();


  // ===================================================
  // MAIN PROJECT WORKSPACE
  // ===================================================

  setText(
    findHeading(
      projectWorkspaceView,
      ".topbar .eyebrow"
    ),
    project.name.toUpperCase()
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


  // ===================================================
  // CURRENT FOCUS
  // ===================================================

  setText(
    findHeading(
      currentFocusView,
      ".topbar .eyebrow"
    ),
    project.name.toUpperCase()
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


  if (currentFocusText) {
    currentFocusText.textContent = project.focus;
  }

  if (currentStageText) {
    currentStageText.textContent = project.stage;
  }

  if (nextActionText) {
    nextActionText.textContent = project.next;
  }

  if (overallProgressBar) {
    overallProgressBar.style.width =
      `${project.progress}%`;
  }

  if (overallProgressText) {
    overallProgressText.textContent =
      `${project.progress}% complete`;
  }


  // ===================================================
  // PROJECT TASKS
  // ===================================================

  setText(
    findHeading(
      projectTasksView,
      ".topbar .eyebrow"
    ),
    project.name.toUpperCase()
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


  // Tell the task system which project is active.

  if (projectTasksGrid) {
    projectTasksGrid.dataset.project =
      project.name;
  }


  // If features.js exposes a project-task refresh,
  // use it automatically.

  window.renderProjectTasksForProject?.(
    project.name
  );


  // ===================================================
  // MILESTONES
  // ===================================================

  setText(
    findHeading(
      milestonesView,
      ".topbar .eyebrow"
    ),
    project.name.toUpperCase()
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

  renderProjectMilestones();


  // ===================================================
  // PROJECT NOTES
  // ===================================================

  setText(
    findHeading(
      projectNotesView,
      ".topbar .eyebrow"
    ),
    project.name.toUpperCase()
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


  // ===================================================
  // BACK BUTTON LABELS
  // ===================================================

  if (backToWorkspace) {
    backToWorkspace.textContent =
      `← Back to ${project.name}`;
  }

  if (backFromProjectTasks) {
    backFromProjectTasks.textContent =
      `← Back to ${project.name}`;
  }

  if (backFromMilestones) {
    backFromMilestones.textContent =
      `← Back to ${project.name}`;
  }

  if (backFromProjectNotes) {
    backFromProjectNotes.textContent =
      `← Back to ${project.name}`;
  }
}


// =====================================================
// MILESTONE RENDERER
// =====================================================

function renderProjectMilestones() {

  if (!milestonesView) return;

  const project = getActiveProject();

  const grid =
    milestonesView.querySelector(
      ".project-grid"
    );

  if (!grid) return;


  grid.innerHTML =
    project.milestones
      .map(milestone => {

        return `
          <article class="project-card">

            <div class="project-icon">
              ${milestone.number}
            </div>

            <h3>
              ${milestone.title}
            </h3>

            <p>
              ${milestone.description}
            </p>

            <div class="project-footer">

              <span>
                ${milestone.stage}
              </span>

              <strong>
                ${milestone.status}
              </strong>

            </div>

          </article>
        `;

      })
      .join("");
}


// =====================================================
// PROJECT CARD HELPERS
// =====================================================

function getProjectKeyFromName(name) {

  const clean =
    String(name || "")
      .trim()
      .toLowerCase();


  if (clean === "excedere projects") {
    return "projects";
  }

  if (clean === "excedere crm") {
    return "crm";
  }

  if (clean === "excedere flow") {
    return "flow";
  }

  if (clean === "excedere website") {
    return "website";
  }

  return null;
}


function wireProjectCard(card) {

  if (!card) return;

  const heading =
    card.querySelector("h3");

  if (!heading) return;


  const key =
    getProjectKeyFromName(
      heading.textContent
    );


  if (!key) return;


  card.style.cursor = "pointer";

  card.dataset.projectKey = key;


  card.addEventListener(
    "click",
    () => {

      setActiveProject(key);

      showView(
        projectWorkspaceView,
        projectsNav
      );
    }
  );
}


// =====================================================
// WIRE ALL PROJECT CARDS
// =====================================================

function wireAllProjectCards() {

  document
    .querySelectorAll(
      "#projectsView .project-card"
    )
    .forEach(wireProjectCard);


  document
    .querySelectorAll(
      "#dashboardView .project-card"
    )
    .forEach(wireProjectCard);
}


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

      window.renderProjectTasksForProject?.(
        getActiveProject().name
      );
    }
  );
}


// =====================================================
// BACK FROM PROJECT TASKS
// =====================================================

if (backFromProjectTasks) {

  backFromProjectTasks.addEventListener(
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

      renderProjectMilestones();

      showView(
        milestonesView,
        projectsNav
      );
    }
  );
}


// =====================================================
// BACK FROM MILESTONES
// =====================================================

if (backFromMilestones) {

  backFromMilestones.addEventListener(
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

      window.renderProjectNotesForProject?.(
        getActiveProject().name
      );
    }
  );
}


// =====================================================
// BACK FROM PROJECT NOTES
// =====================================================

if (backFromProjectNotes) {

  backFromProjectNotes.addEventListener(
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
// INITIALIZE
// =====================================================

function initializeProjectWorkspaces() {

  if (!PROJECT_WORKSPACES[activeProjectKey]) {
    activeProjectKey = "projects";
  }

  window.excedereActiveProject =
    activeProjectKey;

  wireAllProjectCards();

  applyActiveProject();
}


initializeProjectWorkspaces();
