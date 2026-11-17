import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const dataPath = new URL('data.json', root);
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const allowed = new Set(['fee','conditionalFee','priceType','priceUrl','deadline','includes','notes','feeHistory','feeSavings','feeAudit']);
const statuses = new Set(['current','historical','not_public','restricted','unresolved']);
const ids = new Set(data.events.map(e => e.id));
const updates = new Map();
for (let i = 0; i < 4; i++) {
  const rows = JSON.parse(fs.readFileSync(new URL(`fees-${i}.json`, import.meta.url), 'utf8'));
  assert.ok(Array.isArray(rows));
  const assigned = data.events.filter((_, index) => index % 4 === i).map(e => e.id);
  assert.deepEqual(rows.map(r => r.id).sort(), assigned.sort(), `Research group ${i} must cover all assigned events exactly once`);
  for (const {id, updates: patch} of rows) {
    assert.ok(ids.has(id) && !updates.has(id), `Duplicate/unknown event ${id}`);
    assert.ok(patch && typeof patch === 'object');
    for (const key of Object.keys(patch)) assert.ok(allowed.has(key), `${id}: unexpected update ${key}`);
    for (const key of ['fee','conditionalFee']) if (key in patch) assert.ok(patch[key] === null || Number.isFinite(patch[key]) && patch[key] >= 0, `${id}: invalid ${key}`);
    const audit = patch.feeAudit;
    assert.equal(audit?.checked, '2026-11-17');
    assert.ok(statuses.has(audit.status), `${id}: invalid audit status`);
    assert.ok(audit.summary?.trim() && Array.isArray(audit.sources) && audit.sources.length, `${id}: missing audit evidence`);
    for (const source of audit.sources) assert.match(source, /^https:\/\//);
    for (const key of ['feeHistory','feeSavings']) for (const option of patch[key] || []) {
      assert.ok(Number.isFinite(option.amount) && option.amount >= 0, `${id}: invalid option amount`);
      assert.ok(Number.isInteger(option.year) && option.year >= 2010 && option.year <= 2027, `${id}: missing option year`);
      assert.ok(option.label?.trim() && option.conditions?.trim(), `${id}: missing option conditions`);
      assert.match(option.source, /^https:\/\//);
      if (key === 'feeHistory') assert.ok(option.year < 2027, `${id}: current year cannot be historical`);
    }
    updates.set(id, patch);
  }
}
assert.equal(updates.size, data.events.length);
data.events = data.events.map(e => ({...e, ...updates.get(e.id)}));
// Organizer facts newly resolved during the fee review; IDs stay unchanged.
Object.assign(data.events.find(e=>e.id==='TX90'), {
  name:'Independent Medical Alliance Medical Education Conference',
  venue:'Omni Las Colinas Hotel'
});
Object.assign(data.events.find(e=>e.id==='LA21'), {
  city:'Baton Rouge', coordinates:[30.451,-91.187], venue:'Renaissance Hotel Baton Rouge',
  start:'2027-08-13', end:'2027-08-15', dateStatus:'Dates posted', location:'In-state venue posted',
  notes:data.events.find(e=>e.id==='LA21').notes.startsWith('Organizer posts August 13-15, 2027') ? data.events.find(e=>e.id==='LA21').notes : 'Organizer posts August 13-15, 2027 at Renaissance Hotel in Baton Rouge. ' + data.events.find(e=>e.id==='LA21').notes,
  checked:'2026-11-17'
});
const tns = data.events.find(e=>e.id==='TX52');
Object.assign(tns, {
  city:'San Antonio', region:'sanantonio', coordinates:[29.424,-98.494],
  start:'2027-07-23', end:'2027-07-24', dateStatus:'Dates posted', location:'In-state venue posted',
  notes:tns.notes.replace('Official calendar lists start July 23, 2027; full dates and city not verified, so sortable date cells left blank.', 'Official calendar confirms July 23-24, 2027; the 2027 exhibitor application identifies San Antonio. Exact venue remains to confirm.'),
  checked:'2026-11-17'
});
data.counts.priced = data.events.filter(e => Number.isFinite(e.fee)).length;
data.counts.dated = data.events.filter(e => e.start && e.end).length;
data.counts.feeAudited = updates.size;
data.counts.historicalFees = data.events.filter(e => e.feeHistory?.length).length;
data.counts.feeSavings = data.events.filter(e => e.feeSavings?.length).length;
data.coverage ??= {};
data.coverage.fees = {checked:'2026-11-17', reviewed:updates.size, currentPrices:data.counts.priced, historicalBenchmarks:data.counts.historicalFees, savingOptions:data.counts.feeSavings, statuses:Object.fromEntries([...statuses].map(s=>[s,data.events.filter(e=>e.feeAudit.status===s).length]))};
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
const clean = s => String(s ?? '').replaceAll('|','\\|').replace(/\s+/g,' ').trim();
const money = n => '$' + n.toLocaleString('en-US');
const report = [
  '# Exhibitor fee research',
  '',
  'Checked November 17, 2026. All 188 event records received a fee review. Unresolved and inaccessible sources are recorded as such; this does not establish that no other rate exists.',
  '',
  'Current commercial exhibit rates, prior-year benchmarks and eligibility-based packages remain distinct. Historical amounts are optional planning estimates and still require a current quote. Attendee tickets and nonprofit-only offers do not become commercial booth prices. Sources and conditions are also shown on the conference cards.',
  '',
  `Published current prices: ${data.counts.priced}. Events with historical exhibit benchmarks: ${data.counts.historicalFees}. Events with separately labeled savings options: ${data.counts.feeSavings}.`,
  '',
  '| Event | Current exhibit price | Historical exhibit benchmarks | Fee review |',
  '|---|---|---|---|'
];
for (const e of data.events) report.push(`| ${clean(e.id + ' - ' + e.name)} | ${e.fee === null ? 'Quote needed' : money(e.fee)} | ${(e.feeHistory||[]).map(h=>`${h.year}: ${money(h.amount)} - ${clean(h.label)}`).join('; ') || 'Not verified'} | ${clean(e.feeAudit.status)}: ${clean(e.feeAudit.summary)} |`);
report.push('', '## Source links and alternative packages', '');
for (const e of data.events) {
  report.push(`### ${e.id} - ${e.name}`, '', ...e.feeAudit.sources.map((u,i)=>`- [Reviewed source ${i+1}](${u})`));
  for (const h of e.feeHistory || []) report.push(`- Historical ${h.year}: ${money(h.amount)} ${h.label}. ${h.conditions} [Source](${h.source})`);
  for (const s of e.feeSavings || []) report.push(`- Alternative ${s.year}: ${money(s.amount)} ${s.label}. ${s.conditions}${s.eligibility ? ' Eligibility: '+s.eligibility : ''} [Source](${s.source})`);
  report.push('');
}
fs.writeFileSync(new URL('FEE_RESEARCH.md', root), report.join('\n'));
console.log(JSON.stringify(data.coverage.fees, null, 2));
