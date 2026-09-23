document.addEventListener("DOMContentLoaded", () => {

  const quickCaptureButton = Array.from(document.querySelectorAll("button"))
    .find(button => button.textContent.includes("Quick Capture"));

  if (!quickCaptureButton) {
    console.error("Quick Capture button not found.");
    return;
  }

  const overlay = document.createElement("div");

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(6px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  `;

  overlay.innerHTML = `
    <div id="quickCaptureModal" style="
      width:100%;
      max-width:560px;
      background:#0b1514;
      border:1px solid rgba(49,240,181,.28);
      border-radius:18px;
      padding:28px;
      box-shadow:0 30px 80px rgba(0,0,0,.55);
      color:#f4f7f6;
      font-family:inherit;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        margin-bottom:24px;
      ">
        <div>
          <div style="
            color:#31f0b5;
            font-size:12px;
            font-weight:800;
            letter-spacing:2px;
            margin-bottom:6px;
          ">
            QUICK CAPTURE
          </div>

          <h2 style="margin:0;font-size:26px;">
            Capture something
          </h2>

          <p style="
            margin:7px 0 0;
            color:#8da09b;
            font-size:14px;
          ">
            Get it out of your head before it escapes.
          </p>
        </div>

        <button id="closeQuickCapture" type="button" style="
          background:transparent;
          border:0;
          color:#8da09b;
          font-size:28px;
          cursor:pointer;
        ">×</button>
      </div>

      <form id="quickCaptureForm">

        <label style="display:block;margin-bottom:7px;font-size:13px;">
          What is it?
        </label>

        <select id="captureType" style="
          width:100%;
          padding:13px;
          margin-bottom:18px;
          border-radius:10px;
          border:1px solid rgba(49,240,181,.20);
          background:#07100f;
          color:#f4f7f6;
        ">
          <option value="Task">Task</option>
          <option value="Idea">Idea</option>
        </select>

        <label style="display:block;margin-bottom:7px;font-size:13px;">
          Title
        </label>

        <input id="captureTitle" required placeholder="What needs doing?" style="
          width:100%;
          padding:13px;
          margin-bottom:18px;
          border-radius:10px;
          border:1px solid rgba(49,240,181,.20);
          background:#07100f;
          color:#f4f7f6;
        ">

        <label style="display:block;margin-bottom:7px;font-size:13px;">
          Project
        </label>

        <select id="captureProject" style="
          width:100%;
          padding:13px;
          margin-bottom:18px;
          border-radius:10px;
          border:1px solid rgba(49,240,181,.20);
          background:#07100f;
          color:#f4f7f6;
        ">
          <option>Excedere Projects</option>
          <option>Excedere CRM</option>
          <option>Excedere Flow</option>
          <option>Excedere Website</option>
          <option>General</option>
        </select>

        <label style="display:block;margin-bottom:7px;font-size:13px;">
          Priority
        </label>

        <select id="capturePriority" style="
          width:100%;
          padding:13px;
          margin-bottom:18px;
          border-radius:10px;
          border:1px solid rgba(49,240,181,.20);
          background:#07100f;
          color:#f4f7f6;
        ">
          <option>Normal</option>
          <option>Low</option>
          <option>High</option>
          <option>Urgent</option>
        </select>

        <label style="display:block;margin-bottom:7px;font-size:13px;">
          Due date
        </label>

        <input id="captureDate" type="date" style="
          width:100%;
          padding:13px;
          margin-bottom:18px;
          border-radius:10px;
          border:1px solid rgba(49,240,181,.20);
          background:#07100f;
          color:#f4f7f6;
        ">

        <label style="display:block;margin-bottom:7px;font-size:13px;">
          Notes
        </label>

        <textarea id="captureNotes" rows="4" placeholder="Anything else?" style="
          width:100%;
          padding:13px;
          margin-bottom:22px;
          border-radius:10px;
          border:1px solid rgba(49,240,181,.20);
          background:#07100f;
          color:#f4f7f6;
          resize:vertical;
        "></textarea>

        <div style="
          display:flex;
          justify-content:flex-end;
          gap:10px;
        ">

          <button id="cancelQuickCapture" type="button" style="
            padding:12px 18px;
            border-radius:10px;
            border:1px solid rgba(255,255,255,.12);
            background:#101a18;
            color:#f4f7f6;
            cursor:pointer;
          ">
            Cancel
          </button>

          <button type="submit" style="
            padding:12px 22px;
            border-radius:10px;
            border:1px solid #31f0b5;
            background:#0c8f70;
            color:white;
            font-weight:800;
            cursor:pointer;
          ">
            Save
          </button>

        </div>

      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.style.display = "none";
  };

  quickCaptureButton.addEventListener("click", () => {
    overlay.style.display = "flex";

    setTimeout(() => {
      document.getElementById("captureTitle").focus();
    }, 50);
  });

  document
    .getElementById("closeQuickCapture")
    .addEventListener("click", closeModal);

  document
    .getElementById("cancelQuickCapture")
    .addEventListener("click", closeModal);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  document
    .getElementById("quickCaptureForm")
    .addEventListener("submit", event => {

      event.preventDefault();

      const item = {
        id: Date.now(),
        type: document.getElementById("captureType").value,
        title: document.getElementById("captureTitle").value.trim(),
        project: document.getElementById("captureProject").value,
        priority: document.getElementById("capturePriority").value,
        dueDate: document.getElementById("captureDate").value,
        notes: document.getElementById("captureNotes").value.trim(),
        createdAt: new Date().toISOString()
      };

      if (!item.title) return;

      const existingItems =
        JSON.parse(localStorage.getItem("excedereCaptures") || "[]");

      existingItems.push(item);

      localStorage.setItem(
        "excedereCaptures",
        JSON.stringify(existingItems)
      );

      event.target.reset();

      closeModal();

      alert("Captured successfully ✓");
    });

});

// EXCEDERE PROJECTS — DISPLAY SAVED CAPTURES

document.addEventListener("DOMContentLoaded", () => {
console.log("SAVED CAPTURE SYSTEM STARTED");
  function getSavedCaptures() {
    try {
      return JSON.parse(
        localStorage.getItem("excedereCaptures") || "[]"
      );
    } catch (error) {
      console.error("Could not load Excedere captures:", error);
      return [];
    }
  }

  function displaySavedCaptures() {

    const captures = getSavedCaptures();

    if (!captures.length) {
      return;
    }

    const priorityPanel = document.querySelector(".priority-panel");

    if (!priorityPanel) {
      console.error("Priority panel not found.");
      return;
    }

    const taskList = priorityPanel.querySelector(".task-list");

    if (!taskList) {
      console.error("Task list not found.");
      return;
    }

    // Remove previously generated captures
    taskList
      .querySelectorAll(".saved-capture")
      .forEach(item => item.remove());

    captures
      .filter(item => item.type === "Task")
      .slice()
      .reverse()
      .forEach(item => {

        const row = document.createElement("div");
        row.className = "task-row saved-capture";

        let dotClass = "green";

        if (item.priority === "Urgent") {
          dotClass = "red";
        } else if (item.priority === "High") {
          dotClass = "amber";
        }

        const dueText = item.dueDate
          ? `Due ${item.dueDate}`
          : item.priority;

        row.innerHTML = `
          <span class="priority-dot ${dotClass}"></span>

          <div class="task-info">
            <strong></strong>
            <small></small>
          </div>

          <span class="task-status"></span>
        `;

        row.querySelector("strong").textContent = item.title;
        row.querySelector("small").textContent = item.project;
        row.querySelector(".task-status").textContent = dueText;

        taskList.prepend(row);
      });
  }

  displaySavedCaptures();

});
// EXCEDERE PROJECTS – TASKS PAGE

const tasksNav = document.getElementById("tasksNav");
const dashboardView = document.getElementById("dashboardView");
const tasksView = document.getElementById("tasksView");
const allTasksList = document.getElementById("allTasksList");

function getTaskCaptures() {
  try {
    const captures = JSON.parse(
      localStorage.getItem("excedereCaptures") || "[]"
    );

    return captures.filter(item => item.type === "Task");
  } catch (error) {
    console.error("Could not load tasks:", error);
    return [];
  }
}

function renderTasksPage() {
  if (!allTasksList) return;

  const tasks = getTaskCaptures();

  allTasksList.innerHTML = "";

  if (!tasks.length) {
    allTasksList.innerHTML = `
      <div class="task-row">
        <div class="task-info">
          <strong>No tasks yet</strong>
          <small>Use Quick Capture to create your first task.</small>
        </div>
      </div>
    `;
    return;
  }

  tasks
    .slice()
    .reverse()
    .forEach(item => {
      const row = document.createElement("div");
      row.className = "task-row saved-capture";

      let dotClass = "green";

      if (item.priority === "Urgent") {
        dotClass = "red";
      } else if (item.priority === "High") {
        dotClass = "amber";
      }

      const dueText = item.dueDate
        ? `Due ${item.dueDate}`
        : item.priority;

      row.innerHTML = `
        <span class="priority-dot ${dotClass}"></span>

        <div class="task-info">
          <strong></strong>
          <small></small>
        </div>

        <span class="task-status"></span>
      `;

      row.querySelector("strong").textContent = item.title;
      row.querySelector("small").textContent = item.project;
      row.querySelector(".task-status").textContent = dueText;

      allTasksList.appendChild(row);
    });
}

// EXCEDERE PROJECTS - MAIN NAVIGATION

const todayNav = document.getElementById("todayNav");
const projectsNav = document.getElementById("projectsNav");
const projectsView = document.getElementById("projectsView");
const projectWorkspaceView = document.getElementById("projectWorkspaceView");
const currentFocusView = document.getElementById("currentFocusView");

function setActiveNav(activeNav) {
  document
    .querySelectorAll(".nav-item")
    .forEach(item => item.classList.remove("active"));

  activeNav.classList.add("active");
}

if (todayNav && dashboardView && tasksView && projectsView) {
  todayNav.addEventListener("click", () => {
    dashboardView.style.display = "block";
    tasksView.style.display = "none";
    projectsView.style.display = "none";

    setActiveNav(todayNav);
  });
}

if (tasksNav && dashboardView && tasksView && projectsView) {
  tasksNav.addEventListener("click", () => {
    dashboardView.style.display = "none";
    tasksView.style.display = "block";
    projectsView.style.display = "none";

    setActiveNav(tasksNav);
    renderTasksPage();
  });
}

if (projectsNav && dashboardView && tasksView && projectsView) {
  projectsNav.addEventListener("click", () => {
    dashboardView.style.display = "none";
    tasksView.style.display = "none";
    projectsView.style.display = "block";

    setActiveNav(projectsNav);
  });
}

// EXCEDERE PROJECTS - OPEN PROJECT WORKSPACE

const excedereProjectsCard = document.getElementById("excedereProjectsCard");


if (excedereProjectsCard && projectWorkspaceView) {
  excedereProjectsCard.addEventListener("click", () => {
    dashboardView.style.display = "none";
    tasksView.style.display = "none";
    projectsView.style.display = "none";
    projectWorkspaceView.style.display = "block";
  });
}

// BACK TO PROJECTS
const backToProjects = document.getElementById("backToProjects");

if (backToProjects && projectWorkspaceView && projectsView) {
  backToProjects.addEventListener("click", () => {
    projectWorkspaceView.style.display = "none";
    currentFocusView.style.display = "none";
    projectsView.style.display = "block";
    setActiveNav(projectsNav);
  });
}

// CURRENT FOCUS CARD

const currentFocusCard = document.getElementById("currentFocusCard");

const backToWorkspace = document.getElementById("backToWorkspace");

if (currentFocusCard && currentFocusView && projectWorkspaceView) {
  currentFocusCard.addEventListener("click", () => {
    projectWorkspaceView.style.display = "none";
    currentFocusView.style.display = "block";
  });
}

if (backToWorkspace && currentFocusView && projectWorkspaceView) {
  backToWorkspace.addEventListener("click", () => {
    currentFocusView.style.display = "none";
    projectWorkspaceView.style.display = "block";
  });
}
