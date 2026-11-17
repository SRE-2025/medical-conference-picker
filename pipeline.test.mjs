import test from 'node:test';
import assert from 'node:assert/strict';
import {LEAD_HEADERS,createLead,restoreLeads,nextActionStatus,toLeadCSV,ELIGIBILITY_OPTIONS} from './pipeline.mjs';

test('blank original template becomes no invented leads; a new lead keeps all 24 fields and unknown permission',()=>{
 assert.equal(LEAD_HEADERS.length,24);assert.deepEqual(restoreLeads(undefined),[]);
 const lead=createLead('TX06');for(const field of LEAD_HEADERS)assert.ok(Object.hasOwn(lead,field));
 assert.equal(lead['Event ID'],'TX06');assert.equal(lead['Follow-up permission'],'Unknown');assert.equal(lead['Outreach eligibility'],ELIGIBILITY_OPTIONS[0]);
});
test('restore preserves all original columns and rejects invalid money, dates and duplicate identifiers',()=>{
 const lead=createLead('LA29');lead.Practice='A practice';lead.Notes='Original note';lead['Monthly proposal (USD)']='149';
 const restored=restoreLeads(JSON.parse(JSON.stringify([lead])))[0];for(const field of LEAD_HEADERS.filter(h=>h!=='Next-action status'))assert.equal(restored[field],lead[field]);
 assert.throws(()=>restoreLeads([lead,lead]),/Duplicate/);assert.throws(()=>restoreLeads([{...lead,'Setup fee (USD)':'-1'}]),/nonnegative/);for(const invalid of ['tomorrow','2026-99-99','2027-02-30'])assert.throws(()=>restoreLeads([{...lead,'Next action date':invalid}]),/YYYY-MM-DD/);
});
test('manual outreach holds and do-not-contact override dated follow-up; no geography is inferred',()=>{
 const lead=createLead();lead.City='Longview';lead.Specialty='Chiropractic';lead['Next action date']='2026-11-16';
 assert.equal(nextActionStatus(lead,'2026-11-17'),'Overdue');assert.equal(lead['Outreach eligibility'],ELIGIBILITY_OPTIONS[0]);
 lead['Outreach eligibility']=ELIGIBILITY_OPTIONS[1];assert.equal(nextActionStatus(lead,'2026-11-17'),'On hold');
 lead['Outreach eligibility']=ELIGIBILITY_OPTIONS[0];lead['Follow-up permission']='Do not contact';assert.equal(nextActionStatus(lead,'2026-11-17'),'On hold');
});
test('CSV retains exact original headers, derived due status, commas/newlines and spreadsheet-safe values',()=>{
 const lead=createLead('TX06');lead.Practice='=A1';lead.Notes='A, B\nSecond line';lead['Next action date']='2026-11-17';
 const csv=toLeadCSV([lead],'2026-11-17');assert.ok(csv.startsWith('\uFEFF"Lead ID","Event ID"'));assert.ok(csv.includes('"\'=A1"'));assert.ok(csv.includes('"A, B\nSecond line"'));assert.ok(csv.includes('"Due today"'));
});
