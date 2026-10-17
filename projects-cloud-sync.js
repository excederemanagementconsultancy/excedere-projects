/* Durable operation queue. Server receipts are authoritative; recovery copies survive reloads. */
(()=>{
 'use strict';
 const auth=window.ExcedereAuth,Repository=window.ProjectsCloudRepository,workspace=window.ExcedereProjectsWorkspace,protocol=globalThis.ProjectsSyncProtocol;
 if(!auth||!Repository||!workspace||!protocol)return;
 const PREFIX='excedereProjectsOperationV2:',ARCHIVE='excedereProjectsHistoryV2:',LEGACY='excedereProjectsPendingV1:',BASE='excedereProjectsBaseV2:',WORKING_OWNER='excedereProjectsWorkingOwnerV2',IMPORTED='excedereProjectsLegacyImportedV2:';
 let owner=null,repo=null,ready=false,busy=false,initialising=null,view=null,timer=null,attempt=0,generation=0,storageFailed=false;
 const app=document.getElementById('authenticatedApp');if(app)app.inert=true;
 const activeEditor=()=>Boolean(document.querySelector('dialog[open],input:focus,textarea:focus,[contenteditable="true"]:focus'));
 const key=id=>PREFIX+owner+':'+id;
 function queued(){const rows=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(PREFIX+owner+':')){const op=JSON.parse(localStorage.getItem(k));if(op.owner!==owner||!Array.isArray(op.changes))throw Error('Pending recovery data needs review. Export a backup.');rows.push(op);}}return rows.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));}
 function archive(op,result){localStorage.setItem(ARCHIVE+owner+':'+op.id,JSON.stringify({id:op.id,owner:op.owner,result,acknowledgedAt:new Date().toISOString()}));localStorage.removeItem(key(op.id));}
 function persist(changes){if(!changes.length)return;const op=protocol.operation(owner,changes,queued());localStorage.setItem(key(op.id),JSON.stringify(op));return op;}
 function capture(){if(!ready||!view)return;const current=workspace.snapshot();const changes=protocol.diff(view,current);if(changes.length){persist(changes);view=current;}storageFailed=false;}
 function schedule(delay=300){clearTimeout(timer);timer=setTimeout(flush,delay);}
 function notify(message,error=false){
  const notice=document.querySelector('.save-notice');if(notice){notice.textContent=message;notice.classList.toggle('error',error);}
  let status=document.getElementById('projects-sync-status');if(!status){status=document.createElement('div');status.id='projects-sync-status';status.setAttribute('role','status');app?.querySelector('.sidebar')?.append(status);}
  status.replaceChildren();const text=document.createElement('p');text.textContent=message;status.append(text);
  if(error){const retry=document.createElement('button');retry.type='button';retry.textContent='Retry sync';retry.onclick=()=>{attempt=0;schedule(0);};status.append(retry);}
  const conflicts=owner?queued().filter(op=>op.conflicts?.length):[];
  if(conflicts.length){const review=document.createElement('button');review.type='button';review.textContent='Review conflicting changes';review.onclick=reviewConflicts;status.append(review);}
 }
 function apply(remote){
  if(activeEditor())return;
  let next=remote;for(const op of queued())next=protocol.overlay(next,op.changes);
  if(!protocol.equal({...next,savedAt:null},{...workspace.snapshot(),savedAt:null}))workspace.apply(next);
  view=workspace.snapshot();localStorage.setItem(BASE+owner,JSON.stringify(view));localStorage.setItem(WORKING_OWNER,owner);
 }
 async function reviewConflicts(){
  const remote=await repo.load();const operations=queued().filter(op=>op.conflicts?.length);if(!operations.length)return;
  const dialog=document.createElement('dialog');const heading=document.createElement('h2');heading.textContent='Review conflicting changes';dialog.append(heading);
  const description=document.createElement('p');description.textContent='Both versions are retained. Choose a version for each record. Other records can continue syncing.';dialog.append(description);
  for(const op of operations)for(const issue of op.conflicts){
   const section=document.createElement('section'),title=document.createElement('h3'),detail=document.createElement('pre');title.textContent=issue.after?.title||issue.after?.name||issue.id;
   const latest=issue.collection==='projects'?remote.projects?.find(r=>r.id===issue.id):['preferences','projectStatus'].includes(issue.collection)?{value:remote[issue.collection]?.[issue.id]}:remote.records[issue.collection]?.find(r=>r.id===issue.id);
   detail.textContent=JSON.stringify({account:latest,browser:issue.after},null,2);detail.style.whiteSpace='pre-wrap';section.append(title,detail);
   for(const [label,useLocal] of [['Keep account version',false],['Use browser version',true]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{
    try{if(useLocal){const chosen=protocol.operation(owner,[{collection:issue.collection,id:issue.id,before:latest||null,after:issue.after}]);localStorage.setItem(key(chosen.id),JSON.stringify(chosen));}
     const remaining=op.changes.filter(c=>!(c.collection===issue.collection&&c.id===issue.id));
     localStorage.setItem(ARCHIVE+owner+':'+op.id+':'+issue.collection+':'+issue.id,JSON.stringify({issue,choice:label,chosenAt:new Date().toISOString()}));
     op.changes=remaining;op.conflicts=op.conflicts.filter(c=>!(c.collection===issue.collection&&c.id===issue.id));
     if(remaining.length)localStorage.setItem(key(op.id),JSON.stringify(op));else archive(op,{reviewed:true});section.remove();schedule(0);
    }catch(e){notify('The review could not be protected. '+e.message,true);}
   };section.append(button);}dialog.append(section);
  }
  const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>{dialog.close();dialog.remove();schedule(0);};dialog.append(close);document.body.append(dialog);dialog.showModal();
 }
 async function initialise(){
  if(initialising)return initialising;const token=generation;
  initialising=(async()=>{
   const session=await auth.getSession();if(token!==generation||!session?.user?.id)return false;
   owner=session.user.id;repo=new Repository(auth.client,owner);
   const savedBase=localStorage.getItem(BASE+owner);
   if(savedBase&&localStorage.getItem(WORKING_OWNER)===owner){const previous=workspace.validate(JSON.parse(savedBase));const current=workspace.snapshot();persist(protocol.diff(previous,current));}
   const remote=await repo.load();if(token!==generation)return false;if(!remote)throw Error('No Projects cloud workspace exists for this account.');
   const raw=localStorage.getItem(LEGACY+owner);
   if(raw){const legacy=JSON.parse(raw);if(legacy.userId!==owner)throw Error('Recovery account mismatch.');workspace.validate(legacy.payload);
    const receipt=await repo.receipt(legacy.revision);
    if(receipt&&!receipt.conflicts?.length){localStorage.setItem(ARCHIVE+owner+':legacy:'+legacy.revision,raw);}
    else if(!localStorage.getItem(IMPORTED+owner+':'+legacy.revision)){
     // No historical base: migrate only additions/equal records. Never infer which differing field wins.
     const differences=protocol.diff(remote,legacy.payload);const ambiguous=differences.filter(c=>c.before&&c.collection!=='preferences');
     const existing=queued().find(op=>op.legacyRevision===legacy.revision);
     if(!existing){const safe=differences.filter(c=>!ambiguous.includes(c));if(safe.length){const op={...protocol.operation(owner,safe,queued()),legacyRevision:legacy.revision};localStorage.setItem(key(op.id),JSON.stringify(op));}if(ambiguous.length){const op={...protocol.operation(owner,ambiguous,queued()),legacyRevision:legacy.revision,conflicts:ambiguous.map(c=>({...c,remote:c.before}))};localStorage.setItem(key(op.id),JSON.stringify(op));}}
     localStorage.setItem(ARCHIVE+owner+':legacy:'+legacy.revision,raw);localStorage.setItem(IMPORTED+owner+':'+legacy.revision,'Protected in durable operation queue');
    }
   }
   ready=true;if(app)app.inert=false;apply(remote);window.ExcedereProjectsOpenLinkedTask?.();schedule(0);return true;
  })();
  try{return await initialising;}catch(e){initialising=null;notify('Sync could not start. Recovery copies are retained. '+e.message,true);return false;}
 }
 async function flush(){
  if(busy)return;if(!ready){await initialise();return;}busy=true;const token=generation;
  try{
   if(storageFailed)capture();for(const op of queued()){
    if(token!==generation)return;
    if(op.conflicts?.length)continue;
    const result=await repo.commit(op);if(token!==generation)return;
    if(result.conflicts.length){
     // Preserve unresolved records under a NEW identity; the original acknowledgement is immutable.
     const pending={...op,id:op.id+':conflict',changes:result.conflicts.map(({collection,id,before,after})=>({collection,id,before,after})),conflicts:result.conflicts};
     localStorage.setItem(key(pending.id),JSON.stringify(pending));archive(op,result);
    }else archive(op,result);
   }
   const remote=await repo.load();if(token!==generation)return;apply(remote);attempt=0;
   const pending=queued();if(pending.some(op=>!op.conflicts?.length))schedule(300);notify(pending.some(op=>op.conflicts?.length)?'Other work is synced. Conflicting records are retained for review.':pending.length?'Changes are protected in this browser and waiting to sync.':'Saved securely to your account.',pending.length>0);
  }catch(e){
   if(token!==generation)return;
   storageFailed=/quota|storage/i.test(e.message);notify(storageFailed?'Recovery storage could not be updated. Export a backup before leaving. '+e.message:'Changes remain protected in this browser. '+e.message,true);
   if(!['22023','28000','42501','55000'].includes(e.code)&&!storageFailed)schedule(Math.min(60000,1000*2**Math.min(attempt++,6))+Math.floor(Math.random()*500));
  }finally{if(token===generation)busy=false;}
 }
 window.ExcedereProjectsCloudSync=()=>{try{capture();notify('Saved in this browser. Waiting to sync to your account.');schedule();}catch(e){storageFailed=true;notify('Latest changes could not be protected. Export a backup before leaving. '+e.message,true);}};
 window.ExcedereProjectsCloudReady=()=>ready;
 window.ExcedereProjectsRefresh=flush;
 window.addEventListener('excedere:project-change',window.ExcedereProjectsCloudSync);
 window.addEventListener('storage',event=>{if(owner&&(event.key?.startsWith(PREFIX+owner+':')||event.key?.startsWith(ARCHIVE+owner+':')))schedule(250);});
 window.addEventListener('online',()=>schedule(0));window.addEventListener('focus',()=>schedule(0));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(0);});document.addEventListener('close',()=>schedule(0),true);
 setInterval(()=>{if(!document.hidden)schedule(0);},15000);
 window.addEventListener('beforeunload',event=>{if(storageFailed||(owner&&queued().length)){event.preventDefault();event.returnValue='';}});
 auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(owner&&session?.user?.id&&session.user.id!==owner)){generation++;clearTimeout(timer);ready=false;busy=false;owner=repo=view=initialising=null;if(app)app.inert=true;}if(event==='SIGNED_IN'&&!ready)setTimeout(()=>initialise(),0);});
 initialise();
})();
