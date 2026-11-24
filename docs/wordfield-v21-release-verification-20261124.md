# WordField V2.1 release verification — 2026-11-24

Status: PARTIAL PASS / NOT READY FOR PRODUCTION. Language Patterns is deferred and excluded.

## Verified source snapshot
- PR #2 head: 63cfbe22bcf087061e61742328d10865e6a8c177
- main: 5b23cc4c4ceb01bfec45a7c30e3103445d94f648
- dataset Git blob: 4421def4bcc73240cb573a5f7ff45fae1f8f74fe
- renderer Git blob: 3a2e55b89661d55347a0a939263e77c45192a6fe

## Executed compatibility checks
1. Evaluated actual branch JS source: the three original lists contain 65 records / 64 unique normalized terms. The new dataset has exactly 64 terms, no missing/extra normalized terms and 122 teaching units.
2. Actual renderer JS exercised for all 64 entries with a mocked DOM: validate, draft-only preview, non-personal-book exclusion, unknown-word fallback, simulated reviewed rendering, visible/overflow counts, ordinal consistency and read-only word/dataset checks. No permanent status changes.
3. Chromium: recovered the existing isolated full-book preview, applied the 30 editorial changes, and verified the Git blob hashes for the data and renderer exactly match the head snapshot above. All 192 word × viewport runs (375, 390, 1280px) passed: answers, each visible sense's one-click example, overflow dialog contents/order/closing, no duplicates, nested details or horizontal overflow; no uncaught page errors. This is NOT full app browser QA.
4. Latest 64 Stage 2 entries passed historical contract.schema.json validation. The uploaded historical 20-term Stage 1/2 pair separately passed schema and 68 sense-ID traceability checks; 2 separated constructions. The complete 64-term Stage 1 artifact has not been recovered, so full Stage 1 traceability is not re-certified.
5. Compared actual main and head app.js. Removing the new recognition-answer render call and two audio-button markup replacements makes the files byte-identical; the storage, scheduler, original imports and backup routines are unchanged.
6. Executed the actual main and head app.js with injected test accessors and mocked DOM / IndexedDB, using real source lists and a synthetic pre-existing snapshot containing a studied go with record, recognition and production histories, an activity record and a user-only word. Both builds produced equivalent state after initialization (excluding timestamps), retained IDs and both histories; reviewed renderer routed the known term correctly and retained fallback for the manual term. After one grade(2) action both generated equivalent saved state (excluding timestamps); the new build reloaded its saved snapshot without additional state differences. Synthetic final 65 records and 2 activity rows. This does not establish Safari/real-device persistence, actual export/restore UI or TTS behavior.

## Meaning evidence: targeted audit, not complete Stage 1 review
The following dictionary/grammar results were inspected on 2026-11-24. They support the listed meanings or identify omissions; dictionary evidence does not establish quantitative sense frequency. Some direct Cambridge page requests returned 403, so accessible indexed passages were used. No entry was promoted to reviewed.

| Term | Source | Finding |
| --- | --- | --- |
| come in | [Cambridge phrasal verb](https://dictionary.cambridge.org/dictionary/english/come-in), [Cambridge come](https://dictionary.cambridge.org/dictionary/english/come?topic=finding-and-discovering), [Oxford](https://www.oxfordlearnersdictionaries.com/definition/american_english/come-in), [Collins](https://www.collinsdictionary.com/us/dictionary/english/come-in) | Sources support all 13 current usage contexts: variants, entry, information, transport, rank, role, stock, discussion, income, rule, tide, fashion, music. Do not infer sense frequency or regional restriction without additional evidence; consider come in handy as a separately tracked expression rather than silently changing frozen 04–13 sequence. |
| quite a lot | [Cambridge adverbs](https://dictionary.cambridge.org/us/grammar/british-grammar/much-a-lot-lots-a-good-deal-adverbs), [quite](https://dictionary.cambridge.org/grammar/british-grammar/adjectives-gradable-and-non-gradable) | Quantity and frequency represented; degree missing (e.g. I've improved quite a lot). Resolve whether a distinct grammatical use/sense, then add provenance in Stage 1 first. |
| go with | [Cambridge](https://dictionary.cambridge.org/dictionary/english/go-with), [accompany](https://dictionary.cambridge.org/us/dictionary/english/accompany) | Matching and accepting/choosing supported; literal accompaniment is compositional. Co-occurrence and informal romantic relationship uses are not represented in current candidate; classify in Stage 1. |
| firm | [Cambridge](https://dictionary.cambridge.org/dictionary/english/firm) | Physical firmness, fixed/decisive stance, business noun supported; physical stability/fixed position and other uses need coverage decision. Firm is not synonymous with supportive. |
| wear out | [Cambridge](https://dictionary.cambridge.org/dictionary/english/wear-out) | Physical damage from repeated use and exhaustion supported. Intransitive example requires a natural gloss such as 磨损至不能使用, not an exclusively transitive gloss. |
| filling | [Cambridge](https://dictionary.cambridge.org/dictionary/english/filling) | Food adjective, food filling and dental filling supported; general stuffing/filling material omitted. |
| feature | [Cambridge](https://dictionary.cambridge.org/us/dictionary/english/feature) | Product feature, prominent inclusion, special article supported; facial features, feature film and intransitive feature in require Stage 1 scope decisions. |
| throw off | [Cambridge](https://dictionary.cambridge.org/us/dictionary/english/throw-off?topic=recovering-from-illness) | Disrupting a schedule, shaking off illness, rapidly removing clothing supported; evasion/misleading and other contexts require inventory review. Illness gloss should not be excessively broad. |
| crunch | [Cambridge](https://dictionary.cambridge.org/us/dictionary/english/crunch), [business usage](https://dictionary.cambridge.org/dictionary/english/crunch?topic=decisions-and-deciding) | Sound, noisy crushing and shortage supported; broader decision point and non-food sound verb require coverage review. |
| get caught up in | [Cambridge](https://dictionary.cambridge.org/dictionary/english/get-caught-up-in) | Involvement can be unwanted, but not necessarily; revised neutral gloss appropriate. |
| muted | [Cambridge adjective](https://dictionary.cambridge.org/dictionary/english/muted), [mute verb](https://dictionary.cambridge.org/us/dictionary/english/mute?topic=electrical-switches-and-connections) | All three adjective meanings and device mute participle supported; keep grammatical provenance separate. |
| spot | [Cambridge](https://dictionary.cambridge.org/us/dictionary/english/spot) | Notice, mark, location/position supported; broadcast slot/advertisement and other dictionary senses need coverage decision. |
| stick out | [Cambridge](https://dictionary.cambridge.org/dictionary/english/stick-out), [stick it out](https://dictionary.cambridge.org/us/dictionary/english/stick-it-out?topic=tolerating-and-enduring) | Protrusion and conspicuousness supported; endurance belongs to distinct transitive construction/entry decision. |

## Remaining release gates
- Rebuild or recover full Stage 1 inventory with source links, original sense mapping, distinct meaning/frequency evidence, and all missing-use decisions; complete remaining evidence audit. Preserve stable identifiers; no automatic promotion or speculative corpus statistics.
- Reconcile actual device export against 64 source terms; do not remove manual entries. Keep the full private backup on the user's device or in a private transfer, never commit user history to this public repo.
- End-to-end real app in isolated origin, actual browser storage, export/restore, grade 0/2, PWA/Safari/TTS and cache/rollback tests. Current index still uses the old app.js?v=1.6.3 query parameter; version cache bust should be verified before release.
- Do not merge until these gates pass. All 64 remain draft. No Language Patterns changes, no main branch changes.
