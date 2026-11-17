import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// Import the complete connector extraction without replacing newer catalog facts.
// CSV cells deliberately stay strings, including blanks, dates and formula results.
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || cell === '') quoted = !quoted;
      else throw new Error('Unexpected quote in unquoted CSV cell');
    } else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Unclosed CSV quoted field');
  if (row.length || cell !== '') { row.push(cell); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}

export function parseWorkbookExtract(text) {
  const marker = /<PARSED TEXT FOR SHEET: (\d+) \/ (\d+) TABS\r?\nTAB NAME: ([^>]+)>\r?\n/g;
  const matches = [...text.matchAll(marker)];
  assert.equal(matches.length, 3, 'All three source tabs must be present');
  return matches.map((m, i) => {
    const rawCSV = text.slice(m.index + m[0].length, matches[i + 1]?.index ?? text.length).trimEnd();
    const table = parseCSV(rawCSV), extractionHeaders = table.shift();
    assert.equal(extractionHeaders[0], 'index');
    const width = extractionHeaders.length - 1;
    const rows = table.map((r, j) => {
      assert.equal(r.length, width + 1, `${m[3]} extraction row ${j}: column count`);
      assert.equal(Number(r[0]), j, `${m[3]} extraction row ${j}: index sequence`);
      return { index: Number(r[0]), cells: r.slice(1) };
    });
    return { name: m[3], number: Number(m[1]), extractionHeaders, width, rows, rawCSV };
  });
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'data.json');
const archivePath = path.join(root, 'research', 'original-workbook.json');
const source = 'Medical_Conference_Circuit_2027.xlsx';
const checked = '2026-11-16';
const importedOn = '2026-11-17';
const extract = fs.readFileSync(path.join(root, 'research', 'original-workbook-extract.txt'), 'utf8');
const sheets = parseWorkbookExtract(extract);
const choose = sheets.find(s => s.name === 'Choose events');
const circuit = sheets.find(s => s.name === 'Conference circuit');
const pipeline = sheets.find(s => s.name === 'Lead pipeline');
assert.ok(choose && circuit && pipeline, 'Exact original sheet names');
const eventHeaders = circuit.rows.find(r => r.index === 4).cells;
const leadHeaders = pipeline.rows.find(r => r.index === 4).cells;
assert.equal(eventHeaders.length, 26, 'Original conference columns');
assert.equal(leadHeaders.length, 24, 'Original lead columns');
const eventRows = circuit.rows.filter(r => r.index > 4 && r.cells[1]);
assert.equal(eventRows.length, 150, 'Original event count');
const originals = eventRows.map(r => ({
  row: r.index + 1,
  record: Object.fromEntries(eventHeaders.map((h, i) => [h, r.cells[i]]))
}));
const byId = new Map(originals.map(r => [r.record['Event ID'], r]));
assert.equal(byId.size, 150, 'No duplicate original IDs');
const leadRows = pipeline.rows.filter(r => r.index > 4 && r.cells.some(Boolean));
assert.equal(leadRows.length, 0, 'Original lead pipeline is a blank template, not fabricated leads');
const instructionCells = [[7,0], [8,0], [9,0], [10,0], [17,0], [25,6], [29,0], [42,0], [43,0], [44,0], [45,0], [46,0], [51,0], [52,0], [53,0], [54,0], [55,0]];
const workflowInstructions = instructionCells.map(([i,c]) => choose.rows.find(r => r.index === i).cells[c]);
const leadInstructions = [51, 52, 53, 54, 55].map(i => choose.rows.find(r => r.index === i).cells[0]);
const holdRule = choose.rows.find(r => r.index === 55).cells[0];
const budgetAssumptions = {
  travelLodgingPerEvent: Number(choose.rows.find(r => r.index === 23).cells[1]),
  onSiteExtrasPerEvent: Number(choose.rows.find(r => r.index === 24).cells[1]),
  reusableBoothKit: Number(choose.rows.find(r => r.index === 25).cells[1]),
  texMedLeadRetrieval: Number(choose.rows.find(r => r.index === 26).cells[1]),
  contingencyRate: Number(choose.rows.find(r => r.index === 27).cells[1]),
  currency: 'USD', checked,
  status: 'Original workbook assumptions. The flat travel/lodging allowance and team-overlap allowance are superseded by detailed same-day solo travel rules. Other amounts remain archived references, not current organizer quotes.'
};
assert.deepEqual([budgetAssumptions.travelLodgingPerEvent, budgetAssumptions.onSiteExtrasPerEvent, budgetAssumptions.reusableBoothKit, budgetAssumptions.texMedLeadRetrieval, budgetAssumptions.contingencyRate], [700, 300, 1000, 350, 0.1]);
const meta = {
  fileName: source, checked, importedOn, archivePath: 'research/original-workbook.json',
  extractPath: 'research/original-workbook-extract.txt', eventCount: 150,
  rowNumbering: 'One-based extracted data row (connector index plus one), excluding the connector CSV header; physical Excel row offsets were not verified.',
  sheets: sheets.map(s => ({ name: s.name, number: s.number, rowCount: s.rows.length, columnCount: s.width })),
  eventHeaders, workflowInstructions,
  leadPipeline: {
    headers: leadHeaders, rows: [], instructions: leadInstructions,
    outreachHold: { specialty: 'Chiropractic', place: 'Longview and surrounding areas', rule: holdRule },
    status: 'Original blank template. Live user-entered leads belong in browser storage and exported backups, never in the public catalog.'
  },
  budgetAssumptions,
  limitations: [
    'This archive preserves all extracted cell values and original row order from the complete three-tab workbook extraction. It is not a binary XLSX copy; formatting and formula expressions absent from the extraction cannot be claimed preserved.',
    'Original workbook values were checked November 16, 2026 and remain a dated baseline. Current catalog facts and subsequent fee/audience research take precedence.',
    'The full original chat transcript is unavailable in this workspace; targeted recovered messages and project records are mapped in HANDOFF_AUDIT.md.'
  ]
};
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
assert.equal(data.events.length, 188, 'Expanded catalog count is unchanged');
const catalogIds = new Set(data.events.map(e => e.id));
assert.equal(catalogIds.size, 188, 'Distinct expanded IDs');
for (const id of byId.keys()) assert.ok(catalogIds.has(id), `Original ID missing: ${id}`);
const promoted = {
  organizerContact: 'Organizer contact / route',
  commercialAccess: 'Commercial access',
  priceTerms: 'Price / deadline terms',
  leadTerms: 'Lead capture / list terms',
  dateUrl: 'Official date source',
  bookingStatus: 'Booking status',
  inquiryDate: 'Inquiry date'
};
const pending = {
  organizerContact: 'Contact route pending verification',
  commercialAccess: 'Commercial access pending verification',
  priceTerms: 'Current commercial price and cancellation terms pending verification',
  leadTerms: 'Organizer-permitted lead capture and attendee-list use pending verification',
  dateUrl: null,
  bookingStatus: 'Research only; not booked',
  inquiryDate: null
};
const before = structuredClone(data.events);
for (const e of data.events) {
  const old = byId.get(e.id);
  if (old) {
    assert.equal(old.record['State market'], e.state, `Original ID/state mismatch: ${e.id}`);
    e.originalResearch = { source, checked, sheet: 'Conference circuit', row: old.row, record: old.record };
    for (const [field, header] of Object.entries(promoted)) {
      if (!Object.hasOwn(e, field)) e[field] = old.record[header] === '' ? null : old.record[header];
    }
    e.researchProvenance = { source, checked, sheet: 'Conference circuit', row: old.row, status: 'Original workbook baseline; newer catalog facts and fee audit may supersede these terms.' };
  } else {
    e.originalResearch = null;
    for (const [field, value] of Object.entries(pending)) if (!Object.hasOwn(e, field)) e[field] = value;
    e.researchProvenance = { source: 'Catalog expansion after original workbook', checked: null, status: 'No original workbook row; operational fields pending verification.' };
  }
}
// Verify every existing field remains byte-for-byte equivalent as a JSON value.
for (const old of before) {
  const e = data.events.find(x => x.id === old.id);
  for (const [key, value] of Object.entries(old)) {
    if (['originalResearch', 'researchProvenance'].includes(key)) continue;
    assert.deepEqual(e[key], value, `Current catalog fact changed: ${old.id}.${key}`);
  }
}
data.originalWorkbook = meta;
const archive = { ...meta, sheets, events: originals };
fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2) + '\n');
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify({ originalEvents: originals.length, retainedOriginalIds: originals.filter(r => catalogIds.has(r.record['Event ID'])).length, expandedEvents: data.events.length, newEvents: data.events.filter(e => !e.originalResearch).length, sourceTabs: sheets.length, eventColumns: eventHeaders.length, leadColumns: leadHeaders.length, originalLeadRows: leadRows.length, existingFactsPreserved: true }));
