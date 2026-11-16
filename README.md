# Conference Circuit
A yes-or-no planner for one traveler choosing medical-practice conferences in Texas, Oklahoma and Louisiana.

Live app: https://sre-2025.github.io/medical-conference-picker/?plan=2027

## Use it
1. Choose states, cities and your home base.
2. Mark available months and unavailable dates.
3. Choose specialties and set your cost / show-size preferences.
4. Answer Yes, No or Later for each conference.
5. Review the solo itinerary and export JSON, CSV or calendar holds.

Answers and manually entered booth quotes are saved in the current browser only. They are not sent to GitHub. Export a JSON backup to move between devices. The site does not purchase booths, make reservations or contact organizers.

## Research
Checked November 16, 2026. The catalog contains 150 distinct event / recurring-series entries, 98 posted date ranges, 22 current published commercial exhibit prices and 20 sourced attendance benchmarks / forecasts. Another 52 entries need their next dates confirmed. Pending dates and unconfirmed physical locations remain watchlist entries.

Every event has organizer links. Each size figure has its own source and basis; previous-year figures, typical annual figures, professional subsets and forecasts are labeled. Exhibitor counts and booth capacity are separate from attendee counts. These figures do not establish lead volume or the number of practice owners present.

New research includes:
- TNP Pharmacology 2027 prospectus: 400+ expected attendees, $2,000 corporate tabletop or $750 for a qualifying business with fewer than five employees.
- ATS 2027: 10,500 professionals expected; standard commercial 10x10 inline booth $5,000.
- TSHA 2027: for-profit 10x10 booth $1,395; organizer annual audience description 2,500+.
- ASLMS 2025: 648 attendees and 377 exhibitor personnel, retained as a historical benchmark.
- ACC.27: organizer headline 15,000+ attendees and 250+ exhibitors.
- TAFP, LAFP, PHM, Southern Neurosurgical Society and other primary-source size figures are linked on the cards.

## Planning assumptions
Each event is a separate round trip from the chosen city center. Approximate road distance is 1.2 times great-circle distance. Driving allows roughly 440 miles per travel day; flights reserve one day each way and use an editable round-trip airfare allowance plus $120 ground transport. Trips within 60 estimated road miles are treated as local. Setup adds one day; optional rest adds one full free day between trips.

The budget includes the booth price when known, estimated round-trip travel, hotel, meals, show-day parking, per-show extras and the reusable kit once. Missing quotes, dates or travel information keep estimates incomplete. Published fee conditions and required extras must be confirmed with the organizer. Staff time is excluded. Hotel and flight amounts are editable allowances, not live quotes.

Changing preferences can make existing choices conflict. The itinerary flags those conflicts and blocks calendar export until scheduling issues are resolved. Selecting an unknown-date event does not reserve time.

## Development
Buildless HTML/CSS/ES modules; no framework or package install required.
- `npm start`: local preview on http://127.0.0.1:4178
- `npm test`: catalog validation, travel/availability conflicts, budget limits, missing-data behavior, eligibility discounts and calendar export.

Data is in `data.json`. Organizer facts are public; user choices remain in local storage. To refresh research, edit source-backed event records, preserve IDs and rerun tests.

