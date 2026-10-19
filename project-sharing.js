/* Additive project collaboration panel using the existing authenticated client. */
(()=>{
 'use strict';
 const style=document.createElement('style');style.textContent=`.project-collaboration{position:fixed;inset:0;margin:auto;max-width:760px;width:90vw;max-height:85vh;overflow:auto;padding:24px;border:1px solid #596476;border-radius:12px;background:#101a28;color:#f4f5f7;font:inherit}.project-collaboration::backdrop{background:#020711c9}.project-collaboration h2,.project-collaboration h3,.project-collaboration h4{margin:12px 0}.project-collaboration p{margin:12px 0;line-height:1.5}.project-collaboration button{padding:10px 14px;margin:5px;border:1px solid #6d7890;border-radius:7px;background:#1d2b41;color:#fff}.project-collaboration label{display:block;margin:12px 0}.project-collaboration input,.project-collaboration textarea,.project-collaboration select{display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #68768a;border-radius:6px;background:#07111f;color:#fff}.project-collaboration input[type=checkbox]{width:auto}.project-collaboration button:disabled{opacity:.6}`;document.head.append(style);
 const auth=window.ExcedereAuth;if(!auth||!window.ProjectAccessClient)return;
 const api=new window.ProjectAccessClient(auth.client);let panel=null,generation=0,panelOwner=null,activeScope=null,linkedHandled=false;
 const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const button=(text,action)=>{const node=el('button',text);node.type='button';node.onclick=action;return node;};
 const field=(form,name,value='',type='text')=>{const label=el('label',name),input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value||'';input.name=name;label.append(input);form.append(label);return input;};
 function close(){generation++;activeScope=null;panel?.remove();panel=null;}
 async function open(){
  close();const token=generation;const session=await auth.getSession();if(token!==generation)return;panelOwner=session?.user?.id;if(!panelOwner)return;panel=el('dialog');panel.className='project-collaboration';panel.append(el('h2','Project collaboration'),button('Close',()=>{panel.close();close();}));document.body.append(panel);panel.addEventListener('cancel',close);panel.showModal();catalog();
 }
 async function catalog(){
  activeScope=null;const token=++generation,body=el('section');panel.querySelector('section')?.remove();panel.append(body);body.append(el('p','Loading authorized projects…'));
  try{const projects=await api.list();if(token!==generation||!panel)return;body.replaceChildren(el('p','Private projects stay in your main workspace. Select a project to manage its records or share it.'));
   const linked=!linkedHandled&&location.hash.startsWith('#shared=')?decodeURIComponent(location.hash.slice(8)):null;const target=projects.find(p=>p.ownerId+':'+p.projectId===linked);if(target){linkedHandled=true;show(target,body);return;}
   for(const project of projects)body.append(button(project.name+(project.owned?' (yours)':' (shared with you)'),()=>show(project,body)));
   if(!projects.length)body.append(el('p','Create a private project in Projects first.'));
  }catch(e){if(token===generation)body.replaceChildren(el('p',e.message));}
 }
 async function show(project,body){
  const token=++generation;activeScope={project,body};body.replaceChildren(el('p','Loading…'));
  try{const p=await api.read(project.ownerId,project.projectId),people=await api.collaborators(project.ownerId,project.projectId);if(token!==generation||!panel)return;
   body.replaceChildren(button('All projects',catalog),el('h3',project.name));
   const status=el('p');status.setAttribute('role','status');body.append(status);
   const pending=(await api.pending()).filter(op=>op.owner===p.ownerId&&op.project===p.projectId);if(token!==generation)return;
   for(const op of pending){body.append(el('p',op.blocked?'A saved draft needs review: '+op.reason:'A saved change is waiting for confirmation.'));
    if(!op.blocked)body.append(button('Retry saved change',async()=>{try{await api.send(op);if(token===generation)show(project,body);}catch(e){status.textContent=e.message;}}));
    else if(op.reason&&!/access/i.test(op.reason))for(const c of op.changes)body.append(button('Review draft: '+c.after.title,()=>editor(p,c.collection,c.before,people,body,project,c.after,op)));
   }
   if(project.owned){const share=el('form');const email=field(share,'Team member email','','email');email.required=true;
    share.append(button('Share project',()=>membership(true)),button('Remove access',()=>membership(false)));
    async function membership(enabled){if(!share.reportValidity())return;try{await api.share(project.ownerId,project.projectId,email.value,enabled);if(token===generation)show(project,body);}catch(e){status.textContent=e.message;}}
    body.append(share,el('p','Members: '+people.map(person=>person.name).join(', ')));
   }
   for(const [collection,label] of [['tasks','Task'],['captures','Idea'],['milestones','Milestone'],['notes','Note']]){
    body.append(el('h4',label+' records'),button('Add '+label,()=>editor(p,collection,null,people,body,project)));
    for(const record of p.records[collection]||[])if(!record.deletedAt)body.append(button(record.title+(record.status==='completed'?' (completed)':''),()=>editor(p,collection,record,people,body,project)));
   }
  }catch(e){if(token===generation)body.replaceChildren(button('All projects',catalog),el('p',e.message));}
 }
 function editor(p,collection,before,people,body,project,draft,draftOperation){
  const token=++generation,form=el('form'),record=draft||before||{};body.replaceChildren(el('h3',before?'Edit record':'Create record'));
  const title=field(form,'Title',record.title);title.required=true;
  const notes=field(form,'Notes',record.notes,'textarea');const due=field(form,'Due date',record.dueDate,'date');
  const label=el('label','Assigned to'),assigned=el('select');assigned.append(new Option('Unassigned',''));for(const person of people)assigned.append(new Option(person.name,person.userId));assigned.value=record.assignedTo||'';label.append(assigned);form.append(label);
  const completed=field(form,'Completed','','checkbox');completed.checked=record.status==='completed';
  const status=el('p');status.setAttribute('role','status');
  const save=el('button','Save record');save.type='submit';form.append(save,button('Back',()=>show(project,body)),status);body.append(form);
  form.onsubmit=async event=>{event.preventDefault();save.disabled=true;
   try{const id=record.id||crypto.randomUUID();let after={...record,id,type:before?.type||({tasks:'Task',captures:'Idea',milestones:'Milestone',notes:'Note'}[collection]),title:title.value.trim(),notes:notes.value,dueDate:due.value,project:project.name,projectId:project.projectId,assignedTo:assigned.value||null,status:completed.checked?'completed':'active'};
    // Explicitly reviewed drafts use the latest baseline; the retained original remains available.
    let baseline=before,current=p;if(draft){current=await api.read(p.ownerId,p.projectId);baseline=current.records[collection].find(r=>r.id===id)||null;after={...(baseline||after),id,type:after.type,title:after.title,notes:after.notes,dueDate:after.dueDate,project:project.name,projectId:project.projectId,assignedTo:after.assignedTo,status:after.status};}
    await api.commit(current,[{collection,id,before:baseline,after}]);if(draftOperation){draftOperation.resolved=true;localStorage.setItem(api.key(draftOperation),JSON.stringify(draftOperation));}if(token===generation)show(project,body);
   }catch(e){if(token===generation){status.textContent=e.message;save.disabled=false;}}
  };
 }
 const launch=button('Project collaboration',open);launch.id='project-collaboration';document.querySelector('#authenticatedApp .sidebar')?.append(launch);
 auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(panelOwner&&session?.user?.id!==panelOwner))close();if(event==='SIGNED_IN'&&location.hash.startsWith('#shared=')&&!panel)setTimeout(open,0);});
 if(location.hash.startsWith('#shared='))open();
 window.addEventListener('online',()=>api.retry().catch(()=>{}));
 setInterval(async()=>{if(!panel||!activeScope||activeScope.project.owned)return;const scope=activeScope;try{await api.read(scope.project.ownerId,scope.project.projectId);}catch(e){if(activeScope===scope&&panel){generation++;activeScope=null;scope.body.replaceChildren(button('All projects',catalog),el('p','Shared access cannot be verified. '+e.message));}}},15000);
})();
