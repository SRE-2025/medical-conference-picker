import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));
const events=catalog.events;
const byId=new Map(events.map(e=>[e.id,e]));
const statuses=new Set(['current','historical','not_public','restricted','unresolved']);
const allowed=new Set(['fee','conditionalFee','priceType','priceUrl','deadline','includes','notes','feeHistory','feeSavings','feeAudit']);
const errors=[];
const warnings=[];
const seen=new Set();
const isUrl=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
const check=(condition,message)=>{if(!condition)errors.push(message);};

function validate(event,updates){
  const id=event.id;
  const audit=updates.feeAudit;
  check(audit&&statuses.has(audit.status),`${id}: missing or invalid feeAudit.status`);
  check(audit?.checked==='2026-11-17',`${id}: wrong audit check date`);
  check(typeof audit?.summary==='string'&&audit.summary.trim().length>15,`${id}: audit summary needed`);
  check(Array.isArray(audit?.sources)&&audit.sources.length>0&&audit.sources.every(isUrl),`${id}: at least one valid HTTPS audit source required`);
  for(const key of ['fee','conditionalFee'])if(key in updates)check(updates[key]===null||Number.isFinite(updates[key])&&updates[key]>=0,`${id}: invalid ${key}`);
  if('priceUrl' in updates)check(isUrl(updates.priceUrl),`${id}: invalid current price source`);
  if('deadline' in updates&&updates.deadline!==null)check(/^\d{4}-\d{2}-\d{2}$/.test(updates.deadline),`${id}: invalid deadline`);
  for(const kind of ['feeHistory','feeSavings']){
    const records=updates[kind]||[];
    check(Array.isArray(records),`${id}: ${kind} must be an array`);
    if(!Array.isArray(records))continue;
    for(const record of records){
      check(Number.isInteger(record.year)&&record.year>=2000&&record.year<=2027,`${id}: invalid ${kind} year`);
      if(kind==='feeHistory')check(record.year<=2026,`${id}: historical fee cannot come from a future edition`);
      check(Number.isFinite(record.amount)&&record.amount>=0,`${id}: invalid ${kind} amount`);
      check(typeof record.label==='string'&&record.label.length>3,`${id}: ${kind} label needed`);
      check(isUrl(record.source),`${id}: invalid ${kind} source`);
      check(typeof record.conditions==='string'&&record.conditions.length>5,`${id}: ${kind} conditions needed`);
      if(kind==='feeSavings')check(typeof record.eligibility==='string'&&record.eligibility.length>3,`${id}: savings eligibility needed`);
      if(/non.?profit|resident|student|tuition|attendee registration/i.test(record.label||''))warnings.push(`${id}: manually review restricted/non-exhibit rate: ${record.label}`);
    }
  }
  if(audit?.status==='current'&&!Number.isFinite(updates.fee??event.fee))warnings.push(`${id}: audit says current without a standard numeric commercial fee`);
}

if(process.argv.includes('--patches')){
  for(let part=0;part<4;part++){
    const name=path.join(root,'research',`fees-${part}.json`);
    if(!fs.existsSync(name)){errors.push(`Missing research/fees-${part}.json`);continue;}
    const rows=JSON.parse(fs.readFileSync(name,'utf8'));
    check(Array.isArray(rows),`${name}: array required`);
    if(!Array.isArray(rows))continue;
    const assigned=events.filter((_,index)=>index%4===part);
    check(rows.length===assigned.length,`fees-${part}: expected ${assigned.length} records, got ${rows.length}`);
    const assignment=new Set(assigned.map(e=>e.id));
    for(const row of rows){
      check(assignment.has(row.id),`fees-${part}: unassigned/unknown ${row.id}`);
      check(!seen.has(row.id),`Duplicate event ${row.id}`);seen.add(row.id);
      check(row.updates&&typeof row.updates==='object',`${row.id}: missing updates`);
      if(!row.updates)continue;
      for(const key of Object.keys(row.updates))check(allowed.has(key),`${row.id}: unauthorized update field ${key}`);
      if(byId.has(row.id))validate(byId.get(row.id),row.updates);
    }
  }
  check(seen.size===events.length,`Expected complete audit of ${events.length} events, got ${seen.size}`);
}else{
  for(const event of events)validate(event,event);
}

for(const warning of warnings)console.warn('REVIEW:',warning);
for(const error of errors)console.error('ERROR:',error);
console.log(JSON.stringify({mode:process.argv.includes('--patches')?'patches':'catalog',events:events.length,reviewWarnings:warnings.length,errors:errors.length}));
if(errors.length)process.exitCode=1;
