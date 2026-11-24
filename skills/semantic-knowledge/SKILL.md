---
name: wordfield-semantic-knowledge
version: 1.1
summary: Build an evidence-aware, complete English sense inventory for WordField; no learner-facing teaching prose.
---

# Stage 1 · Semantic Knowledge

## Input
`entryId`, `term`, `bookType: personal|domain|generic`, optional `domain`, `source` (original gloss/example, file and ID). Do not infer an original learning need from a user profile. A stored gloss/example is **lexicon evidence**, not necessarily the user's verbatim utterance.

## Procedure
1. Check lexical forms, part of speech, independent senses, patterns, restrictions and natural bilingual examples against appropriate references. Don't split paraphrases or collocations into fake senses. Keep confirmed less-common senses with usage labels.
2. Assign stable `senseId` per *grammatical sense*; record `pos`, `label`, `definition`, `example`, semantic `groupId`, evidence. A form such as *muted* (adjective versus mute's past participle) needs grammatical provenance.
3. Map `source.originalGloss` / `originalExample` to `originalSenseIds` **only when unambiguous**; otherwise use `[]` and `source.matchStatus=uncertain`. Record whether mapping rests on a stored gloss, example, or verbatim user context. Do not fabricate provenance.
4. Score each sense 1–5 for `utility`, sense-level `frequency`, `transfer`, `confusion`; `personalRelevance=5` for directly matched original sense of a personal entry, `null` for unrelated senses without personal evidence. `domain` and `generic` use four dimensions only.
5. Weights for personal: 30/25/15/10/20. For domain or generic: 35/30/20/15. If personal relevance is `null`, re-normalize the four applicable personal weights: 30/25/15/10. Compute `score = 100 * sum(rating*weight)/(5*sum(applicable weights))`. Never use an entire word's CEFR or dictionary ordering as sense-frequency statistics.
6. Keep **separate** `meaningEvidence` (lexical meaning) and `frequencyEvidence` (sense usage frequency), each `A` corpus sense-annotated / `B` dictionary or attested usage / `C` provisional. A dictionary verified meaning does not make an estimated frequency B. Store inspectable source URLs; no invented corpus counts.

## Output
Produce Stage 1 JSON conforming to `../../data/contract.schema.json` (`$defs.stage1Entry`). No front-end core-image prose, presentation ranks, accordions or interface text. `groups` record supported links only; don't force global unity. Review status `draft` unless language and sourcing have actually been reviewed; never `validated` without learner testing.