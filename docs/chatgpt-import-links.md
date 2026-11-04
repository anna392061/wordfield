# Import from ChatGPT — Word Field

This feature adds a **client-side link import** to the existing CSV/JSON flow. It does not modify current vocabulary, review schedules, or browser storage until the user presses **确认导入**.

## Link format

`<YOUR_WORD_FIELD_APP_URL>#wf-import=<ENCODED_JSON>`

The `ENCODED_JSON` value is `encodeURIComponent(JSON.stringify(payload))`.

Example payload:

```json
{
  "kind": "wordfield-import",
  "version": 1,
  "book": "Speaking Expressions",
  "entries": [
    {
      "term": "worth the price",
      "meaning": "值这个价格",
      "category": "Speaking",
      "example1": "I am not sure it is worth the price.",
      "translation1": "我不确定它是否值这个价。",
      "productionPrompt": "朋友问你为什么没有购买那台相机，请解释你对价格的考虑。",
      "productionAnswer": "I'm not sure it's worth the price."
    }
  ]
}
```

To generate a link in JavaScript:

```js
const payload = {
  "kind": "wordfield-import",
  "version": 1,
  "book": "Speaking Expressions",
  "entries": [
    {
      "term": "worth the price",
      "meaning": "值这个价格",
      "category": "Speaking",
      "example1": "I am not sure it is worth the price.",
      "translation1": "我不确定它是否值这个价。",
      "productionPrompt": "朋友问你为什么没有购买那台相机，请解释你对价格的考虑。",
      "productionAnswer": "I'm not sure it's worth the price."
    }
  ]
};
const link = 'https://YOUR_WORD_FIELD_APP_URL/#wf-import=' + encodeURIComponent(JSON.stringify(payload));
```

## Workflow

1. Open the link in the **same browser** containing the Word Field learning data.
2. The app parses the URL fragment (no upload or external API) and opens the existing import preview.
3. If the target book already exists, it is selected automatically; otherwise the app suggests a new book called **Speaking Expressions** (or the supplied `book`).
4. Existing terms in that book are counted and **skipped**, not overwritten. No existing review records are reset.
5. **Only after the user presses 确认导入** does Word Field store the selected cards.

## Data contract

- Required: `kind: "wordfield-import"`, `version: 1`, `entries` array.
- Optional: `book`, default `Speaking Expressions`.
- Each card requires `term` and `meaning`. Existing optional fields are also supported: `pos`, `category`, `priority`, `patterns`, `example1`, `translation1`, `example2`, `translation2`, `productionPrompt`, `productionAnswer`, `productionPrompt2`, `productionAnswer2`, and `productionExercises`.
- Maximum 25 cards and maximum 20,000 characters in the complete URL fragment. For more content, use the existing JSON file importer.
- Duplicated terms within the incoming payload are deduplicated. Existing terms are skipped by normalized term in the selected book.

## Privacy and compatibility

The fragment is parsed locally and then removed from the displayed URL/history entry. It is not sent as an HTTP URL path/query string, but the original link can still be visible in messages, bookmarks, or clipboard history. Do not put private journal text in import links. There is no automatic synchronization with ChatGPT or Notion.

Changing the target book in the preview updates the duplicate count. The existing CSV/JSON importer and backup/restore behavior remain unchanged.

## Verification checklist

- Launch with a valid payload: preview appears, **no auto-save**.
- New book: name defaults to payload `book`.
- Existing book: matched by title, duplicate count shown.
- Confirm: only new terms are inserted; prior review history is preserved.
- Cancel: no vocabulary changes.
- Malformed or oversized fragment: warning shown, no data changes.
- Conventional CSV/JSON import and existing book management still work.
