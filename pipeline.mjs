export const LEAD_HEADERS=['Lead ID','Event ID','Practice','Website / domain','City','State','Specialty','Contact','Role','Work email','Phone','Follow-up permission','Stage','First touch','Last touch','Next action date','Next action','Owner','Monthly proposal (USD)','Setup fee (USD)','Outcome / lost reason','Outreach eligibility','Notes','Next-action status'];
export const PERMISSION_OPTIONS=['Unknown','Permission granted','Organizer-permitted follow-up','Do not contact'];
export const ELIGIBILITY_OPTIONS=['Unknown — human review needed','Hold — Longview-area chiropractic','Do not contact','Reviewed — permitted'];
export const STAGE_OPTIONS=['Research','Contact identified','Meeting planned','Conversation held','Audit agreed','Audit delivered','Proposal','Won','Lost','On hold'];
export const OUTREACH_HOLD='Keep chiropractic practices in Longview and surrounding areas on hold. Confirm the area and eligibility yourself; no distance rule or automatic permission is inferred.';
export function planningDate(){return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Los_Angeles'}).format(new Date());}
export function nextActionStatus(lead,today=planningDate()){
 if(/do not contact/i.test(lead['Follow-up permission']||'')||/hold|do not contact/i.test(lead['Outreach eligibility']||'')||lead.Stage==='On hold')return 'On hold';
 if(['Won','Lost'].includes(lead.Stage))return 'Closed';
 const due=lead['Next action date'];
 return !due?'No next action date':due<today?'Overdue':due===today?'Due today':'Planned';
}
export function createLead(eventId=''){
 const id=globalThis.crypto?.randomUUID?.()||'lead-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 const lead={id,...Object.fromEntries(LEAD_HEADERS.map(h=>[h,'']))};
 lead['Lead ID']='L-'+id.slice(-8);lead['Event ID']=eventId;lead.Stage='Research';lead['Follow-up permission']='Unknown';lead['Outreach eligibility']=ELIGIBILITY_OPTIONS[0];
 return lead;
}
export function restoreLeads(raw){
 if(raw===undefined)return [];
 if(!Array.isArray(raw)||raw.length>5000)throw Error('The lead pipeline must contain at most 5,000 rows.');
 const ids=new Set();
 return raw.map((record,index)=>{
  if(!record||typeof record!=='object'||Array.isArray(record))throw Error('Invalid lead row '+(index+1)+'.');
  const lead={id:typeof record.id==='string'&&record.id?record.id:'imported-lead-'+index};
  if(ids.has(lead.id))throw Error('Duplicate lead record identifier.');ids.add(lead.id);
  for(const header of LEAD_HEADERS){const value=record[header]??'';if(typeof value!=='string'&&typeof value!=='number')throw Error('Invalid lead field: '+header);lead[header]=String(value);if(lead[header].length>20000)throw Error('Lead field is too long: '+header);}
  lead['Follow-up permission']||='Unknown';lead['Outreach eligibility']||=ELIGIBILITY_OPTIONS[0];lead.Stage||='Research';
  for(const header of ['First touch','Last touch','Next action date'])if(lead[header]){const value=lead[header],parsed=new Date(value+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw Error('Use a valid YYYY-MM-DD date for '+header+'.');}
  for(const header of ['Monthly proposal (USD)','Setup fee (USD)'])if(lead[header]!==''&&(!Number.isFinite(Number(lead[header]))||Number(lead[header])<0))throw Error('Enter a nonnegative amount for '+header+'.');
  lead['Next-action status']=nextActionStatus(lead);return lead;
 });
}
export function toLeadCSV(leads,today=planningDate()){
 const safe=value=>{const text=String(value??'');return /^\s*[=+@-]/.test(text)||/^[\t\r]/.test(text)?'\''+text:text;};
 const rows=[LEAD_HEADERS,...leads.map(lead=>LEAD_HEADERS.map(header=>header==='Next-action status'?nextActionStatus(lead,today):lead[header]))];
 return '\uFEFF'+rows.map(row=>row.map(value=>'"'+safe(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
}
