import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";import {defaults,trip,summary,tryAdd,issues,conflict,matches,toICS,restore,dateAdd,doctorBenchmark,REGIONS,STATES,BASES,schedulable,feeDetails,historicalFee,compareBoothFees} from "./core.mjs";
const catalog=JSON.parse(fs.readFileSync(new URL("./data.json",import.meta.url))),events=catalog.events;
const get=n=>events.find(e=>e.name.includes(n));
test("catalog has distinct IDs, sourced facts and consistent fee metadata",()=>{assert.equal(events.length,188);assert.equal(new Set(events.map(e=>e.id)).size,188);assert.equal(events.filter(e=>Number.isFinite(e.fee)).length,catalog.counts.priced);for(const e of events){assert.match(e.priceUrl,/^https:/);if(e.fee!==null)assert.ok(Number.isFinite(e.fee)&&e.fee>=0);if(e.attendance){assert.ok(e.attendance.count>0);assert.match(e.attendance.source,/^https:/);}}});
test("all actual same-week solo conflicts are blocked",()=>{const p=defaults(events),a=get("Aesthetic Next"),b=get("Texas Society of Plastic");assert.ok(conflict(a,b,p));const result=tryAdd(b,[a],p);assert.equal(result.ok,false);assert.deepEqual(result.conflicts,[a.id]);});
test("opening-day arrival and closing-day departure bill only intervening nights",()=>{
 const p=defaults(events),e=get("International Congress");
 const twoDay={...e,start:"2027-04-11",end:"2027-04-12",exhibitStart:null,exhibitEnd:null};
 const t=trip(twoDay,p);assert.equal(t.nights,1);assert.equal(t.hotel,175);assert.equal(t.from,twoDay.start);assert.equal(t.to,twoDay.end);assert.equal(t.tripDays,2);assert.equal(t.meals,130);assert.ok(t.transport>0);
 const threeDay=trip({...twoDay,end:"2027-04-13"},p);assert.equal(threeDay.nights,2);assert.equal(threeDay.hotel,350);
 const oneDay=trip({...twoDay,end:twoDay.start},p);assert.equal(oneDay.nights,0);assert.equal(oneDay.hotel,0);
 p.drive=false;assert.equal(trip(twoDay,p).nights,1);assert.equal(trip(twoDay,p).transport,570);
});
test("blackout dates block reserved show days",()=>{const p=defaults(events),e=get("International Congress");p.blocked=[{start:trip(e,p).from,end:trip(e,p).from}];assert.equal(tryAdd(e,[],p).ok,false);});
test("months apply to the entire trip and changed preferences flag old choices",()=>{const p=defaults(events),e=get("International Congress");p.months["2027-04"]=false;assert.match(tryAdd(e,[],p).reason,/month/);assert.ok(issues([e],p).some(i=>i.type==="calendar"));});
test("unknown fee remains incomplete; confirmed zero quote is valid",()=>{const p=defaults(events),e={...events[0],fee:null,conditionalFee:null,feeHistory:[]};assert.equal(trip(e,p).fee,null);assert.equal(summary([e],p).missingFees,1);const q={[e.id]:0};assert.equal(trip(e,p,q).fee,0);assert.equal(summary([e],p,q).missingFees,0);});
test("small business rate requires an explicit business-size answer",()=>{const e=get("TNP Pharmacology"),p=defaults(events);assert.equal(trip(e,p).fee,2000);p.smallBusiness=true;assert.equal(trip(e,p).fee,750);});
test("missing fees cannot sneak through the quote filter",()=>{const p=defaults(events);p.includeUnknownFee=false;assert.ok(matches({...events[0],fee:null,conditionalFee:null,feeHistory:[]},p).includes("Exhibit quote needed"));});
test("historical attendance can be excluded without becoming zero",()=>{const p=defaults(events),e=get("ASLMS");p.requireSize=true;p.minSize=500;p.includeUnknownSize=false;p.useHistorical=false;assert.ok(matches(e,p).includes("Attendance unknown"));p.useHistorical=true;assert.ok(!matches(e,p).includes("Attendance unknown"));});
test("circuit budget and monthly caps cannot be bypassed by adding yes",()=>{const p=defaults(events),e=get("International Congress");p.limitTotal=true;p.maxTotal=1;assert.equal(tryAdd(e,[],p).ok,false);p.limitTotal=false;p.limitMonth=true;p.maxMonth=0;assert.equal(tryAdd(e,[],p).ok,false);});
test("watchlist does not fabricate calendar reservations",()=>{const p=defaults(events),e=get("AmSpa");assert.ok(!e.start);const s=summary([e],p);assert.equal(s.watch,1);assert.equal(s.scheduled,0);assert.equal(s.incomplete,true);assert.ok(!toICS([e],p).includes("BEGIN:VEVENT"));});
test("calendar uses exclusive end dates and real reserved trip dates",()=>{const p=defaults(events),e=get("International Congress"),t=trip(e,p),ics=toICS([e],p);assert.ok(ics.includes("DTSTART;VALUE=DATE:"+t.from.replaceAll("-","")));assert.ok(ics.includes("DTEND;VALUE=DATE:"+dateAdd(t.to,1).replaceAll("-","")));});
test("backup restore validates IDs, decisions and nonnegative quotes",()=>{const p=defaults(events),e=events[0];const r=restore({version:1,preferences:{...p,base:"unknown",hotel:-3},decisions:{[e.id]:"yes",bad:"yes"},quotes:{[e.id]:0,bad:500},step:99},events);assert.equal(r.preferences.base,"Austin");assert.equal(r.preferences.hotel,175);assert.equal(r.quotes[e.id],0);assert.equal(r.decisions.bad,undefined);assert.equal(r.step,5);});


test("local multiday shows need no hotel; old setup choices cannot add nights",()=>{
 const e=get("International Congress"),p=defaults(events);
 assert.equal(trip({...e,coordinates:[30.267,-97.743]},p).nights,0);
 const r=restore({version:1,preferences:{...p,setup:true},decisions:{[e.id]:"yes"},quotes:{[e.id]:1234}},events);
 assert.equal(r.preferences.setup,undefined);assert.equal(r.decisions[e.id],"yes");assert.equal(r.quotes[e.id],1234);
 assert.equal(trip(e,r.preferences).from,e.start);assert.equal(trip(e,r.preferences).to,e.end);
});
test("published exhibit dates drive hotel cost and calendar exports",()=>{
 const e=get("ATS International"),p=defaults(events),t=trip(e,p);
 assert.equal(t.from,"2027-05-16");assert.equal(t.to,"2027-05-18");assert.equal(t.nights,2);
 const ics=toICS([e],p);assert.ok(ics.includes("DTSTART;VALUE=DATE:20270516"));assert.ok(ics.includes("DTEND;VALUE=DATE:20270519"));assert.ok(!ics.includes("Includes travel/setup allowance"));
 p.exhibitOnly=false;assert.equal(trip(e,p).nights,5);
});
test("doctor estimates, dental counts and trainee audiences keep their scope",()=>{
 const p=defaults(events),aslms=get("ASLMS"),tda=get("The TDA Meeting");
 assert.equal(doctorBenchmark(aslms,p).count,369);assert.equal(doctorBenchmark(aslms,p).kind,"calculated");
 assert.equal(doctorBenchmark(tda,p).audience,"dentists");assert.equal(doctorBenchmark(tda,p).count,1000);
 for(const name of ["ACC.27","ASDS Resident","Texas Radiological","Aesthetic Next"])assert.equal(doctorBenchmark(get(name),p),null);
 p.requireDoctors=true;p.minDoctors=400;assert.ok(matches(aslms,p).includes("Below minimum historical doctor count"));assert.ok(!matches(tda,p).includes("Below minimum historical doctor count"));
 p.minDoctors=1;p.allowDoctorEstimates=false;assert.equal(doctorBenchmark(aslms,p),null);assert.ok(matches(aslms,p).includes("Historical doctor count not verified"));
});
test("historical audience records have a year, source and nullable counts",()=>{
 assert.equal(events.filter(e=>e.doctorHistory).length,10);
 for(const e of events)for(const h of e.doctorHistory||[]){assert.ok(h.year>=2022&&h.year<=2026);assert.match(h.source,/^https:/);assert.ok(h.basis);assert.ok(h.count===null||h.count>0);assert.ok(h.label);}
});

test("Arkansas filters and restored old plans preserve prior decisions",()=>{
 const p=defaults(events),ar=events.find(e=>e.id==="AR01");
 assert.ok(STATES.some(([s])=>s==="AR"));assert.ok(p.states.AR);assert.equal(matches(ar,p).length,0);
 p.states.AR=false;assert.ok(matches(ar,p).includes("Place excluded"));
 const prior={...defaults(events),states:{TX:false,OK:true,LA:true},regions:{austin:false},categories:{Podiatry:false}};
 const restored=restore({version:1,preferences:prior,decisions:{TX31:"yes"},quotes:{TX31:1300},step:4},events);
 assert.equal(restored.preferences.states.TX,false);assert.equal(restored.preferences.states.AR,true);assert.equal(restored.preferences.regions.austin,false);assert.equal(restored.preferences.categories.Podiatry,false);assert.equal(restored.decisions.TX31,"yes");assert.equal(restored.quotes.TX31,1300);
});
test("two separate Arkansas seminars cannot be booked by one traveler",()=>{
 const p=defaults(events),a=events.find(e=>e.id==="AR03"),b=events.find(e=>e.id==="AR04");
 assert.notEqual(a.venue,b.venue);assert.ok(conflict(a,b,p));assert.equal(tryAdd(b,[a],p).ok,false);
 assert.equal(trip(a,p).nights,1);assert.equal(trip(a,p).from,"2026-12-05");assert.equal(trip(a,p).to,"2026-12-06");
});
test("new records keep actual geography, forecasts and unresolved dates separate",()=>{
 const p=defaults(events),regions=new Set(REGIONS.map(r=>r[0])),states=new Set(STATES.map(s=>s[0]));
 for(const e of events){assert.ok(states.has(e.state));assert.ok(regions.has(e.region));if(e.start){assert.ok(e.end>=e.start);if(e.coordinates)assert.equal(e.coordinates.length,2);}}
 for(const id of ["OK21","OK22","LA38","TX98"]){const e=events.find(e=>e.id===id);assert.equal(e.start,null);assert.equal(e.fee,null);assert.equal(schedulable(e),false);}
 assert.equal(events.filter(e=>e.state==="AR"&&e.category==="Podiatry").length,0);
 assert.equal(events.filter(e=>e.category==="Podiatry").length,14);
 assert.equal(doctorBenchmark(events.find(e=>e.id==="TX31"),p),null);
 assert.equal(events.find(e=>e.id==="TX31").attendance.year,2027);
 assert.equal(events.find(e=>e.id==="LA39").exhibitEnd,"2027-02-12");
});

test("historical fees require opt-in and remain provisional current-quote needs",()=>{
 const e={...events[0],fee:null,conditionalFee:null,feeHistory:[{year:2025,amount:950,label:"Commercial table",source:"https://example.org/2025-exhibits"},{year:2026,amount:1100,label:"Commercial table",source:"https://example.org/2026-exhibits"}]},p=defaults(events);
 assert.equal(p.useHistoricalFees,false);assert.equal(feeDetails(e,p).amount,null);
 assert.equal(historicalFee(e).year,2026);p.useHistoricalFees=true;
 const t=trip(e,p);assert.equal(t.fee,1100);assert.equal(t.feeInfo.kind,"historical");assert.equal(t.feeInfo.year,2026);assert.equal(t.incomplete,true);
 const s=summary([e],p);assert.equal(s.historicalFees,1);assert.equal(s.missingFees,1);assert.equal(s.incomplete,true);
 p.includeUnknownFee=false;assert.ok(matches(e,p).includes("Exhibit quote needed"));
 const q={[e.id]:0};assert.equal(trip(e,p,q).fee,0);assert.equal(trip(e,p,q).feeInfo.kind,"quote");assert.ok(!matches(e,p,q).includes("Exhibit quote needed"));
 p.hotel=999;assert.equal(trip(e,p).nights,trip(e,{...p,useHistoricalFees:false}).nights);
});

test("current rates and manual quotes override history; savings never qualify themselves",()=>{
 const e={...events[0],fee:1600,conditionalFee:null,feeHistory:[{year:2026,amount:900,label:"Table",source:"https://example.org/2026"}],feeSavings:[{year:2027,amount:250,label:"Restricted rate",eligibility:"Nonprofit only",source:"https://example.org/2027"}]},p={...defaults(events),useHistoricalFees:true};
 assert.equal(feeDetails(e,p).amount,1600);assert.equal(feeDetails(e,p).kind,"published");
 assert.equal(feeDetails(e,p,{[e.id]:1450}).amount,1450);
 assert.equal(feeDetails({...e,fee:null,feeHistory:[]},p).amount,null);
 assert.equal(feeDetails({...e,conditionalFee:750},p).amount,1600);
 p.smallBusiness=true;assert.equal(feeDetails({...e,conditionalFee:750},p).amount,750);
});

test("historical planning estimates prefer the latest standard fee over expired early rates",()=>{
 const source="https://example.org/exhibits",e={...events[0],fee:null,conditionalFee:null,feeHistory:[{year:2025,amount:2500,label:"Standard table",source},{year:2026,amount:1800,label:"Early table before deadline",source},{year:2026,amount:2000,label:"Standard table",source}]},p={...defaults(events),useHistoricalFees:true};
 assert.equal(historicalFee(e).year,2026);assert.equal(historicalFee(e).amount,2000);assert.equal(trip(e,p).fee,2000);assert.equal(trip(e,p).incomplete,true);assert.equal(e.feeHistory.length,3);
});

test("booth-only sorting keeps unknowns last and ignores travel costs",()=>{
 const p=defaults(events),items=[{...events[0],id:"unknown",name:"Unknown",fee:null,conditionalFee:null,feeHistory:[]},{...events[0],id:"high",name:"High",fee:1000},{...events[0],id:"zero",name:"Zero",fee:0},{...events[0],id:"low",name:"Low",fee:350}];
 assert.deepEqual(items.sort((a,b)=>compareBoothFees(a,b,p)).map(e=>e.id),["zero","low","high","unknown"]);
 const r=restore({version:1,preferences:{...p,useHistoricalFees:true},decisions:{[events[0].id]:"later"},quotes:{}},events);
 assert.equal(r.preferences.useHistoricalFees,true);assert.equal(r.decisions[events[0].id],"later");
});

test("sourced fee histories and conditional options retain amount, year and source",()=>{
 for(const e of events){for(const h of [...(e.feeHistory||[]),...(e.feeSavings||[])]){assert.ok(Number.isInteger(h.year));assert.ok(Number.isFinite(h.amount)&&h.amount>=0);assert.match(h.source,/^https:\/\//);assert.ok(h.label);}
 if(e.feeAudit){assert.equal(e.feeAudit.checked,"2026-11-17");assert.ok(["current","historical","not_public","restricted","unresolved"].includes(e.feeAudit.status));assert.ok(e.feeAudit.summary);assert.ok(Array.isArray(e.feeAudit.sources));}}
});

test("TexMed lead retrieval is an editable add-on for TX06 only",()=>{
 const p=defaults(events),e={...events.find(e=>e.id==="TX06"),fee:1000,coordinates:BASES.Austin,start:"2027-04-01",end:"2027-04-01",exhibitStart:null,exhibitEnd:null};
 const t=trip(e,p);assert.equal(p.extras,300);assert.equal(p.kit,1000);assert.equal(p.contingency,10);assert.equal(t.retrieval,350);assert.equal(t.baseMinimum,1740);assert.equal(t.contingency,174);assert.equal(t.minimum,1914);
 assert.equal(trip({...e,id:"another"},p).retrieval,0);
 assert.equal(trip(e,{...p,texmedLeadRetrieval:false}).minimum,1529);
 assert.equal(trip(e,{...p,texmedLeadFee:200}).retrieval,200);
});

test("circuit contingency includes the reusable kit once without compounding event reserves",()=>{
 const p=defaults(events),a={...events[0],id:"TX06",fee:1000,coordinates:BASES.Austin,start:"2027-04-01",end:"2027-04-01",exhibitStart:null,exhibitEnd:null},b={...a,id:"other"};
 const s=summary([a,b],p);assert.equal(s.kit,1000);assert.equal(s.retrieval,350);assert.equal(s.baseMinimum,4130);assert.equal(s.contingency,413);assert.equal(s.minimum,4543);
 assert.equal(s.minimum,trip(a,p).minimum+trip(b,p).minimum+1100);
 const empty=summary([],p);assert.equal(empty.minimum,0);assert.equal(empty.kit,0);assert.equal(empty.contingency,0);
 const noReserve=summary([a,b],{...p,contingency:0});assert.equal(noReserve.minimum,s.baseMinimum);assert.equal(noReserve.contingency,0);
});

test("contingency and optional retrieval cannot make missing fees complete or bypass budget caps",()=>{
 const p=defaults(events),e={...events[0],id:"TX06",fee:null,conditionalFee:null,feeHistory:[],coordinates:BASES.Austin,start:"2027-04-01",end:"2027-04-01",exhibitStart:null,exhibitEnd:null};
 const t=trip(e,p);assert.equal(t.baseMinimum,740);assert.equal(t.contingency,74);assert.equal(t.minimum,814);assert.equal(t.incomplete,true);assert.equal(summary([e],p).missingFees,1);
 p.limitEvent=true;p.maxEvent=800;assert.ok(matches(e,p).includes("Over event budget"));assert.equal(tryAdd(e,[],p).ok,false);
 p.limitEvent=false;p.limitTotal=true;p.maxTotal=1900;assert.equal(tryAdd(e,[],p).ok,false);
});

test("saved allowances and choices survive new workbook-based defaults",()=>{
 const e=events[0],old={...defaults(events),extras:250,kit:750,hotel:155};delete old.contingency;delete old.texmedLeadRetrieval;delete old.texmedLeadFee;
 const r=restore({version:1,preferences:old,decisions:{[e.id]:"later"},quotes:{[e.id]:1100}},events);
 assert.equal(r.preferences.extras,250);assert.equal(r.preferences.kit,750);assert.equal(r.preferences.hotel,155);assert.equal(r.preferences.contingency,10);assert.equal(r.preferences.texmedLeadRetrieval,true);assert.equal(r.preferences.texmedLeadFee,350);assert.equal(r.decisions[e.id],"later");assert.equal(r.quotes[e.id],1100);
 const custom=restore({version:1,preferences:{...old,contingency:0,texmedLeadRetrieval:false,texmedLeadFee:225},decisions:{}},events);
 assert.equal(custom.preferences.contingency,0);assert.equal(custom.preferences.texmedLeadRetrieval,false);assert.equal(custom.preferences.texmedLeadFee,225);
});


