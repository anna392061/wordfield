/* WordField Stage 2 V2.1 · read-only presentation adapter. Draft data is never saved. */
(() => {
  'use strict';
  const escapeHTML = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = x => String(x || '').normalize('NFKC').trim().toLocaleLowerCase('en');
  const dataset = () => window.WORDFIELD_STAGE2_V21?.entries || [];
  const wordByTerm = term => dataset().find(entry => norm(entry.term) === norm(term));
  const icon = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>';
  const speak = (text, label = '朗读例句') => `<button type="button" class="wf2-audio" data-action="speak" data-text="${escapeHTML(text)}" aria-label="${escapeHTML(label)}">${icon}</button>`;
  function example(u) {
    return `<div class="wf2-example"><div class="wf2-example-en"><span>${escapeHTML(u.example?.en)}</span>${speak(u.example?.en)}</div><p class="wf2-example-zh">${escapeHTML(u.example?.zh)}</p></div>`;
  }
  const unitsOf = (entry, placement) => entry.units.filter(u => u.placement === placement);
  function validate(entry) {
    if (!entry || !Array.isArray(entry.units)) return false;
    const f = unitsOf(entry, 'focus'), v = unitsOf(entry, 'visible');
    if (f.length !== 1 || v.length > 2) return false;
    if (entry.units.length !== new Set(entry.units.map(u => u.unitId)).size) return false;
    if (entry.units.some(u => !['focus','visible','overflow'].includes(u.placement))) return false;
    if (entry.units.some(u => !u.label || !u.example?.en || !u.example?.zh)) return false;
    if (entry.focusUnitId !== f[0].unitId) return false;
    if (entry.referenceMode !== 'overflow_only') return false;
    return true;
  }
  function eligible(bookTitle, opts) {
    if (opts?.allowPreview === true) return true;
    return /personal expressions/i.test(String(bookTitle || ''));
  }
  function render(word, opts = {}) {
    if (!eligible(opts.bookTitle, opts)) return null;
    const entry = wordByTerm(word?.term);
    if (!validate(entry)) return null; // Fallback to existing WordField rendering.
    if (!opts.allowPreview && entry.reviewStatus !== 'reviewed') return null; // Never publish draft content.
    const focus = unitsOf(entry, 'focus')[0];
    const visible = unitsOf(entry, 'visible');
    const overflow = unitsOf(entry, 'overflow');
    let html = `<div class="wf2-answer" data-wf2-term="${escapeHTML(entry.term)}"><div class="flash-meaning">${escapeHTML(focus.label)}</div>${example(focus)}`;
    // Insight: optional by design; no redundant compulsory "core understanding" section.
    if (entry.insightDesign?.text) html += `<p class="wf2-insight">${escapeHTML(entry.insightDesign.text)}</p>`;
    if (focus.usageNote) html += `<p class="wf2-usage-note">${escapeHTML(focus.usageNote)}</p>`;
    for (const u of visible) {
      html += `<details class="wf2-sense"><summary>${escapeHTML(u.label)}<span class="wf2-chevron" aria-hidden="true">⌄</span></summary><div class="wf2-sense-body">${example(u)}${u.usageNote ? `<p class="wf2-usage-note">${escapeHTML(u.usageNote)}</p>` : ''}</div></details>`;
    }
    if (overflow.length) {
      html += `<button class="wf2-reference-open" type="button" data-wf2-reference="${escapeHTML(entry.term)}">查看其余 ${overflow.length} 个用法 <span aria-hidden="true">→</span></button>`;
    }
    return html + '</div>';
  }
  let previousFocus = null;
  function referenceHtml(entry) {
    // V2.1 contract: ONLY show overflow (e.g. come in shows 04–13, not 01–13).
    const overflow = unitsOf(entry, 'overflow');
    const rows = overflow.map(u => {
      const ordinal = entry.units.findIndex(x => x.unitId === u.unitId) + 1;
      return `<section class="wf2-ref-entry"><div class="wf2-ref-ordinal">${String(ordinal).padStart(2,'0')}</div><h3>${escapeHTML(u.label)}</h3>${example(u)}${u.usageNote ? `<p class="wf2-usage-note">${escapeHTML(u.usageNote)}</p>` : ''}</section>`;
    }).join('');
    return `<div class="wf2-ref-head"><button class="wf2-ref-close" type="button" data-wf2-close aria-label="返回学习卡">←</button><div><div class="wf2-ref-title">${escapeHTML(entry.term)} · 其余用法</div><div class="wf2-ref-subtitle">从 ${String(entry.units.length - overflow.length + 1).padStart(2,'0')} 开始 · 共 ${overflow.length} 个用法</div></div></div><div class="wf2-ref-scroll">${rows}</div>`;
  }
  function openReference(term, origin) {
    const entry = wordByTerm(term);
    if (!validate(entry) || !unitsOf(entry,'overflow').length) return;
    previousFocus = origin;
    let dialog = document.getElementById('wf2-reference-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'wf2-reference-dialog';
      dialog.className = 'wf2-reference-dialog';
      document.body.appendChild(dialog);
      dialog.addEventListener('close', () => previousFocus?.focus?.());
      dialog.addEventListener('click', e => {
        if (e.target === dialog) dialog.close();
      });
    }
    dialog.innerHTML = referenceHtml(entry);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
    dialog.querySelector('[data-wf2-close]')?.focus();
  }
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-wf2-reference]');
    const close = event.target.closest('[data-wf2-close]');
    if (!open && !close) return;
    event.preventDefault();
    event.stopImmediatePropagation(); // Don't call WordField app's unrelated action handler.
    if (open) openReference(open.dataset.wf2Reference, open);
    else document.getElementById('wf2-reference-dialog')?.close?.();
  }, true);
  window.WordFieldStage2Renderer = {render, validate, wordByTerm, referenceHtml, unitsOf};
})();
