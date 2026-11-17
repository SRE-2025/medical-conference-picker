# Conference Circuit handoff audit

Audited November 17, 2026. This compares the complete extracted contents of `Medical_Conference_Circuit_2027.xlsx` with the current 188-entry planner and the user requirements recovered from the original discussion.

## Preservation result

- All **150 original event IDs** remain in the 188-entry catalog, with no duplicates or missing original events. The additional 38 entries remain distinct from the original workbook.
- Every original event's **26 column values** is preserved as an exact header-to-string map in `data.json` at `events[].originalResearch.record`. Each record identifies its original source file, November 16 check date, sheet and one-based extracted data row. Connector-header offsets from physical Excel row numbers were not verified.
- All extracted cells, blank cells, row order and CSV text from **all three tabs** are archived in `research/original-workbook.json`. `research/original-workbook-extract.txt` retains the complete connector extraction. Neither archive is a reconstructed current quote.
- `research/import-original.mjs` reproduces the import and checks the three sheet names, cell widths, row sequence, 150 unique original IDs, 188 current IDs, 26 event columns, 24 lead columns, empty original lead pipeline and preservation of every pre-existing event field.
- Original rows are dated research. Current prices, dates, notes, attendance research, fee audits and source links were not replaced by older workbook values. Original `Review` decisions were not imported into a user's saved plan.
- The 38 new entries have `originalResearch: null`; their newly introduced operational fields explicitly say pending verification or remain null. This does not erase their existing source-backed date, price or fee-audit information.

## Original sheets

| Original tab | Complete preserved location | Current use |
|---|---|---|
| Choose events | `research/original-workbook.json` → `sheets` entry, including every original cell and raw CSV | Introductory rules and workflow are in `data.originalWorkbook.workflowInstructions`; original budget assumptions and scope/overlap qualifications are retained separately from current planner rules. Original dashboard counts are historical, not live metrics. |
| Conference circuit | Archive `sheets` entry and `events`; each matching current event also has `originalResearch.record` | All 150 original series remain. Current fields continue to drive the planner; original evidence is available with its check date. |
| Lead pipeline | Archive `sheets` entry; `data.originalWorkbook.leadPipeline.headers` and `rows` | The source is a blank 24-column template. No leads, conversations, permissions, bookings, inquiries, proposals or wins have been invented. User-entered operational data belongs in private browser storage/backups, not the public catalog. |

## Every original conference column

Every row below also remains intact under its exact original heading in `originalResearch.record`; the active-location column describes its present counterpart.

| Original column | Active or preserved counterpart | Treatment |
|---|---|---|
| Your choice | Browser decisions; original value in archive | Original `Review` values stay archival. Current Yes / No / Maybe choices are not reset. |
| Event ID | `id` | All 150 original IDs retained. |
| Conference / event series | `name` | Current corrected names retained; original spelling archived. |
| Specialty | `category` | Current category retained; original classification archived. |
| State market | `state` | Original ID/state alignment validated; association market is distinct from confirmed venue. |
| City | `city` | Current city retained; original pending-city text archived. |
| Starts | `start` | Current date retained. Original timestamp string is preserved exactly. |
| Ends | `end` | Current date retained. Original timestamp string is preserved exactly. |
| Date status | `dateStatus` | Current verification status retained. |
| Location status | `location` | Current venue status retained; dates alone do not establish physical location. |
| Entry exhibit fee (USD) | `fee` | Current verified fee retained; original amount/blank archived. Historical or restricted fees remain separate. |
| Price basis | `priceType` | Current basis retained; original basis archived. |
| Commercial access | `commercialAccess` with `researchProvenance` | Original November 16 access assessment restored; current fee-audit restrictions may supersede it. |
| Space / inclusions | `includes`; exact original detail in archive | Current inclusions retained. The original package detail remains available even where a later current field is more general. |
| Organizer contact / route | `organizerContact` with `researchProvenance` | Original route/contact restored. It is not a record of an inquiry being sent. |
| Booking status | `bookingStatus` with `researchProvenance` | Original `Research only` status retained. Planner Yes is not a paid reservation. |
| Inquiry date | `inquiryDate` with `researchProvenance` | Original blank becomes null in the promoted field; exact blank remains archived. No contact date fabricated. |
| Exhibit deadline | `deadline` | Current deadline retained; original deadline/blank archived. Hotel cutoffs are not silently treated as exhibit deadlines. |
| Price / deadline terms | `priceTerms` with `researchProvenance` | Original dated package, cancellation, cutoff and confirmation instructions restored. Current fee-audit findings remain separate. |
| Lead capture / list terms | `leadTerms` with `researchProvenance` | Original permission/list limitations restored. Possessing an exhibitor badge does not imply unrestricted list use. |
| Research notes | `notes`; exact original notes in archive | Current notes retained; all older notes remain reviewable. |
| Official exhibit / price source | `priceUrl` | Current source retained; original source archived. |
| Official date source | `dateUrl` with `researchProvenance` | Original separate date source restored. A later corrected date may have its newer source in current notes or other source fields. |
| Checked | `checked`, `originalResearch.checked`, `researchProvenance.checked` | Current check date and original November 16 baseline remain distinct; original timestamp preserved. |
| Current fee entered | Exact original value in archive | Original calculated flag is retained as a historical workbook result; the app derives current fee completeness from current fields/quotes. |
| Selected-date conflicts | Exact original value in archive; current core conflict calculation | Original blank/result preserved. The solo itinerary recomputes conflicts from actual saved choices and preferences. |

## Every original lead-pipeline column

The following exact headings are preserved in order at `data.originalWorkbook.leadPipeline.headers` and in the complete archived Lead pipeline tab. They are a template, not populated lead data:

| Position | Exact original heading | Purpose retained |
|---|---|---|
| 1 | Lead ID | Individual opportunity identifier |
| 2 | Event ID | Attribution to the originating conference |
| 3 | Practice | Practice/company name |
| 4 | Website / domain | Practice website |
| 5 | City | Location and outreach eligibility |
| 6 | State | Location and outreach eligibility |
| 7 | Specialty | Practice specialty and hold checks |
| 8 | Contact | Individual contact |
| 9 | Role | Decision maker's role |
| 10 | Work email | Work contact, when permitted |
| 11 | Phone | Work contact, when permitted |
| 12 | Follow-up permission | Permission record |
| 13 | Stage | Opportunity progress |
| 14 | First touch | First actual contact date |
| 15 | Last touch | Most recent actual contact date |
| 16 | Next action date | Follow-up due date |
| 17 | Next action | Agreed next step |
| 18 | Owner | Person responsible |
| 19 | Monthly proposal (USD) | Actual proposed monthly amount |
| 20 | Setup fee (USD) | Actual proposed setup amount |
| 21 | Outcome / lost reason | Result or reason lost |
| 22 | Outreach eligibility | Hold/do-not-contact review |
| 23 | Notes | Factual conversation notes |
| 24 | Next-action status | Derived due/overdue/completed status; original template contained no lead rows |

## Original workflow and assumptions

The exact original workflow strings are stored in `data.originalWorkbook.leadPipeline.instructions` and `workflowInstructions`:

1. Six to eight weeks before a selected event, identify relevant practice owners/managers and obtain the current exhibitor contract.
2. Three to four weeks before, use permitted channels for meeting arrangements and an event-specific QR form capturing practice, website, work contact, need and meeting time.
3. At the event, record conversations against Event ID, including decision maker, business need, permission and next action.
4. Within 48 hours, deliver the agreed practice-specific audit and set the next meeting; attribute proposals/wins to the originating Event ID.
5. Keep chiropractic practices in Longview and surrounding areas on hold; respect organizer list rules and do-not-contact requests. This restriction is also structured at `data.originalWorkbook.leadPipeline.outreachHold`. "Surrounding areas" has no user-defined mileage radius, so ambiguous nearby locations need review rather than invented geographic boundaries.

| Original assumption | Source amount | Current handling |
|---|---:|---|
| Travel / lodging per event | $700 | Archived flat team allowance, superseded by the user's detailed solo travel and same-day hotel rules. |
| On-site extras per event | $300 | Preserved original editable assumption; distinct from any later editable control value. |
| Reusable booth kit | $1,000 | Preserved original one-time editable assumption. |
| TexMed lead retrieval | $350 | Preserved optional published add-on; distinct from base booth fee and generic per-show extras. Confirm current terms before purchase. |
| Contingency | 10% | Preserved original planning allowance, distinct from any organizer fee. |

The source workbook excluded staff time and kept complete totals unavailable where current booth prices were missing. The app's current incomplete/historical-estimate behavior must keep missing or provisional prices visible. Original workbook language allowing separate teams at overlapping events is archived but **superseded by the later one-traveler requirement**.

## Original discussion and later requirements

| Recovered requirement | Location / current treatment | Status |
|---|---|---|
| November 16: medical-practice conference pipeline in TX / OK / LA with booth costs | Original workbook, `data.events`, fee sources, operational fields and lead template | Original 150 preserved; expanded catalog retains these markets. |
| November 16: at least 100 conferences; include med spas and all relevant options so the user decides | 188-entry catalog, specialties and Yes / No / Maybe controls | Count and original IDs verified; audience suitability remains the user's choice. |
| November 16: GitHub questionnaire using place, timing, cost and show size | `app.mjs`, `core.mjs`, GitHub Pages source | Existing questionnaire retained; current UI validation is a separate implementation check. |
| November 16: one traveler, no overlapping shows | `core.mjs` conflict/itinerary logic and tests | Later solo rule takes precedence over source workbook's team-overlap language. |
| November 17: historical doctor attendance distinct from staff, students and exhibitors | `doctorHistory`, `doctorBenchmark`, attendance scope labels and filters | Existing doctor research retained; mixed audiences are not converted to doctor-only totals. |
| November 17: arrive opening day, leave closing day | `trip`, exhibit-date preferences, hotel-night tests | No automatic before/after hotel nights; organizer setup requirements remain explicit checks. |
| Later: Arkansas plus podiatry/dental/chiropractic expansion | 38 added entries, four-state/city filters, `RESEARCH.md` | New records clearly distinguished from original workbook rows. |
| Later: rename Later to Maybe | UI label `Maybe`, legacy stored value `later` | Legacy key remains for saved-plan compatibility. |
| Later: prioritize exhibit costs; inspect prior years, early rates, smaller spaces and discounts | All-event fee audit, `feeHistory`, `feeSavings`, fee sources and controls | Current, historical and conditional costs remain distinct; not-public/unresolved is not proof no cheaper offer exists. |
| Current: retain original file and discussion requirements | Original archive/importer, promoted fields, this handoff map and independent QA | Complete extracted workbook data recovered. Full original chat transcript remains unavailable. |

## Evidence limits and remaining work

The full original discussion transcript is not present in the workspace. This audit uses the complete three-tab workbook extraction, recovered targeted user messages, current repository documentation and source-backed event data. It cannot assert that every sentence of an unavailable transcript was retrieved. The original XLSX remains the source for formatting and formulas not exposed by the extraction.

Many organizer contacts, commercial-access assessments, cancellation terms and list permissions originate in the November 16 workbook and need a current organizer confirmation. Their provenance is explicit. No exhibit space has been purchased, organizer inquiry sent, meeting booked or follow-up email sent by this restoration process. Original workflow instructions are preserved as instructions; they are not claims that those actions occurred.
