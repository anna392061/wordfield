---
name: wordfield-learning-content
version: 0.5.1
summary: Convert verified semantic senses into minimal WordField learning content without extra learner actions.
---

# Stage 2 · Learning Content

## Input
Stage 1 entry with `entryId`, `term`, `senses`, `originalSenseIds`, scores, grammar and examples. Do not infer missing personal context.

## Rules
1. **Focus:** For Personal Expressions, prioritize a confidently mapped original sense. Otherwise use the highest relevant internal score. Preserve its stable ID.
2. **Units:** Combine only senses whose meaning and grammar make separate teaching redundant. Preserve every `sourceSenseId` exactly once; do not delete underlying senses.
3. **Insight:** Classify as `shared`, `cluster`, `usage`, or `none`. Select representative examples first. Add at most one short explanatory insight only if it communicates a correct, non-obvious, transferable distinction beyond the label and example; otherwise `text: null`. Never enumerate other meanings as an insight.
4. **Meaning precision [FROZEN] & Economy:** Each Chinese label must convey the sense's distinguishing meaning in context, using the shortest natural wording (e.g. `go with` as `相配`, not the vague `搭配`, when suitability is meant). Never compensate for an imprecise label with extra explanation. Use one natural bilingual example per unit; omit duplicated patterns, paraphrases and second examples unless independently useful.
5. **Placements:** Exactly one complete `focus` unit; at most two `visible` units (headings initially; clicking a heading once reveals its example); all remaining units have placement `overflow`. Prefer coherent contrasting contexts for `shared`/`cluster` previews.
6. **Remaining meanings:** Show `查看其余 N 个用法` only when `overflow` is nonempty, with `N = count(overflow)`. The separate view displays **only `overflow` units**, with their examples immediately visible; it must not repeat `focus` or `visible` units. Keep their original ordinal numbers (e.g. *come in*: **04–13**, never **01–13**).
7. **No extra work:** Hide scoring, ranks and taxonomy from learners. Preserve WordField's `显示答案 → 记住了/忘记了` process and word-level review history; no per-sense controls or nested accordions.

## Output
Structured JSON with `focusUnitId`, `insightDesign`, `units[{unitId,sourceSenseIds,label,pos,example,placement}]`, `referenceMode: "overflow_only"`, internal `decisions` and `reviewStatus`. All units preserve their semantic provenance. Only `reviewed` content is eligible for live publication; draft output remains isolated.

## Check
- Exactly one `focus`, at most two `visible`, all others `overflow`.
- Each Stage 1 sense ID accounted for once (or explicitly migrated to a separately tracked lexical entry).
- No repeated unit between main page and remaining-meanings page.
- Chinese sense label is precise, natural and minimal; no vague generic gloss. (Frozen rule.)
- Optional insight adds learning value; example and title do not redundantly restate it.
- One click from visible title to full example; overflow opens a directly readable page.