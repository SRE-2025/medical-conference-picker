import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";import {defaults,trip,summary,tryAdd,issues,conflict,matches,toICS,restore,dateAdd,doctorBenchmark} from "./core.mjs";
const events=JSON.parse(fs.readFileSync(new URL("./data.json",import.meta.url))).events;
const get=n=>events.find(e=>e.name.includes(n));
test("catalog has distinct IDs, sourced facts and no invented attendance",()=>{assert.equal(events.length,150);assert.equal(new Set(events.map(e=>e.id)).size,150);assert.equal(events.filter(e=>e.fee!==null).length,22);for(const e of events){assert.match(e.priceUrl,/^https:/);if(e.attendance){assert.ok(e.attendance.count>0);assert.match(e.attendance.source,/^https:/);}}});
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
test("unknown fee remains incomplete; confirmed zero quote is valid",()=>{const p=defaults(events),e=get("Aesthetic Next");assert.equal(trip(e,p).fee,null);assert.equal(summary([e],p).missingFees,1);const q={[e.id]:0};assert.equal(trip(e,p,q).fee,0);assert.equal(summary([e],p,q).missingFees,0);});
test("small business rate requires an explicit business-size answer",()=>{const e=get("TNP Pharmacology"),p=defaults(events);assert.equal(trip(e,p).fee,2000);p.smallBusiness=true;assert.equal(trip(e,p).fee,750);});
test("missing fees cannot sneak through the quote filter",()=>{const p=defaults(events);p.includeUnknownFee=false;assert.ok(matches(get("Aesthetic Next"),p).includes("Exhibit quote needed"));});
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
