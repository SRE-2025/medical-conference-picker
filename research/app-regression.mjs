import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as core from '../core.mjs';
import * as pipeline from '../pipeline.mjs';

const catalog=JSON.parse(fs.readFileSync(new URL('../data.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../app.mjs',import.meta.url),'utf8').replace(/^import\s[^;]+;\s*$/gm,'');
const storageKey='stoneridge-conference-circuit-v1:regression';
const values=new Map();

async function loadApp(saved){
 const savedMap=saved||new Map(),nodes=new Map(),listeners={},downloads=[],fetches=[];
 const element=()=>({innerHTML:'',textContent:'',value:'',dataset:{},classList:{add(){},remove(){}},scrollIntoView(){},focus(){},showModal(){},close(){},click(){},reportValidity:()=>true,testValues:[]});
 const document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},querySelectorAll(){return [];},createElement:element,addEventListener(type,fn){listeners[type]=fn;}};
 const localStorage={getItem:key=>savedMap.get(key)||null,setItem:(key,value)=>savedMap.set(key,value)};
 class TestURL extends URL {static createObjectURL(blob){downloads.push(blob);return 'blob:test';}static revokeObjectURL(){}}
 class TestFormData{constructor(form){this.values=form.testValues;}[Symbol.iterator](){return this.values[Symbol.iterator]();}}
 const context=vm.createContext({...core,...pipeline,console,document,localStorage,location:{search:'?plan=regression'},URLSearchParams,URL:TestURL,Intl,Date,Blob,FormData:TestFormData,setTimeout:()=>0,clearTimeout(){},window:{print(){}},fetch:async url=>{fetches.push(url);if(!url.startsWith('./data.json'))throw Error('Unexpected network operation: '+url);return {ok:true,json:async()=>structuredClone(catalog)};}});
 const api=await vm.runInContext('(async()=>{'+source+'\nreturn {backup,budget,circuit,render,go,costLines,getState:()=>({p,decisions,quotes,step,leads:typeof leads===\'undefined\'?null:leads})};})()',context);
 return {api,savedMap,nodes,listeners,downloads,fetches};
}

async function importBackup(app,payload){
 const file={size:JSON.stringify(payload).length,text:async()=>JSON.stringify(payload)};
 app.listeners.change({target:{dataset:{},id:'import-file',files:[file],value:'backup.json'}});
 await new Promise(resolve=>setImmediate(resolve));
}

const app=await loadApp(values);
assert.ok(!app.nodes.get('#app').innerHTML.includes('research could not load'),'App must load');
assert.equal(app.api.getState().leads?.length,0,'Blank template creates no invented leads');

const lead=pipeline.createLead('TX06');
for(const field of pipeline.LEAD_HEADERS)lead[field]='Preserved '+field;
Object.assign(lead,{'Lead ID':'L-regression','Event ID':'TX06',Practice:'A, B & C','Website / domain':'example.test',City:'Austin',State:'TX',Specialty:'Primary care',Contact:'Test Contact',Role:'Owner','Work email':'test@example.test',Phone:'555-0100','Follow-up permission':'Organizer-permitted follow-up',Stage:'Proposal','First touch':'2026-11-01','Last touch':'2026-11-16','Next action date':'2026-11-17','Next action':'Send agreed audit',Owner:'Test owner','Monthly proposal (USD)':'149','Setup fee (USD)':'0','Outcome / lost reason':'Pending','Outreach eligibility':'Reviewed - permitted',Notes:'Comma, newline\n<script>test</script>','Next-action status':'Stale status'});
const settings={...core.defaults(catalog.events),extras:225,kit:800,contingency:7.5,texmedLeadRetrieval:true,texmedLeadFee:350};
const payload={version:1,preferences:settings,decisions:{TX06:'yes',TX31:'later'},quotes:{TX06:1425},step:5,leads:[lead]};
await importBackup(app,payload);
let restored=app.api.backup();
assert.equal(restored.leads?.length,1,'Backup import must retain leads');
for(const field of pipeline.LEAD_HEADERS.filter(x=>x!=='Next-action status'))assert.equal(restored.leads[0][field],lead[field],'Lead field '+field);
assert.equal(restored.decisions.TX31,'later');assert.equal(restored.quotes.TX06,1425);assert.equal(restored.preferences.contingency,7.5);assert.equal(restored.preferences.kit,800);
assert.ok(values.get(storageKey),'App must save browser-local state');
assert.equal(JSON.parse(values.get(storageKey)).leads.length,1,'Local saved JSON must include pipeline');

const reload=await loadApp(values);
restored=reload.api.backup();assert.equal(restored.leads.length,1);assert.equal(restored.leads[0].Notes,lead.Notes);assert.equal(restored.quotes.TX06,1425);
assert.ok(reload.fetches.every(x=>x.startsWith('./data.json')),'Pipeline must never send network requests');

const budgetHTML=reload.api.budget();
assert.match(budgetHTML,/data-field="contingency"/,'Contingency must be editable');
assert.match(budgetHTML,/texmedLeadRetrieval/,'TexMed lead retrieval must be editable');
assert.match(budgetHTML,/data-field="texmedLeadFee"/,'TexMed amount must be editable');
const texmed=catalog.events.find(e=>e.id==='TX06');
const t=core.trip(texmed,settings,payload.quotes),s=core.summary([texmed],settings,payload.quotes);
const costHTML=reload.api.costLines(t);
assert.match(costHTML,/retrieval/i,'TexMed add-on must be visible in itemized costs');
assert.match(costHTML,/contingency/i,'Contingency must be visible in itemized costs');
assert.equal(t.retrieval,350);assert.equal(t.nights,1);
assert.equal(s.minimum,Math.round((t.baseMinimum+settings.kit)*(1+settings.contingency/100)*100)/100,'Kit must count once before contingency');
reload.listeners.click({target:{closest:()=>({dataset:{action:'export-csv'}})}});
assert.ok(reload.downloads.length,'Circuit CSV must download');
const csv=await reload.downloads.at(-1).text();
assert.match(csv,/contingency/i);assert.match(csv,/retrieval/i);assert.match(csv,/kit/i,'CSV must account for once-per-circuit kit');
const csvRows=[];let csvRow=[];for(const match of csv.matchAll(/"((?:""|[^"])*)"(,|\r\n|$)/g)){csvRow.push(match[1].replaceAll('""','"'));if(match[2]!==','){csvRows.push(csvRow);csvRow=[];}}
const csvHeaders=csvRows.shift(),column=name=>csvHeaders.indexOf(name);
assert.ok(csvRows.every(row=>row.length===csvHeaders.length),'CSV rows must align with headers');
const csvEvents=csvRows.filter(row=>row[column('Row type')]==='Event'),csvTotals=csvRows.filter(row=>row[column('Row type')]==='Circuit summary');
assert.equal(csvEvents.length,1);assert.equal(Number(csvEvents[0][column('TexMed lead retrieval USD')]),350);assert.equal(Number(csvEvents[0][column('Planning estimate USD')]),t.minimum);
assert.equal(csvTotals.length,4);for(const [label,amount] of [['Base including reusable kit once',s.baseMinimum],['Reusable kit once (included in base)',s.kit],['Contingency reserve including kit',s.contingency],['Final planning estimate',s.minimum]]){const row=csvTotals.find(row=>row[0]==='CIRCUIT SUMMARY: '+label);assert.ok(row,label);assert.equal(Number(row[column('Planning estimate USD')]),amount,label);}

const legacy={version:1,preferences:{...settings,extras:250,kit:750},decisions:{TX31:'later'},quotes:{TX31:1300},step:4};
const oldApp=await loadApp(new Map([[storageKey,JSON.stringify(legacy)]]));
const oldBackup=oldApp.api.backup();assert.equal(oldBackup.leads.length,0);assert.equal(oldBackup.decisions.TX31,'later');assert.equal(oldBackup.quotes.TX31,1300);assert.equal(oldBackup.preferences.extras,250);assert.equal(oldBackup.preferences.kit,750);

await importBackup(reload,legacy);
assert.equal(reload.api.backup().leads.length,1,'Importing older backup must retain existing pipeline');
await importBackup(reload,{...payload,preferences:{...settings,hotel:999},leads:[{...lead,'Next action date':'2027-02-30'}]});
assert.equal(reload.api.backup().preferences.hotel,settings.hotel,'Invalid lead import must not partially change budget');
assert.equal(reload.api.backup().leads[0].Notes,lead.Notes,'Invalid import must leave current lead intact');

reload.listeners.click({target:{closest:()=>({dataset:{leadEdit:lead.id}})}});
const html=reload.nodes.get('#app').innerHTML;
assert.ok(!html.includes('<script>test</script>'),'Lead editor must escape source text');
assert.ok(html.includes('&lt;script&gt;test&lt;/script&gt;'),'Escaped note must remain editable');
const edited={...lead,Notes:'Updated in form',Owner:'Form owner'};
const form=reload.nodes.get('#lead-form')||{id:'lead-form',reportValidity:()=>true};form.id='lead-form';form.testValues=pipeline.LEAD_HEADERS.filter(h=>h!=='Next-action status').map(h=>[h,edited[h]]);reload.nodes.set('#lead-form',form);
reload.listeners.submit({target:form,preventDefault(){}});
const formSaved=reload.api.backup().leads[0];assert.equal(formSaved.Notes,'Updated in form');assert.equal(formSaved.Owner,'Form owner');assert.equal(reload.api.backup().leads.length,1,'Editing must update instead of duplicating');
reload.listeners.click({target:{closest:()=>({dataset:{action:'export-leads'}})}});
const leadCSV=await reload.downloads.at(-1).text();
for(const header of pipeline.LEAD_HEADERS)assert.ok(leadCSV.includes('"'+header+'"'),'Lead CSV field '+header);
assert.ok(leadCSV.includes('Updated in form'));assert.ok(leadCSV.includes('Form owner'));

console.log('PASS: App loads; all 24 lead fields survive JSON import/export/reload and form edit; old plans and existing pipeline survive legacy imports; invalid imports are atomic; lead text is escaped; only catalog is fetched; budget and CSV show contingency/retrieval/kit; TexMed hotel nights remain one.');
