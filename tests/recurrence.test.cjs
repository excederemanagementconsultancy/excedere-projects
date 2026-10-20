const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
require('../recurrence.js');
const R=globalThis.ExcedereRecurrence;
const rule=(frequency='daily',extra={})=>({version:1,frequency,startDate:'2026-10-20',endDate:'',timeZone:'America/New_York',reminderTime:'',...extra});
const base=()=>({id:'original-report-id',type:'Task',title:'Daily Excedere End of Day Report',project:'Excedere Operations & Reporting',dueDate:'2026-10-20',status:'active',priority:'High',notes:'Preserve all reporting instructions',createdAt:'original'});
const series=(r=rule())=>R.configure(base(),r,'2026-10-20','2026-10-20T12:00:00Z');
const dates=(r,from='2026-10-20',to='2026-10-27')=>R.expand(r,from,to).map(r=>r.dueDate);
test('daily includes both weekend days and has no implicit end',()=>{
 const record=series();assert.equal(dates(record).length,8);assert.ok(dates(record).includes('2026-10-24'));assert.ok(dates(record).includes('2026-10-25'));
 assert.equal(R.expand(record,'2099-01-01','2099-01-07').length,7);
});
test('weekdays omit weekends and selected weekly days support multiple days',()=>{
 assert.deepEqual(dates(series(rule('weekdays'))),['2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-26','2026-10-27']);
 assert.deepEqual(dates(series(rule('weekly',{weekdays:[2,4]}))),['2026-10-20','2026-10-22','2026-10-27']);
});
test('custom intervals support days weeks and months',()=>{
 assert.deepEqual(dates(series(rule('interval',{interval:3,unit:'days'}))),['2026-10-20','2026-10-23','2026-10-26']);
 assert.deepEqual(dates(series(rule('interval',{interval:2,unit:'weeks'})),'2026-10-20','2026-11-17'),['2026-10-20','2026-11-03','2026-11-17']);
 assert.deepEqual(dates(series(rule('interval',{interval:2,unit:'months'})),'2026-10-20','2027-02-20'),['2026-10-20','2026-12-20','2027-02-20']);
});
test('monthly clamps month end without drifting and handles leap years',()=>{
 const r=series(rule('monthly',{startDate:'2028-01-31'}));
 assert.deepEqual(dates(r,'2028-01-31','2028-04-30'),['2028-01-31','2028-02-29','2028-03-31','2028-04-30']);
});
test('end date is inclusive and optional reminder time survives generation',()=>{
 const r=series(rule('daily',{endDate:'2026-10-24',reminderTime:'17:30'}));
 assert.equal(dates(r).length,5);assert.ok(R.expand(r,'','2026-10-27').every(o=>o.reminderTime==='17:30'));
});
test('calendar schedules survive DST transitions in both directions',()=>{
 for(const startDate of ['2026-03-06','2026-10-30'])assert.equal(R.expand(series(rule('daily',{startDate})),startDate,R.addDays(startDate,6)).length,7);
 assert.equal(R.today('America/New_York',new Date('2026-10-21T01:00:00Z')),'2026-10-20');
});
test('invalid rules and dates are rejected before writes',()=>{
 for(const r of [rule('weekly',{weekdays:[]}),rule('weekly',{weekdays:[8]}),rule('interval',{interval:0,unit:'days'}),rule('interval',{interval:1.5,unit:'days'}),rule('daily',{endDate:'2026-10-19'}),rule('daily',{startDate:'2026-02-30'}),rule('daily',{reminderTime:'24:00'}),rule('daily',{timeZone:'Mars/Somewhere'})])assert.throws(()=>R.validate(r));
 assert.throws(()=>R.occurrence(series(),'2026-10-19'));
});
test('each completion and reopen is independent and audited after JSON reload',()=>{
 const original=series(),done=R.updateOccurrence(original,'2026-10-20',{status:'completed'},'FLOW','owner','2026-10-20T18:00:00Z');
 const loaded=JSON.parse(JSON.stringify(done));assert.equal(R.occurrence(loaded,'2026-10-20').status,'completed');assert.equal(R.occurrence(loaded,'2026-10-21').status,'active');assert.equal(loaded.status,'active');assert.equal(original['occurrence:2026-10-20'].status,'active');
 const reopened=R.updateOccurrence(loaded,'2026-10-20',{status:'active'},'Projects','owner');assert.equal(R.occurrence(reopened,'2026-10-20').completedAt,null);assert.deepEqual(R.occurrence(reopened,'2026-10-20').audit.map(e=>e.event),['completed','reopened']);
});
test('moved deleted and restored exceptions retain identity and do not duplicate',()=>{
 let r=R.updateOccurrence(series(),'2026-10-21',{dueDate:'2026-10-24',notes:'Moved just this date'});
 assert.ok(!dates(r).includes('2026-10-21'));const rows=R.expand(r,'2026-10-24','2026-10-24');assert.equal(rows.length,2);assert.equal(new Set(rows.map(r=>r.id)).size,2);
 r=R.updateOccurrence(r,'2026-10-21',{deletedAt:'2026-10-20T15:00:00Z'});assert.equal(R.occurrence(r,'2026-10-21').deletedAt,'2026-10-20T15:00:00Z');assert.equal(R.occurrence(r,'2026-10-22').deletedAt,null);
 r=R.updateOccurrence(r,'2026-10-21',{deletedAt:null});assert.equal(R.occurrence(r,'2026-10-21').deletedAt,null);
});
test('changing and stopping rules preserves elapsed dates and saved future completion',()=>{
 let r=R.updateOccurrence(series(),'2026-10-25',{status:'completed'});
 r=R.configure(r,rule('weekly',{weekdays:[2]}),'2026-10-23');
 assert.deepEqual(dates(r),['2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-25','2026-10-27']);
 assert.equal(R.occurrence(r,'2026-10-25').status,'completed');
 r=R.configure(r,rule('none'),'2026-10-23');assert.deepEqual(dates(r),['2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-25']);
 assert.equal(r.recurrenceHistory.length,3);
});
test('upgrading an existing completed task preserves its completion and creates active future dates',()=>{
 const r=R.configure({...base(),status:'completed',completedAt:'2026-10-20T16:00:00Z'},rule(),'2026-10-20');assert.equal(r.id,base().id);assert.equal(R.occurrence(r,'2026-10-20').completedAt,'2026-10-20T16:00:00Z');assert.equal(R.occurrence(r,'2026-10-21').status,'active');
});
test('guarded report migration reuses one record, preserves unrelated data and is idempotent',()=>{
 const w={schemaVersion:1,records:{tasks:[base(),{id:'unrelated',type:'Task',title:'Other',status:'completed'}],captures:[],milestones:[],notes:[]},projects:[{id:'project'}],preferences:{keep:true}};
 const next=R.configureReport(w);assert.equal(next.records.tasks.length,2);assert.equal(next.records.tasks[0].id,base().id);assert.equal(next.records.tasks[0].notes,base().notes);assert.deepEqual(next.records.tasks[1],w.records.tasks[1]);assert.deepEqual(next.preferences,w.preferences);assert.deepEqual(next,R.configureReport(next));assert.ok(!w.records.tasks[0].recurrence);
 assert.throws(()=>R.configureReport({...w,records:{...w.records,tasks:[]}}));assert.throws(()=>R.configureReport({...w,records:{...w.records,tasks:[base(),base()]}}));
});
test('legacy single tasks and raw snapshots remain byte equivalent without migration',()=>{
 assert.deepEqual(R.expand(base(),'','2026-12-31'),[base()]);
});
test('storage saves only the original series and backups; reload and per-date updates preserve unrelated edits',()=>{
 const data=new Map([['excedereProjectTasks',JSON.stringify([base()])]]);const raw=data.get('excedereProjectTasks');
 const context={window:{},structuredClone,Date,Intl,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))},crypto:require('node:crypto').webcrypto};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../recurrence.js'),'utf8'),context);vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../storage.js'),'utf8'),context);
 const store=context.window.ExcedereStore;store.change('excedereProjectTasks',base().id,{recurrence:rule()});store.change('excedereProjectTasks',R.identity(base().id,'2026-10-21'),{status:'completed'});store.change('excedereProjectTasks',base().id,{notes:'New notes'});
 const rows=JSON.parse(data.get('excedereProjectTasks'));assert.equal(rows.length,1);assert.equal(rows[0].notes,'New notes');assert.equal(R.occurrence(rows[0],'2026-10-21').status,'completed');assert.equal(R.occurrence(rows[0],'2026-10-22').status,'active');assert.equal(data.get('excedereProjectTasksBackupV1'),raw);
 assert.throws(()=>store.change('excedereProjectTasks',base().id,{recurrence:rule('weekly',{weekdays:[]})}));assert.equal(data.get('excedereProjectTasks'),JSON.stringify(rows));
});
test('new weekday tasks skip a weekend start; stopping a future series keeps its original task editable',()=>{
 const raw={...base(),dueDate:'2026-10-24'};
 const r=R.configure(raw,rule('weekdays',{startDate:'2026-10-24'}),'2026-10-20','2026-10-20T12:00:00Z',false);
 assert.deepEqual(dates(r,'2026-10-24','2026-10-27'),['2026-10-26','2026-10-27']);
 const stopped=R.configure(r,{...r.recurrence,frequency:'none'},'2026-10-20');assert.equal(R.view(stopped,'2026-10-21').length,1);
});
test('all saved future history remains visible without generating years of future tasks',()=>{
 let r=R.updateOccurrence(series(),'2030-10-20',{status:'completed'});
 const rows=R.view(r,'2026-11-20');assert.ok(rows.some(r=>r.occurrenceDate==='2030-10-20'&&r.status==='completed'));assert.ok(rows.length<100);
 const future=R.configure({...base(),dueDate:''},rule('monthly',{startDate:'2035-01-31'}),'2026-10-20','2026-10-20T12:00:00Z',false);assert.equal(R.view(future,'2026-11-20')[0].dueDate,'2035-01-31');
});
test('project grouping follows the original series after rename while saved historical content remains intact',()=>{
 const r=R.updateOccurrence(series(),'2026-10-20',{status:'completed'});r.project='Renamed project';assert.equal(R.occurrence(r,'2026-10-20').project,'Renamed project');assert.equal(r['occurrence:2026-10-20'].project,'Excedere Operations & Reporting');
});
test('report migration does not overwrite a newer repeat schedule',()=>{
 const w={records:{tasks:[series(rule('weekly',{weekdays:[2]}))],captures:[]}};assert.throws(()=>R.configureReport(w),/different repeat schedule/);
});
test('explicit conflict review preserves other dates and both branches of the same date audit',()=>{
 const original=series(),first=R.updateOccurrence(original,'2026-10-21',{status:'completed'},'FLOW','owner','2026-10-21T12:00:00Z');
 const remote=R.updateOccurrence(first,'2026-10-22',{status:'completed'},'FLOW','owner','2026-10-22T12:00:00Z');
 const draft=R.updateOccurrence(original,'2026-10-21',{notes:'Chosen browser notes'},'Projects','owner','2026-10-21T13:00:00Z');
 const reviewed=R.resolveConflict(remote,original,draft,'owner');
 assert.equal(R.occurrence(reviewed,'2026-10-22').status,'completed');assert.equal(R.occurrence(reviewed,'2026-10-21').notes,'Chosen browser notes');assert.deepEqual(R.occurrence(reviewed,'2026-10-21').audit.map(e=>e.event),['completed','edited','conflict resolved']);
});
