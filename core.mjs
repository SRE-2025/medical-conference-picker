export const DAY=86400000;
export const STATES=[["TX","Texas"],["OK","Oklahoma"],["LA","Louisiana"],["AR","Arkansas"]];
export const REGIONS=[["austin","Austin & Hill Country","TX"],["dfw","Dallas–Fort Worth","TX"],["houston","Houston & The Woodlands","TX"],["sanantonio","San Antonio","TX"],["TXother","Other / unconfirmed Texas","TX"],["okc","Oklahoma City","OK"],["tulsa","Tulsa & northeast Oklahoma","OK"],["OKother","Other / unconfirmed Oklahoma","OK"],["nola","New Orleans","LA"],["LAother","Other / unconfirmed Louisiana","LA"],["littlerock","Little Rock & central Arkansas","AR"],["hotsprings","Hot Springs","AR"],["nwarkansas","Northwest Arkansas","AR"],["ARother","Other / unconfirmed Arkansas","AR"]];
export const BASES={Austin:[30.267,-97.743],Dallas:[32.777,-96.797],Houston:[29.760,-95.370],"San Antonio":[29.424,-98.494],"Oklahoma City":[35.468,-97.516],Tulsa:[36.154,-95.992],"New Orleans":[29.951,-90.072],"Little Rock":[34.746,-92.290],"Hot Springs":[34.503,-93.055],Fayetteville:[36.063,-94.157]};
export const MONTHS=Array.from({length:13},(_,i)=>i===0?"2026-12":"2027-"+String(i).padStart(2,"0"));
export const stamp=s=>Date.parse(s+"T12:00:00Z")/DAY;
export const iso=n=>new Date(n*DAY).toISOString().slice(0,10);
export const dateAdd=(s,n)=>iso(stamp(s)+n);
export const days=(a,b)=>Math.round(stamp(b)-stamp(a));
export function defaults(events){return {states:Object.fromEntries(STATES.map(([state])=>[state,true])),regions:Object.fromEntries(REGIONS.map(r=>[r[0],true])),months:Object.fromEntries(MONTHS.map(m=>[m,true])),categories:Object.fromEntries(events.map(e=>[e.category,true])),base:"Austin",drive:true,rest:true,exhibitOnly:true,includeWatch:true,includeUnknownFee:true,limitEvent:false,maxEvent:4000,limitTotal:false,maxTotal:15000,limitMonth:false,maxMonth:2,requireSize:false,minSize:300,requireDoctors:false,minDoctors:100,allowDoctorEstimates:true,includeUnknownSize:true,useHistorical:true,useHistoricalFees:false,smallBusiness:false,hotel:175,food:65,parking:25,mileRate:0.55,flight:450,extras:300,kit:1000,contingency:10,texmedLeadRetrieval:true,texmedLeadFee:350,blocked:[]};}
export function miles(a,b){if(!a||!b)return null;const rad=x=>x*Math.PI/180;const dlat=rad(b[0]-a[0]),dlon=rad(b[1]-a[1]);return 3958.8*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2));}
export function historicalFee(e){
 const early=h=>/\bearly\b|\badvance\b|\bdeadline\b/i.test(h.label||"");
 return (e.feeHistory||[]).filter(h=>Number.isInteger(h.year)&&Number.isFinite(h.amount)&&h.amount>=0&&/^https:\/\//.test(h.source||"")).slice().sort((a,b)=>b.year-a.year||early(a)-early(b)||a.amount-b.amount)[0]||null;
}
export function feeDetails(e,p,quotes={}){
 const year=e.start?Number(e.start.slice(0,4)):null;
 if(Number.isFinite(quotes[e.id])&&quotes[e.id]>=0)return {amount:quotes[e.id],basis:"Your entered quote",kind:"quote",year,source:null,provisional:false};
 if(p.smallBusiness&&Number.isFinite(e.conditionalFee)&&e.conditionalFee>=0)return {amount:e.conditionalFee,basis:"Conditional small-business rate",kind:"conditional",year,source:e.priceUrl,provisional:false};
 if(Number.isFinite(e.fee)&&e.fee>=0)return {amount:e.fee,basis:e.priceType||"Published exhibit fee",kind:"published",year,source:e.priceUrl,provisional:false};
 const history=p.useHistoricalFees&&historicalFee(e);
 if(history)return {amount:history.amount,basis:history.year+" historical estimate - current quote needed",kind:"historical",year:history.year,source:history.source,provisional:true};
 return {amount:null,basis:"Current exhibit quote needed",kind:"unknown",year:null,source:e.priceUrl,provisional:true};
}
export function eventFee(e,p,quotes={}){return feeDetails(e,p,quotes).amount;}
export function compareBoothFees(a,b,p,quotes={}){const x=eventFee(a,p,quotes),y=eventFee(b,p,quotes);return (x===null)-(y===null)||(x??0)-(y??0)||a.name.localeCompare(b.name);}
export function span(e,p){if(!e.start||!e.end)return null;return {start:p.exhibitOnly&&e.exhibitStart?e.exhibitStart:e.start,end:p.exhibitOnly&&e.exhibitEnd?e.exhibitEnd:e.end};}
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
const contingencyFor=(amount,p)=>cents(amount*(Number.isFinite(p.contingency)&&p.contingency>=0?p.contingency:0)/100);
export function trip(e,p,quotes={}){
 const s=span(e,p),straight=miles(BASES[p.base],e.coordinates),road=straight===null?null:Math.round(straight*1.2),local=road!==null&&road<=60;
 const duration=s?days(s.start,s.end)+1:null;
 const tripDays=duration;
 const nights=duration===null||road===null?null:local?0:Math.max(0,duration-1);
 const transport=road===null?null:local||p.drive?road*2*p.mileRate:p.flight+120;
 const hotel=nights===null?null:nights*p.hotel;
 const meals=tripDays===null?null:tripDays*p.food;
 const parking=duration===null?null:duration*p.parking;
 const feeInfo=feeDetails(e,p,quotes),fee=feeInfo.amount;
 const retrieval=e.id==="TX06"&&p.texmedLeadRetrieval?p.texmedLeadFee:0;
 const baseMinimum=cents([fee,transport,hotel,meals,parking,p.extras,retrieval].filter(Number.isFinite).reduce((a,b)=>a+b,0));
 const contingency=contingencyFor(baseMinimum,p),minimum=cents(baseMinimum+contingency);
 return {fee,feeInfo,road,local,duration,tripDays,nights,transport,hotel,meals,parking,extras:p.extras,retrieval,baseMinimum,contingency,minimum,incomplete:feeInfo.provisional||transport===null||duration===null,
 from:s?s.start:null,to:s?s.end:null};
}
export function doctorBenchmark(e,p={allowDoctorEstimates:true}){
 return (e.doctorHistory||[]).filter(h=>Number.isFinite(h.count)&&["physicians","dentists"].includes(h.audience)&&["reported","calculated"].includes(h.kind)&&(h.kind!=="calculated"||p.allowDoctorEstimates)).sort((a,b)=>b.year-a.year)[0]||null;
}
export function schedulable(e){return !!e.start&&!!e.end&&e.location==="In-state venue posted"&&Array.isArray(e.coordinates);}
export function conflict(a,b,p){
 if(!schedulable(a)||!schedulable(b))return false;
 const x=trip(a,p),y=trip(b,p);const [earlier,later]=stamp(x.from)<=stamp(y.from)?[x,y]:[y,x];
 return days(earlier.to,later.from)-1<(p.rest?1:0);
}
export function blocked(e,p){const t=trip(e,p);if(!t.from||!t.to)return false;return p.blocked.some(b=>stamp(t.from)<=stamp(b.end)&&stamp(t.to)>=stamp(b.start));}
export function matches(e,p,quotes={}){
 const why=[];if(!p.states[e.state]||!p.regions[e.region])why.push("Place excluded");
 if(!p.categories[e.category])why.push("Specialty excluded");
 if(!schedulable(e)){if(!p.includeWatch)why.push("Dates / location pending");}
 else {const t=trip(e,p,quotes);let n=stamp(t.from);for(;n<=stamp(t.to);n++)if(!p.months[iso(n).slice(0,7)]){why.push("Show falls outside chosen months");break;}if(blocked(e,p))why.push("Overlaps your unavailable dates");}
 const t=trip(e,p,quotes);if(t.feeInfo.provisional&&!p.includeUnknownFee)why.push("Exhibit quote needed");
 if(p.limitEvent&&t.minimum>p.maxEvent)why.push("Over event budget");
 const knownSize=e.attendance&&(!/benchmark|20\d{2} actual|2026 organizer|annual average|annual description|typical/i.test(e.attendance.basis)||p.useHistorical);
 if(p.requireSize){if(!knownSize&&!p.includeUnknownSize)why.push("Attendance unknown");else if(knownSize&&e.attendance.count<p.minSize)why.push("Below minimum show size");}
 const doctors=doctorBenchmark(e,p);if(p.requireDoctors){if(!doctors)why.push("Historical doctor count not verified");else if(doctors.count<p.minDoctors)why.push("Below minimum historical doctor count");}
 return why;
}
export function summary(selected,p,quotes={}){
 const trips=selected.map(e=>trip(e,p,quotes));
 const kit=selected.length?p.kit:0,baseMinimum=cents(trips.reduce((s,t)=>s+t.baseMinimum,0)+kit),contingency=contingencyFor(baseMinimum,p);
 return {count:selected.length,scheduled:selected.filter(schedulable).length,watch:selected.filter(e=>!schedulable(e)).length,kit,retrieval:cents(trips.reduce((s,t)=>s+t.retrieval,0)),baseMinimum,contingency,minimum:cents(baseMinimum+contingency),missingFees:trips.filter(t=>t.feeInfo.provisional).length,historicalFees:trips.filter(t=>t.feeInfo.kind==="historical").length,incomplete:trips.some(t=>t.incomplete),days:trips.filter(t=>t.tripDays!==null).reduce((s,t)=>s+t.tripDays,0)};
}
export function issues(selected,p,quotes={}){
 const out=[];for(let i=0;i<selected.length;i++){const e=selected[i];if(schedulable(e)&&blocked(e,p))out.push({ids:[e.id],type:"calendar",text:e.name+" overlaps your unavailable dates."});if(schedulable(e)&&matches(e,p,quotes).includes("Show falls outside chosen months"))out.push({ids:[e.id],type:"calendar",text:e.name+" falls outside your available months."});for(let j=i+1;j<selected.length;j++)if(conflict(e,selected[j],p))out.push({ids:[e.id,selected[j].id],type:"calendar",text:e.name+" conflicts with "+selected[j].name+" including show dates and your between-show buffer."});if(p.limitEvent&&trip(e,p,quotes).minimum>p.maxEvent)out.push({ids:[e.id],type:"budget",text:e.name+" exceeds your event cap."});}
 const s=summary(selected,p,quotes);if(p.limitTotal&&s.minimum>p.maxTotal)out.push({ids:[],type:"budget",text:"Your known planning subtotal exceeds your circuit cap."});
 if(p.limitMonth){const by={};for(const e of selected.filter(schedulable)){const m=span(e,p).start.slice(0,7);(by[m]??=[]).push(e.id);}for(const [m,ids] of Object.entries(by))if(ids.length>p.maxMonth)out.push({ids,type:"calendar",text:m+" exceeds your "+p.maxMonth+"-show monthly limit."});}
 return out;
}
export function tryAdd(e,selected,p,quotes={}){
 const rest=selected.filter(x=>x.id!==e.id),collisions=rest.filter(x=>conflict(e,x,p));
 if(schedulable(e)&&blocked(e,p))return {ok:false,reason:"This trip overlaps a date you marked unavailable.",conflicts:[]};
 if(schedulable(e)&&matches(e,p,quotes).includes("Show falls outside chosen months"))return {ok:false,reason:"This show falls in a month you marked unavailable. Update Your calendar first.",conflicts:[]};
 if(collisions.length)return {ok:false,reason:"One person cannot cover these shows with your current dates and between-show buffer.",conflicts:collisions.map(x=>x.id)};
 const all=[...rest,e],problems=issues(all,p,quotes).filter(x=>x.type==="budget"||x.type==="calendar"&&x.text.includes("monthly"));
 if(problems.length)return {ok:false,reason:problems[0].text,conflicts:[]};
 return {ok:true,conflicts:[]};
}
export function toICS(selected,p){
 const esc=s=>String(s).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Stoneridge//Conference Circuit//EN","CALSCALE:GREGORIAN"];
 for(const e of selected.filter(schedulable)){const t=trip(e,p);lines.push("BEGIN:VEVENT","UID:"+e.id+"-2027@stoneridge-conference-picker","DTSTAMP:20261117T120000Z","DTSTART;VALUE=DATE:"+t.from.replaceAll("-",""),"DTEND;VALUE=DATE:"+dateAdd(t.to,1).replaceAll("-",""),"SUMMARY:"+esc(e.name+" — planned trip"),"LOCATION:"+esc([e.venue,e.city,e.state].filter(Boolean).join(", ")),"DESCRIPTION:"+esc("Planning hold, not a reservation. Arrive opening day and leave when the show ends. Hotel nights only between show days. Confirm travel and exhibitor setup hours. Conference "+e.start+" through "+e.end+". "+e.url),"END:VEVENT");}
 return lines.concat("END:VCALENDAR").join("\r\n");
}
export function restore(raw,events){
 if(!raw||raw.version!==1||!raw.preferences||!raw.decisions)throw Error("Choose a Conference Circuit backup file.");
 const p=defaults(events),q=raw.preferences;for(const key of Object.keys(p)){if(["states","regions","months","categories"].includes(key)){for(const k of Object.keys(p[key]))if(typeof q[key]?.[k]==="boolean")p[key][k]=q[key][k];}else if(key==="blocked"){p.blocked=Array.isArray(q.blocked)?q.blocked.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.start)&&/^\d{4}-\d{2}-\d{2}$/.test(x.end)&&Number.isFinite(stamp(x.start))&&stamp(x.start)<=stamp(x.end)).slice(0,100):[];}else if(typeof p[key]==="boolean"&&typeof q[key]==="boolean")p[key]=q[key];else if(typeof p[key]==="number"&&Number.isFinite(q[key])&&q[key]>=0&&q[key]<1000000)p[key]=q[key];}
 if(BASES[q.base])p.base=q.base;const ids=new Set(events.map(e=>e.id)),decisions={},quotes={};for(const [id,v]of Object.entries(raw.decisions))if(ids.has(id)&&["yes","no","later"].includes(v))decisions[id]=v;for(const [id,v]of Object.entries(raw.quotes||{}))if(ids.has(id)&&Number.isFinite(v)&&v>=0&&v<1000000)quotes[id]=v;
 return {preferences:p,decisions,quotes,step:Number.isInteger(raw.step)?Math.max(0,Math.min(5,raw.step)):0};
}


