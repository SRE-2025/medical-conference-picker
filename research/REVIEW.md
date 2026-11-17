# Independent fee review

Checked November 17, 2026. This review checks high-impact prices and qualification rules separately from the four research assignments. It does not establish inventory or organizer acceptance of an agency.

| Event | Verified commercial rate / finding | Treatment |
|---|---|---|
| TAAIS Annual Meeting 2027 (TX43) | Official registration form says Bronze tabletop **$5,000**; two representatives, credit-card convenience fee 3.6%. | Keep $5,000. The proposed $2,500 comparison does not belong to this event. |
| Texas Academy of Audiology (TX70) | Sponsor guide provides **2026 Silver $1,000** with one six-foot exhibit table and one representative. 2026 sponsorships closed; next signup is April 2027. | Add historical 2026 commercial benchmark only. Leave 2027 fee unknown. $500 nonprofit is ineligible as standard commercial pricing. |
| GTEF Houston Foot & Ankle 2027 (TX94) | **$775** tabletop includes six-foot table/two chairs. **$600** Break & Display sponsorship is separately offered for one of four breaks. | Preserve $775 standard tabletop; show $600 separately with duration/access and availability requiring confirmation. |
| AAOP/PFA 2027 (LA39) | Standard tabletop **$3,250**; first-time exhibitors get **25%** off with organizer code obtained before purchase. Calculated first-time price **$2,437.50**. | Conditional savings only. Early tabletop $2,800 deadline was May 31, 2026, already expired. Tabletop prohibits pop-up banners and limits display height to 30 inches above table. |
| Southern Neurosurgical Society 2027 (TX92) | Standard tabletop **$7,225**, less **$1,025** when purchased by December 4, 2026 = **$6,200** calculated early price. | $6,200 is valid at this check date; deadline must remain prominent. Later price $7,225. |
| Pediatric Hospital Medicine 2027 (LA25) | **$2,200** single table; **$2,000 each** only for four or more tables. Minimum discounted order totals **$8,000**. | Do not replace a solo table fee with $2,000 or imply a lower total purchase. |
| AAOMS 2027 (TX40) | **$5,663** first 10x10 booth; $5,418 is each additional 100 square feet. Mandatory virtual listing/insurance is included; table/chairs and mandatory carpet extra. | Keep $5,663; additional-space price is not an entry-level discount. |
| AACS 2027 (TX18) | **$4,790** standard / **$5,790** premium 10x10. Table/chairs and carpet included; exhibitor application needs approval. | Standard fee verified. Do not treat approval as automatic. |
| TNP Pharmacology 2027 (TX36) | **$2,000** corporate tabletop; **$750** only for a business with fewer than five total employees. Two badges; attendee CE-session registration is separate. | Existing conditional small-business control is appropriate only after the business-size answer. Organizer approval still required. |
| Arkansas Medical Society 2027 (AR10) | **$3,000** Bronze includes exhibit booth, confirmed in prospectus and sponsor application. Written cancellation request deadline March 12, 2027. | Keep $3,000. Dessert/beverage $2,000 items are separate naming opportunities without a booth promise. |

Sources reviewed:

- TAAIS registration: https://taais.org/2027-annual-meeting-exhibitor-corporate-partnership-registration-form/
- Texas Audiology sponsor guide: https://www.texasaudiology.org/sponsors
- Texas Audiology future dates and attendee registration distinction: https://www.texasaudiology.org/
- GTEF sponsor options: https://www.gtef.org/event-sponsorships/
- AAOP exhibit packages/discounts: https://www.oandp.org/exhibiting-2027
- SNS 2027 prospectus: https://sns.memberclicks.net/assets/2027Meeting/BW_SNS_2027_Prospectus_final.pdf
- PHM 2027 prospectus: https://www.academicpeds.org/wp-content/uploads/2026/09/PHM_2027_Exhibitor_Prospectus.pdf
- AAOMS prospectus: https://aaoms.org/exhibitors/2027-annual-meeting-for-exhibitors/exhibitor-prospectus/
- AAOMS regulations: https://aaoms.org/exhibitors/2027-annual-meeting-for-exhibitors/exhibition-regulations/
- AACS exhibit fees: https://cosmeticsurgery.org/asm2027/exhibit/
- TNP 2027 prospectus (retrieved by following the live event page link): https://texasnp.org/wp-content/uploads/2026/11/V3-TNP-2027-Pharma-Conf-Prospectus.pdf
- Arkansas Medical Society 2027 sponsor application: https://www.arkmed.org/wp-content/uploads/2026/10/2027-AMS-Annual-Meeting-Sponsorship-Form-2027-9.14.26.pdf
- Arkansas Medical Society prospectus (retrieved by following the live annual meeting page link): https://www.arkmed.org/wp-content/uploads/2026/10/2027-Annual-Meeting-Prospectus-NO-FORM-10.23.26.pdf

The TPMA Annual/Southwest pages returned HTTP 403 in this independent pass; existing rates were not independently reconfirmed here. The initial TAAIS PDF was inaccessible through the search tool, but its live registration form confirmed the price. An inaccessible page is not evidence that a cheaper price does not exist.

The validator in `research/validate-fees.mjs` checks all 188 audit records, assigned-event coverage, field boundaries and source/year/amount completeness. It cannot prove that a source supports a rate; the report above and targeted source checks provide that separate review.

## Final patch review

All four research files pass the 188-record validation. The only automated warning is a historical nonprofit Fall workshop option for LA32; it is correctly kept in conditional options and never used as an unrestricted fee.

Conservative corrections made before integration:

- LA15: the undated USD 2,500 endocrine table is retained in the audit narrative with its 2027 link provenance, while the current fee stays unknown until the edition-specific quote is confirmed.
- LA22: generic Spring Silver USD 750 is retained in the narrative; an inferred 2026 Spring history record was removed because only the Fall event is explicitly dated on the source page.
- TX75: USD 80 per square foot remains useful historical evidence, but the hypothetical USD 8,000 total was removed because the minimum available booth footprint was not established.
- TX78, TX84 and TX99: standard/regular historical USD 2,750, USD 1,300 and USD 3,500 records were added alongside expired early rates, so the latest-year standard rate is the optional budget reference.

No nonprofit, membership-only or first-time-only prices remain in the historical rates used as default benchmarks. Special conditions, fees for required extras, and organizer acceptance still need confirmation before purchase.
