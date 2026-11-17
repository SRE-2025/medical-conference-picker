import fs from 'node:fs';
import assert from 'node:assert/strict';
import {defaults, trip, conflict, tryAdd, toICS, restore} from '../core.mjs';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const data=JSON.parse(read('data.json'));
const archive=JSON.parse(read('research/original-workbook.json'));
const extract=read('research/original-workbook-extract.txt');

// An independent token-based CSV reader; deliberately does not import the importer.
function csv(text){
  const token=/("(?:[^"]|"")*"|[^,"\r\n]*)(,|\r\n|\n|\r|$)/y;
  const rows=[];let row=[],position=0;
  while(position<text.length){
    token.lastIndex=position;const m=token.exec(text);
    assert.ok(m&&m[0].length,`Invalid CSV at byte ${position}`);
    const value=m[1].startsWith('"')?m[1].slice(1,-1).replaceAll('""','"'):m[1];
    row.push(value);position=token.lastIndex;
    if(m[2]!==','){rows.push(row);row=[];}
  }
  if(text.endsWith(','))row.push('');
  if(row.length)rows.push(row);
  return rows;
}
// Self-check escaped quotes, embedded commas/newlines, final blank cells.
assert.deepEqual(csv('a,"b,c","d""e",\n"x\ny",z,q,\n'),[['a','b,c','d"e',''],['x\ny','z','q','']]);
assert.deepEqual(csv('a,b,'),[['a','b','']]);

const marker=/<PARSED TEXT FOR SHEET: (\d+) \/ 3 TABS\r?\nTAB NAME: ([^>]+)>\r?\n/g;
const marks=[...extract.matchAll(marker)];
assert.equal(marks.length,3);
const parsed=marks.map((m,i)=>{
  const raw=extract.slice(m.index+m[0].length,marks[i+1]?.index??extract.length).replace(/[\r\n]+$/,'');
  const table=csv(raw);return {name:m[2],number:Number(m[1]),raw,headers:table[0],rows:table.slice(1)};
});
assert.deepEqual(parsed.map(s=>s.name),['Choose events','Conference circuit','Lead pipeline']);
let cellsCompared=0;
for(const sheet of parsed){
  const saved=archive.sheets.find(s=>s.name===sheet.name);
  assert.ok(saved,`Missing sheet ${sheet.name}`);
  assert.equal(saved.number,sheet.number);
  assert.deepEqual(saved.extractionHeaders,sheet.headers,`${sheet.name} extraction headers changed`);
  assert.equal(saved.width,sheet.headers.length-1);
  assert.equal(saved.rows.length,sheet.rows.length,`${sheet.name} row count changed`);
  assert.equal(saved.rawCSV,sheet.raw,`${sheet.name} source CSV changed`);
  sheet.rows.forEach((row,i)=>{
    assert.equal(Number(row[0]),i,`${sheet.name} source row sequence`);
    assert.equal(saved.rows[i].index,i);
    assert.deepEqual(saved.rows[i].cells,row.slice(1),`${sheet.name} row ${i} cell mismatch`);
    cellsCompared+=row.length-1;
  });
}
const [choose,circuit,pipeline]=parsed;
const headers=circuit.rows[4].slice(1),leadHeaders=pipeline.rows[4].slice(1);
assert.equal(headers.length,26);
assert.equal(leadHeaders.length,24);
assert.deepEqual(data.originalWorkbook.eventHeaders,headers);
assert.deepEqual(archive.eventHeaders,headers);
const rows=circuit.rows.slice(5).filter(r=>r[2]);
assert.equal(rows.length,150);
assert.equal(data.events.length,188);
const current=new Map(data.events.map(e=>[e.id,e]));
assert.equal(current.size,188);
const originalIds=new Set();
for(const row of rows){
  const values=row.slice(1),record=Object.fromEntries(headers.map((h,i)=>[h,values[i]])),id=record['Event ID'];
  assert.ok(!originalIds.has(id),`Duplicate source ID ${id}`);originalIds.add(id);
  const event=current.get(id);assert.ok(event,`Original ID ${id} absent from catalog`);
  assert.equal(event.state,record['State market'],`${id} current state regression`);
  const saved=event.originalResearch;
  assert.ok(saved,`${id} missing original row`);
  assert.equal(saved.source,'Medical_Conference_Circuit_2027.xlsx');
  assert.equal(saved.checked,'2026-11-16');
  assert.equal(saved.sheet,'Conference circuit');
  assert.equal(saved.row,Number(row[0])+1);
  assert.deepEqual(Object.keys(saved.record),headers,`${id} original column order`);
  assert.deepEqual(saved.record,record,`${id} original cells changed`);
  const archived=archive.events.find(e=>e.record['Event ID']===id);
  assert.deepEqual(archived,{row:Number(row[0])+1,record},`${id} archive event mapping`);
}
assert.equal(originalIds.size,150);
assert.equal(archive.events.length,150);
assert.equal(data.events.filter(e=>e.originalResearch).length,150);
assert.equal(data.events.filter(e=>!e.originalResearch).length,38);
const sourceLeads=pipeline.rows.slice(5).filter(r=>r.slice(1).some(Boolean));
assert.equal(sourceLeads.length,0);
assert.deepEqual(archive.leadPipeline.headers,leadHeaders);
assert.deepEqual(data.originalWorkbook.leadPipeline.headers,leadHeaders);
assert.deepEqual(data.originalWorkbook.leadPipeline.rows,[]);
assert.deepEqual(archive.leadPipeline.rows,[]);
const hold=choose.rows.find(r=>r[0]==='55')[1];
assert.equal(data.originalWorkbook.leadPipeline.outreachHold.rule,hold);
assert.match(hold,/chiropractic practices in Longview and surrounding areas on hold/i);
for(const index of ['51','52','53','54','55'])assert.ok(data.originalWorkbook.leadPipeline.instructions.includes(choose.rows.find(r=>r[0]===index)[1]));

// Later planning instructions continue to govern the active planner.
const preferences=defaults(data.events);
assert.equal(preferences.useHistoricalFees,false);
const dated={...data.events.find(e=>e.coordinates),id:'handoff-test',start:'2027-08-10',end:'2027-08-12',exhibitStart:null,exhibitEnd:null,coordinates:[32.777,-96.797],location:'In-state venue posted'};
const three=trip(dated,preferences);
assert.equal(three.nights,2);assert.equal(three.from,dated.start);assert.equal(three.to,dated.end);
assert.equal(trip({...dated,end:dated.start},preferences).nights,0);
assert.equal(trip({...dated,end:'2027-08-11'},preferences).nights,1);
assert.equal(trip({...dated,coordinates:[30.267,-97.743]},preferences).nights,0);
const collision={...dated,id:'handoff-test-2'};
assert.equal(conflict(dated,collision,preferences),true);
assert.equal(tryAdd(collision,[dated],preferences).ok,false);
const ics=toICS([dated],preferences);
assert.ok(ics.includes('DTSTART;VALUE=DATE:20270810'));
assert.ok(ics.includes('DTEND;VALUE=DATE:20270813'));
const restored=restore({version:1,preferences:{...preferences,setup:true},decisions:{[data.events[0].id]:'later'},quotes:{}},data.events);
assert.equal(restored.preferences.setup,undefined);
assert.equal(restored.decisions[data.events[0].id],'later');
assert.match(read('app.mjs'),/\["later","Maybe"\]/);

// Supply an independently captured pre-import catalog as an optional CLI argument.
// Example: node research/handoff-validation.mjs ../data-before-handoff.json
const baselinePath=process.argv[2];
let currentFieldsCompared=0,currentCatalogRegressionCheckPassed=null;
if(baselinePath){
  const before=JSON.parse(fs.readFileSync(baselinePath,'utf8'));
  assert.equal(before.events.length,188);
  for(const old of before.events){
    const now=current.get(old.id);assert.ok(now,`Current event ${old.id} removed`);
    for(const [field,value]of Object.entries(old)){
      assert.deepEqual(now[field],value,`${old.id}.${field}: existing catalog fact regressed during import`);
      currentFieldsCompared++;
    }
  }
  for(const [field,value]of Object.entries(before))if(field!=='events')assert.deepEqual(data[field],value,`Catalog metadata ${field} changed during import`);
  currentCatalogRegressionCheckPassed=true;
}

console.log(JSON.stringify({status:'passed',sheets:3,allSourceCellsCompared:cellsCompared,originalEventCellsCompared:150*26,currentFieldsCompared,originalIdsRetained:150,expandedCatalog:188,additionalEvents:38,originalConferenceColumns:26,originalLeadColumns:24,sourceLeadRows:0,outreachHoldPreserved:true,currentCatalogRegressionCheckPassed,hotelAndSoloRulesPassed:true,maybeMigrationPassed:true},null,2));
