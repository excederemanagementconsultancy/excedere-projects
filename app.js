const tasksNav = document.getElementById("tasksNav");
const dashboardView = document.getElementById("dashboardView");
const tasksView = document.getElementById("tasksView");
function renderTasksPage() { window.refreshExcedere?.(); }

// EXCEDERE PROJECTS - MAIN NAVIGATION

const todayNav = document.getElementById("todayNav");
const projectsNav = document.getElementById("projectsNav");

const projectsView = document.getElementById("projectsView");
const projectWorkspaceView = document.getElementById("projectWorkspaceView");
const currentFocusView = document.getElementById("currentFocusView");
const projectTasksView = document.getElementById("projectTasksView");
const milestonesView = document.getElementById("milestonesView");
const excedereProjectsCard = document.getElementById("excedereProjectsCard");
const currentFocusCard = document.getElementById("currentFocusCard");
const milestonesCard = document.getElementById("milestonesCard");
const backFromMilestones = document.getElementById("backFromMilestones");
const projectNotesView = document.getElementById("projectNotesView");
const projectNotesCard = document.getElementById("projectNotesCard");
const backFromProjectNotes = document.getElementById("backFromProjectNotes");
const projectTasksCard = document.getElementById("projectTasksCard");
const backToProjects = document.getElementById("backToProjects");
const backToWorkspace = document.getElementById("backToWorkspace");
const backFromProjectTasks = document.getElementById("backFromProjectTasks");
const currentFocusText = document.getElementById("currentFocusText");
const editCurrentFocus = document.getElementById("editCurrentFocus");
const currentStageText = document.getElementById("currentStageText");
const editCurrentStage = document.getElementById("editCurrentStage");
const nextActionText = document.getElementById("nextActionText");
const editNextAction = document.getElementById("editNextAction");
const overallProgressBar = document.getElementById("overallProgressBar");
const overallProgressText = document.getElementById("overallProgressText");
const editOverallProgress = document.getElementById("editOverallProgress");
const addProjectTask = document.getElementById("addProjectTask");
const projectTasksGrid = document.getElementById("projectTasksGrid");

function hideMainViews() {
  document.querySelectorAll("main.main-content").forEach(view => { view.style.display = "none"; });
}

function setActiveNav(activeNav) {
  document
    .querySelectorAll(".nav-item")
    .forEach(item => item.classList.remove("active"));

  if (activeNav) {
    activeNav.classList.add("active");
  }
}

function showView(view, activeNav = null) {
  hideMainViews();
  view.style.display = "block";

  if (activeNav) {
    setActiveNav(activeNav);
  }

  window.scrollTo(0, 0);
}

// TODAY

if (todayNav) {
  todayNav.addEventListener("click", () => {
    showView(dashboardView, todayNav);
  });
}

// TASKS

if (tasksNav) {
  tasksNav.addEventListener("click", () => {
    showView(tasksView, tasksNav);
    renderTasksPage();
  });
}

// PROJECTS

if (projectsNav) {
  projectsNav.addEventListener("click", () => {
    showView(projectsView, projectsNav);
  });
}

// OPEN EXCEDERE PROJECTS

if (excedereProjectsCard) {
  excedereProjectsCard.addEventListener("click", () => {
    showView(projectWorkspaceView, projectsNav);
  });
}

// BACK TO ALL PROJECTS

if (backToProjects) {
  backToProjects.addEventListener("click", () => {
    showView(projectsView, projectsNav);
  });
}

// CURRENT FOCUS

if (currentFocusCard) {
  currentFocusCard.addEventListener("click", () => {
    showView(currentFocusView, projectsNav);
  });
}

// BACK TO EXCEDERE PROJECTS

if (backToWorkspace) {
  backToWorkspace.addEventListener("click", () => {
    showView(projectWorkspaceView, projectsNav);
  });
}

// PROJECT TASKS

if (projectTasksCard) {
  projectTasksCard.addEventListener("click", () => {
    showView(projectTasksView, projectsNav);
  });
}

// BACK FROM PROJECT TASKS

if (backFromProjectTasks) {
  backFromProjectTasks.addEventListener("click", () => {
    showView(projectWorkspaceView, projectsNav);
  });
}

// MILESTONES

if (milestonesCard) {
  milestonesCard.addEventListener("click", () => {
    showView(milestonesView, projectsNav);
  });
}

// BACK FROM MILESTONES

if (backFromMilestones) {
  backFromMilestones.addEventListener("click", () => {
    showView(projectWorkspaceView, projectsNav);
  });
}

// PROJECT NOTES

if (projectNotesCard) {
  projectNotesCard.addEventListener("click", () => {
    showView(projectNotesView, projectsNav);
  });
}

// BACK FROM PROJECT NOTES

if (backFromProjectNotes) {
  backFromProjectNotes.addEventListener("click", () => {
    showView(projectWorkspaceView, projectsNav);
  });
}
