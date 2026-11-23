# WordField V2.1 · Personal Expressions full-book candidate

Date: 2026-11-23
Status: **DRAFT / NOT PRODUCTION DEPLOYED**

## Source and coverage

- GitHub `personal-collection.js`: 39 records
- GitHub `speaking-bag-20261113.js`: 14 records, one (`carry around`) already in personal collection
- GitHub `speaking-shoes-20261114.js`: 12 records
- Unique known source terms: **64**
- Stage 1 sense records: **125**
- Stage 2 units after removing redundant teaching splits: **122**
- Separately tracked related constructions from earlier pilot: **2** (`come in for`, literal directional `go against`).
- All 64 terms are represented once in the Stage 2 output.
- **Scope limit:** browser-only terms added locally to the live WordField installation are not visible in the GitHub source and were not enumerated. The integration is read-only; unrecognized terms keep the existing renderer.

## Changes made to the candidate content

- Keep original study sense as the first, complete learning unit.
- Default card shows 1 complete sense and up to 2 other sense labels; one click reveals each bilingual example.
- Overflow list contains **only** not-yet-shown meanings. Example: `come in` shows 04–13, not 01–13, on the overflow page.
- Insights are optional; no compulsory repeated gloss, example, core image or list of other meanings.
- No frontend priority ranks or sense-scoring widgets.
- Remove redundant splits for `wear out`, `a hint of`, `roomy`, `come back to`, `go-to` and `firm`.
- Clarify personal learning focus: `fit` = physically fits in a bag, not general suitability; `quite a lot` = frequency in original user example; `have/has` = feature possession.
- Preserve the source mismatch in `brownish-green` (`greenish-brown` appears in the stored sample). Corrected **candidate** example, never pretended the source had been corrected.

## Automated validation

- Stage 1 and Stage 2 both pass the JSON Schema.
- Original sense IDs mapped exactly once to Stage 2 units for each entry, including merged cases.
- Original sense appears in the focus unit of all 64 entries.
- All reviewed candidate outputs are still `draft`: **not eligible for live publishing**.
- Chromium integration harness passed **192 word × viewport checks** (64 terms × widths 390, 375, 1280): one-click examples, overflow-only pages, no duplicate meanings, no nested accordions and no horizontal overflow.
- Draft publication guard tested: renderer returns null and falls back to existing WordField content when `reviewStatus !== reviewed`, except in explicitly isolated preview mode.
- The current real WordField app and saved study history were not modified by local preview.

## Blocks on production deployment

1. **Content evidence:** new secondary senses are editorial candidates, often C-level until lexicographic sources are individually verified. A passing schema is not a completed semantic review. Both Skills explicitly prohibit publishing `draft` entries.
2. **Browser-only records:** GitHub source cannot expose extra local WordField entries. Do not delete, recreate, or overwrite the user's existing IndexedDB data. A backup/export and reconciliation is necessary to claim the *actual* book is complete.
3. **End-to-end validation:** full GitHub checkout, iPhone Safari/installed-home-screen PWA and real study scheduling preservation have not yet been tested in a separately hosted app origin. Chromium harness is not equivalent to all three.

## Deployment contract

Release after these conditions pass: all content marked reviewed with evidence; no unmatched original sense; back up live data; run full-app tests on isolated origin; confirm functionality and rollback point. The draft branch must not be merged or published as the fully upgraded experience prior to this gate.