# WordField V2.1 — 2026-11-24 owner-authorized release

Release decision: the owner requested formal deployment after receiving the complete 64-word interactive HTML preview. This is approval to publish the specific preview, not certification of the independent dictionary audit. The prior draft-only gate has a narrowly scoped, fingerprint-checked exception for this exact snapshot only; the ordinary reviewed-only rule remains active for other drafts. No reviewStatus is fabricated.

- Exact preview dataset Git blob: 5b91e84a465a9acda88808e43ae2cc4c717acdeb; canonical UTF-8 FNV-1a-64 fingerprint baa56526152f162a (70510 bytes).
- 64 entries, 147 teaching units, 125 original sense IDs plus 25 separately documented candidate IDs; all 150 IDs accounted for. Language Patterns V0.1/V0.2 excluded.
- Original 125-sense inventory: 96 recorded B meaning-evidence grades and 29 C; additional 25 candidates remain C. Historical B grades not all re-audited; all entries retain draft editorial status. No independently verified frequency estimates.
- Latest actual renderer tests: 64/64 eligible entries render, other books and unknown words fall back, tampered draft rejected, ordinal counts consistent, come in 04–13. Previous preview's 192 isolated browser checks are not live device tests.
- Actual main and candidate app.js compared: only recognition render call, two pronunciation markup changes and displayed version label differ; storage, backup, scheduling and word import logic unchanged. Mock DOM/IndexedDB integration: existing ID, recognition/production histories and manual entry retained, initial state, grade 0 and grade 2 saved state equivalent to main, and reload equivalent. Real user's IndexedDB, backup restore and Safari/PWA/TTS not independently tested.
- Cache-bust asset version 2.1-20261124; visible app version V2.1.
- Rollback reference: previous main 5b23cc4c4ceb01bfec45a7c30e3103445d94f648; revert this release merge if necessary. No migration or data reset added. Recommend user export private backup before using the updated app; never commit a personal history backup to this public repository.
- The release exception is specific to this exact dataset, not permission for future automatic unreviewed publication.
