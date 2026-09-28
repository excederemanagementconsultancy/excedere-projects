/* Small localStorage MVP, using the existing views, navigation and card styles. */
(() => {
  'use strict';
  const store = window.ExcedereStore;
  const [tasksKey, capturesKey, milestonesKey, notesKey] = store.keys;
  const $ = id => document.getElementById(id);
  const el = (tag, text, className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
  const button = (text, action, cls = 'focus-edit-button') => { const b = el('button', text, cls); b.type = 'button'; b.addEventListener('click', action); return b; };
  let noticeTimer;
  const notice = el('div', '', 'save-notice'); notice.setAttribute('role', 'status'); document.body.append(notice);
  function report(text, error = false) { clearTimeout(noticeTimer); notice.textContent = text; notice.classList.toggle('error', error); if (!error) noticeTimer = setTimeout(() => { notice.textContent = ''; }, 4000); }
  function attempt(action) { try { action(); return true; } catch (error) { report(`Could not save or load data. Existing data has been kept. ${error.message}`, true); return false; } }
  function mutate(action) { if (attempt(action)) { report('Saved on this browser.'); refresh(); return true; } return false; }
  const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dateLabel = value => value ? new Date(value + 'T12:00:00').toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'}) : 'No due date';
  const projects = ['Excedere Projects','Excedere CRM','Excedere Flow','Excedere Website','General'];
  const views = {};
  for (const name of ['Ideas','Calendar','Completed','Settings']) {
    const nav = [...document.querySelectorAll('.nav-item')].find(b => b.textContent.trim().endsWith(name));
    nav.id = `${name.toLowerCase()}Nav`;
    const view = el('main', undefined, 'main-content'); view.id = `${name.toLowerCase()}View`; view.style.display = 'none';
    const header = el('header', undefined, 'topbar'); const heading = el('div'); heading.append(el('p','EXCEDERE WORKSPACE','eyebrow'),el('h1',name)); header.append(heading);
    const panel = el('section', undefined, 'panel'); view.append(header,panel); document.querySelector('.app-shell').append(view);
    nav.addEventListener('click', () => { refresh(); showView(view,nav); }); views[name] = {view,header,panel};
  }
  // Native dialog gives keyboard trapping, Escape and focus restoration.
  const dialog = el('dialog', undefined, 'editor-dialog'); document.body.append(dialog);
  function editItem(key, item = null, type = 'Task', project = 'Excedere Projects') {
    dialog.replaceChildren();
    const form = el('form'); const title = el('h2', item ? `Edit ${type.toLowerCase()}` : `Add ${type.toLowerCase()}`); form.append(title);
    function field(label, name, value, kind = 'input', options = []) {
      const wrap = el('label',label); const input = el(kind); input.name = name;
      if (kind === 'select') options.forEach(v => { const o = el('option',v); o.value = v; input.append(o); });
      if (name === 'dueDate') input.type = 'date';
      if (name === 'title') { input.required = true; input.maxLength = 500; }
      input.value = value || ''; wrap.append(input); form.append(wrap); return input;
    }
    const nameInput = field('Title','title',item?.title);
    if (type === 'Task' || type === 'Idea') field('Project','project',item?.project || project,'select',projects);
    if (type === 'Task') field('Priority','priority',item?.priority || 'Normal','select',['Low','Normal','High','Urgent']);
    if (type === 'Task' || type === 'Milestone') field('Due date (optional)','dueDate',item?.dueDate);
    field(type === 'Note' ? 'Note' : 'Notes (optional)','notes',item?.notes,'textarea');
    const actions = el('div',undefined,'item-actions'); const save = el('button','Save','capture-button'); save.type = 'submit';
    actions.append(button('Cancel',() => dialog.close()),save); form.append(actions); dialog.append(form);
    form.addEventListener('submit', event => {
      event.preventDefault(); const data = Object.fromEntries(new FormData(form)); data.title = data.title.trim();
      if (!data.title) { nameInput.setCustomValidity('Enter a title.'); nameInput.reportValidity(); return; }
      const record = {...data, type, project: data.project || project};
      if (mutate(() => item ? store.change(key,item.id,record) : store.add(key,record))) dialog.close();
      else { let error = form.querySelector('[role=alert]'); if (!error) { error = el('p', '', 'subtitle'); error.setAttribute('role','alert'); form.append(error); } error.textContent = notice.textContent; }
    });
    nameInput.addEventListener('input',() => nameInput.setCustomValidity(''));
    dialog.showModal(); nameInput.focus();
  }
  function capture() {
    dialog.replaceChildren(el('h2','Quick Capture'),el('p','Capture a task or an idea.','subtitle'));
    const actions = el('div',undefined,'item-actions');
    actions.append(button('Task',() => { dialog.close(); editItem(capturesKey,null,'Task','General'); }),button('Idea',() => { dialog.close(); editItem(capturesKey,null,'Idea','General'); }),button('Cancel',() => dialog.close())); dialog.append(actions); dialog.showModal();
  }
  $('captureButton').addEventListener('click',capture); $('tasksCaptureButton').addEventListener('click',capture);
  $('addProjectTask').addEventListener('click',() => editItem(tasksKey));
  views.Ideas.header.append(button('+ Add Idea',() => editItem(capturesKey,null,'Idea','General'),'capture-button'));
  const milestonesGrid = document.querySelector('#milestonesView .project-grid');
  const notesGrid = document.querySelector('#projectNotesView .project-grid');
  document.querySelector('#milestonesView .panel-heading').append(button('+ Add Milestone',() => editItem(milestonesKey,null,'Milestone'),'capture-button'));
  document.querySelector('#projectNotesView .panel-heading').append(button('+ Add Note',() => editItem(notesKey,null,'Note'),'capture-button'));
  function readAll() {
    return store.keys.flatMap(key => {
      try { return store.read(key).map(item => ({...item,key})); }
      catch(error) { report(`A saved list could not be read (${key}). It has not been overwritten. Export a backup from Settings.`,true); return []; }
    });
  }
  function row(item, compact = false) {
    const card = el('article',undefined,'project-card record-card'); card.dataset.itemId = item.id;
    card.append(el('h3',item.title));
    card.append(el('p',`${item.project} · ${item.type}${item.priority ? ` · ${item.priority}` : ''}`,'item-meta'));
    if (item.notes) card.append(el('p',item.notes,'record-notes'));
    if (item.type === 'Task' || item.type === 'Milestone') card.append(el('small',dateLabel(item.dueDate),'subtitle'));
    if (item.completedAt) card.append(el('small',`Completed ${new Date(item.completedAt).toLocaleString()}`,'subtitle'));
    if (compact) return card;
    const actions = el('div',undefined,'item-actions');
    if (item.deletedAt) {
      actions.append(button('Restore',() => mutate(() => store.change(item.key,item.id,{deletedAt:null}))));
    } else {
      actions.append(button('Edit',() => editItem(item.key,item,item.type,item.project)));
      if (['Task','Milestone'].includes(item.type)) {
        actions.append(button(item.status === 'completed' ? 'Reopen' : 'Complete',() => mutate(() => store.change(item.key,item.id,item.status === 'completed' ? {status:'active',completedAt:null} : {status:'completed',completedAt:new Date().toISOString()}))));
      }
      actions.append(button('Delete',() => {
        dialog.replaceChildren(el('h2','Delete this item?'),el('p',`Move "${item.title}" to Recently deleted? You can restore it in Settings.`,'subtitle'));
        const controls = el('div',undefined,'item-actions');
        controls.append(button('Cancel',() => dialog.close()),button('Move to Recently deleted',() => { if (mutate(() => store.change(item.key,item.id,{deletedAt:new Date().toISOString()}))) dialog.close(); else dialog.append(el('p',notice.textContent,'subtitle')); }));
        dialog.append(controls); dialog.showModal();
      }));
    }
    card.append(actions); return card;
  }
  function list(target, items, empty = 'Nothing here yet.') { target.replaceChildren(); if (!items.length) target.append(el('p',empty,'empty-state')); else items.forEach(item => target.append(row(item))); }
  function editFocus(key, textId, label, progress = false) {
    dialog.replaceChildren(el('h2',label));
    const form = el('form'), wrap = el('label', progress ? 'Progress (0 to 100)' : 'Value');
    const input = el('input'); input.required = true;
    input.value = progress ? parseInt($('overallProgressText').textContent) : $(textId).textContent;
    if (progress) { input.type = 'number'; input.min = '0'; input.max = '100'; input.step = '1'; }
    wrap.append(input); const controls = el('div',undefined,'item-actions'); const save=el('button','Save','capture-button'); save.type='submit';
    controls.append(button('Cancel',() => dialog.close()),save); form.append(wrap,controls); dialog.append(form);
    form.addEventListener('submit',event => {
      event.preventDefault(); const value=input.value.trim(); if (!value) { input.setCustomValidity('Enter a value.'); input.reportValidity(); return; }
      if (mutate(() => { localStorage.setItem(key,value); if (!progress) $(textId).textContent=value; })) dialog.close();
      else form.append(el('p',notice.textContent,'subtitle'));
    });
    input.addEventListener('input',() => input.setCustomValidity('')); dialog.showModal(); input.focus();
  }
  function focusSetup() {
    for (const [key,textId,editId,label] of [
      ['excedereCurrentFocus','currentFocusText','editCurrentFocus','What are you working on now?'],
      ['excedereCurrentStage','currentStageText','editCurrentStage','What stage is the project currently at?'],
      ['excedereNextAction','nextActionText','editNextAction','What is the next action?']
    ]) {
      attempt(() => { const value = localStorage.getItem(key); if (value !== null) $(textId).textContent = value; });
      $(editId).addEventListener('click',() => editFocus(key,textId,label));
    }
    $('editOverallProgress').addEventListener('click',() => editFocus('excedereOverallProgress',null,'Overall Progress',true));
  }
  // Preserve the original roadmap as real editable records once, without inventing completion dates.
  attempt(() => {
    if (localStorage.getItem(milestonesKey) === null) {
      store.write(milestonesKey,[...milestonesGrid.querySelectorAll('.project-card')].map((card,i) => ({id:`roadmap-${i}`,title:card.querySelector('h3').textContent,notes:card.querySelector('p').textContent,type:'Milestone',project:'Excedere Projects',status:card.querySelector('.project-footer strong').textContent === 'Complete' ? 'completed' : 'active'})));
    }
    const raw = localStorage.getItem(tasksKey);
    if (raw !== null) { const tasks = store.read(tasksKey); if (JSON.stringify(tasks) !== raw) store.write(tasksKey,tasks); }
  });
  // Existing task cards describe actual project work; retain them once as editable tasks.
  attempt(() => {
    if (!localStorage.getItem('excedereSeedTasksV1')) {
      const tasks = store.read(tasksKey);
      [...$('projectTasksGrid').querySelectorAll('.project-card')].forEach((card,i) => {
        if (!tasks.some(t => t.id === `starter-${i}`)) tasks.push({id:`starter-${i}`,title:card.querySelector('h3').textContent,notes:card.querySelector('p').textContent,type:'Task',project:'Excedere Projects',status:'active'});
      });
      store.write(tasksKey,tasks); localStorage.setItem('excedereSeedTasksV1','1');
    }
  });
  focusSetup();
  const taskFilter = el('select'); taskFilter.setAttribute('aria-label','Filter tasks by project');
  ['All projects',...projects].forEach(name => { const option=el('option',name); option.value=name; taskFilter.append(option); });
  document.querySelector('#tasksView .panel-heading').append(taskFilter); taskFilter.addEventListener('change',refresh);
  const monthInput = el('input'); monthInput.type = 'month'; monthInput.value = localDate().slice(0,7); monthInput.setAttribute('aria-label','Calendar month');
  views.Calendar.header.append(monthInput); monthInput.addEventListener('change',refresh);
  views.Settings.panel.append(el('h2','Your data'),el('p','Saved on this browser and device only. Export a backup before clearing browser data or changing devices.','subtitle'));
  views.Settings.panel.append(button('Export backup',() => attempt(() => {
    const data = {}; for (let i=0;i<localStorage.length;i++) { const key=localStorage.key(i); if (key.startsWith('excedere')) data[key]=localStorage.getItem(key); }
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'excedere-backup',version:1,data},null,2)],{type:'application/json'}));
    const a=el('a'); a.href=url; a.download=`excedere-backup-${localDate()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  })));
  const deletedHeading = el('h2','Recently deleted'); deletedHeading.className = 'settings-heading';
  const deletedList = el('div',undefined,'record-list'); views.Settings.panel.append(deletedHeading,deletedList);
  function refresh() {
    const all = readAll(), live = all.filter(i => !i.deletedAt), active = live.filter(i => i.status !== 'completed');
    const tasks = active.filter(i => i.type === 'Task'), ideas = active.filter(i => i.type === 'Idea');
    list($('allTasksList'),tasks.filter(i => taskFilter.value === 'All projects' || i.project === taskFilter.value),'No open tasks for this selection. Use Quick Capture to add one.');
    list($('projectTasksGrid'),tasks.filter(i => i.project === 'Excedere Projects'),'No open project tasks. Add one or reopen completed work.');
    list(milestonesGrid,live.filter(i => i.type === 'Milestone'),'Add your first milestone.');
    list(notesGrid,live.filter(i => i.type === 'Note'),'Add a note, decision or project update.');
    list(views.Ideas.panel,ideas,'No ideas yet. Capture one when inspiration strikes.');
    list(views.Completed.panel,live.filter(i => i.status === 'completed').sort((a,b) => (b.completedAt || '').localeCompare(a.completedAt || '')),'Completed tasks and milestones will appear here.');
    list(deletedList,all.filter(i => i.deletedAt),'No deleted items.');
    const today = localDate(), next = new Date(); next.setDate(next.getDate()+7);
    const counts = [tasks.filter(i => i.dueDate === today).length,tasks.filter(i => i.dueDate && i.dueDate < today).length,tasks.filter(i => i.dueDate > today && i.dueDate <= localDate(next)).length,ideas.length];
    document.querySelectorAll('.stat-card strong').forEach((n,i) => n.textContent=counts[i]);
    document.querySelector('.stat-card small').textContent='Tasks due today';
    const priority = document.querySelector('.priority-panel .task-list');
    const rank = {Urgent:0,High:1,Normal:2,Low:3};
    priority.replaceChildren();
    [...tasks].sort((a,b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || (rank[a.priority] ?? 2)-(rank[b.priority] ?? 2)).slice(0,5).forEach(item => {
      const r = el('div',undefined,'task-row'), info = el('div',undefined,'task-info');
      info.append(el('strong',item.title),el('small',item.project));
      r.append(el('span','',`priority-dot ${item.priority === 'Urgent' ? 'red' : item.priority === 'High' ? 'amber' : 'green'}`),info,el('span',item.dueDate ? dateLabel(item.dueDate) : (item.priority || 'Active'),'task-status')); priority.append(r);
    });
    if (!tasks.length) priority.append(el('p','No open tasks. Enjoy the breathing room.','empty-state'));
    const ideaBox = document.querySelector('.idea-box'); ideaBox.replaceChildren();
    ideas.slice(-3).reverse().forEach(i => ideaBox.append(row(i,true))); if (!ideas.length) ideaBox.append(el('p','Capture an idea now and decide what to do with it later.'));
    const events = active.filter(i => ['Task','Milestone'].includes(i.type) && i.dueDate?.startsWith(monthInput.value)).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
    list(views.Calendar.panel,events,'No dated tasks or milestones this month. Set a due date when adding or editing one.');
    $('projectTasksCard').querySelector('.project-footer span').textContent = `${tasks.filter(i => i.project === 'Excedere Projects').length} open tasks`;
    $('milestonesCard').querySelector('.project-footer span').textContent = `${live.filter(i => i.type === 'Milestone' && i.status === 'completed').length} of ${live.filter(i => i.type === 'Milestone').length} complete`;
    $('projectNotesCard').querySelector('.project-footer span').textContent = `${live.filter(i => i.type === 'Note').length} notes`;
    attempt(() => {
      const saved=localStorage.getItem('excedereOverallProgress'); const progress=saved !== null && Number.isFinite(Number(saved)) ? Math.max(0,Math.min(100,Number(saved))) : 40;
      $('overallProgressBar').style.width=`${progress}%`; $('overallProgressText').textContent=`${progress}% complete`;
      document.querySelectorAll('#dashboardView .projects-section .project-card, #projectsView .project-card').forEach(card => {
        if (card.querySelector('h3').textContent === 'Excedere Projects') { const bar=card.querySelector('.progress span'); if (bar) bar.style.width=`${progress}%`; card.querySelector('.project-footer span').textContent=`${progress}% complete`; }
        else { card.querySelector('.project-footer span').textContent='Task tracking available'; const bar=card.querySelector('.progress'); if (bar) bar.hidden=true; }
      });
    });
  }
  // Preserve existing click routes and add keyboard access to the same cards.
  document.querySelectorAll('#currentFocusCard,#projectTasksCard,#milestonesCard,#projectNotesCard,#excedereProjectsCard').forEach(card => {
    card.tabIndex=0; card.setAttribute('role','button'); card.addEventListener('keydown',e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
  });
  document.querySelectorAll('#dashboardView .projects-section .project-card, #projectsView .project-card:not(#excedereProjectsCard)').forEach(card => {
    card.tabIndex=0; card.setAttribute('role','button');
    const open=() => { if (card.querySelector('h3').textContent === 'Excedere Projects') showView(projectWorkspaceView,projectsNav); else { taskFilter.value=card.querySelector('h3').textContent; refresh(); showView(tasksView,tasksNav); } };
    card.addEventListener('click',open); card.addEventListener('keydown',e => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); open(); } });
  });
  document.querySelector('.priority-panel .text-button').addEventListener('click',() => $('tasksNav').click());
  document.querySelector('.ideas-panel .text-button').addEventListener('click',() => $('ideasNav').click());
  document.querySelector('.projects-section .text-button').addEventListener('click',() => $('projectsNav').click());
  $('tasksNav').addEventListener('click',() => { taskFilter.value='All projects'; refresh(); });
  $('todayNav').addEventListener('click',refresh);
  document.addEventListener('visibilitychange',() => { if (!document.hidden && !dialog.open) refresh(); });
  window.refreshExcedere=refresh; window.addEventListener('storage',() => { if (!dialog.open) refresh(); }); refresh();
})();
