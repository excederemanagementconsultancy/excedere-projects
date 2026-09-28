const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(seed={}) {
 const data=new Map(Object.entries(seed)); let fail=false;
 const localStorage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{if(fail)throw Error('Quota exceeded');data.set(k,String(v));}};
 const ctx={window:{},localStorage,crypto:require('node:crypto').webcrypto};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../storage.js'),'utf8'),ctx);
 return {store:ctx.window.ExcedereStore,data,fail:()=>{fail=true;}};
}
test('legacy duplicate titles and HTML remain distinct and exact, with untouched backup',()=>{
 const raw=JSON.stringify(['same','same','<img src=x onerror=alert(1)>']); const {store,data}=setup({excedereProjectTasks:raw});
 const items=store.read('excedereProjectTasks');store.write('excedereProjectTasks',items);
 assert.equal(data.get('excedereProjectTasksBackupV1'),raw);assert.notEqual(items[0].id,items[1].id);
 store.change('excedereProjectTasks',items[1].id,{title:'edited'}); const updated=store.read('excedereProjectTasks'); assert.equal(updated[0].title,'same');assert.equal(updated[1].title,'edited');assert.equal(updated[2].title,'<img src=x onerror=alert(1)>');
 store.write('excedereProjectTasks',updated);assert.equal(data.get('excedereProjectTasksBackupV1'),raw);
});
test('completion, deletion, restoration and reopening retain record and notes',()=>{
 const {store}=setup();store.add('excedereProjectTasks',{title:'Task',notes:'Keep this'});const id=store.read('excedereProjectTasks')[0].id;
 store.change('excedereProjectTasks',id,{status:'completed',completedAt:'2026-09-27T12:00:00Z'});
 store.change('excedereProjectTasks',id,{deletedAt:'2026-09-27T13:00:00Z'});store.change('excedereProjectTasks',id,{deletedAt:null});
 assert.equal(store.read('excedereProjectTasks')[0].status,'completed');store.change('excedereProjectTasks',id,{status:'active',completedAt:null});assert.equal(store.read('excedereProjectTasks')[0].notes,'Keep this');
});
test('malformed and unsupported data are never replaced',()=>{
 for(const raw of ['broken','null','{}','[42]','[{"title":"a","id":"x"},{"title":"b","id":"x"}]']) {const {store,data}=setup({excedereProjectTasks:raw});assert.throws(()=>store.write('excedereProjectTasks',[]));assert.equal(data.get('excedereProjectTasks'),raw);}
});
test('quota failure leaves source intact',()=>{const {store,data,fail}=setup({excedereProjectTasks:'["Keep"]'});fail();assert.throws(()=>store.change('excedereProjectTasks','excedereProjectTasks-0',{title:'Lost'}));assert.equal(data.get('excedereProjectTasks'),'["Keep"]');});
test('writes reread latest data and preserve new records from another tab',()=>{const {store}=setup();store.add('excedereCaptures',{title:'first',type:'Task'});const first=store.read('excedereCaptures')[0];store.add('excedereCaptures',{title:'second',type:'Idea'});store.change('excedereCaptures',first.id,{status:'completed'});assert.equal(store.read('excedereCaptures').length,2);});
