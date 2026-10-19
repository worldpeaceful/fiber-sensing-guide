'use strict';

function normalizeFiberSearchText(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function fiberSearchTextParts(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(fiberSearchTextParts);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).filter(([key]) => !['id','cat','name','en','title','color','symbol','sources','termIds','functionIds','methodIds','terms','experiments'].includes(key)).flatMap(([,part]) => fiberSearchTextParts(part));
}

// 保持索引与现有目录共用内容。参数也便于离线检查搜索算法。
function buildFiberSiteSearchIndex(data = {}) {
  const terms = data.terms ?? (typeof TERMS !== 'undefined' ? TERMS : []);
  const functions = data.functions ?? (typeof FUNCTIONS !== 'undefined' ? FUNCTIONS : []);
  const methods = data.methods ?? (typeof METHODS !== 'undefined' ? METHODS : []);
  const modes = data.modes ?? (typeof MODES !== 'undefined' ? MODES : {});
  const lessons = data.lessons ?? (typeof LAB_CONTENT !== 'undefined' ? LAB_CONTENT : {});
  const faq = data.faq ?? (typeof FIBER_SEARCH_FAQ !== 'undefined' ? FIBER_SEARCH_FAQ : []);
  const categories = data.categories ?? (typeof CATEGORY !== 'undefined' ? CATEGORY : {});
  const experimentGroups = data.experimentGroups ?? (typeof EXPERIMENT_GROUPS !== 'undefined' ? EXPERIMENT_GROUPS : []);
  const experimentNames = new Map(experimentGroups.flatMap(group => group.modes || []));
  const relatedTerms = ids => (ids || []).flatMap(id => {
    const term = terms.find(item => item.id === id); return term ? [term.name, term.en] : [];
  });
  const relatedFunctions = ids => (ids || []).map(id => functions.find(item => item.id === id)?.title || '');
  const relatedMethods = ids => (ids || []).flatMap(id => {
    const method = methods.find(item => item.id === id); return method ? [method.title, ...(method.technologies || []).map(item => item.name)] : [];
  });
  const entries = [];
  function add(type, id, title, en, excerpt, content, url, core = []) {
    const text = [type, title, en, ...content].filter(Boolean).join(' ');
    entries.push({type, id, title, en:en || '', excerpt, text, url, normalizedName:normalizeFiberSearchText(title), normalizedTitle:normalizeFiberSearchText(title + ' ' + (en || '')), normalizedCore:normalizeFiberSearchText([id,...core].join(' ')), normalizedText:normalizeFiberSearchText(text)});
  }
  terms.forEach(term => add('术语', term.id, term.name, term.en, term.one, [term.id, categories[term.cat], ...fiberSearchTextParts(term), ...relatedFunctions(term.functionIds), ...relatedMethods(term.methodIds)], 'terms.html?term=' + encodeURIComponent(term.id), [term.one,term.principle]));
  functions.forEach(item => add('测量功能', item.id, item.title, '', item.one, [...fiberSearchTextParts(item), ...(item.technologies || []).map(technology => technology.name), ...relatedTerms(item.termIds), ...relatedMethods(item.methodIds)], 'guide.html?functionDetail=' + encodeURIComponent(item.id)));
  methods.forEach(item => add('测试方法', item.id, item.title, '', item.one, [...fiberSearchTextParts(item), ...(item.technologies || []).map(technology => technology.name), ...fiberSearchTextParts(item.experiments), ...relatedTerms(item.termIds), ...relatedFunctions(item.functionIds)], 'methods.html?methodDetail=' + encodeURIComponent(item.id), [item.one,...(item.technologies || []).map(t=>t.name)]));
  Object.entries(modes).forEach(([id, mode]) => {
    const lesson = lessons[id] || {};
    const related = [...functions.filter(item => (item.experiments || []).includes(id)).map(item => item.title), ...methods.filter(item => (item.experiments || []).some(experiment => experiment.mode === id)).map(item => item.title)];
    add('互动实验', id, mode.title, experimentNames.get(id) || '', mode.caption || mode.copy, [id,...fiberSearchTextParts(mode), ...fiberSearchTextParts(lesson), ...relatedTerms(lesson.terms), ...related], 'lab.html?mode=' + encodeURIComponent(id), [mode.copy]);
  });
  faq.forEach(item => add('常见问题', item.id, item.title, '', item.text, [item.text], 'questions.html#' + encodeURIComponent(item.id)));
  return entries;
}

function searchFiberSiteContent(index, query) {
  const phrase = normalizeFiberSearchText(query);
  if (!phrase) return [];
  const words = [...new Set(phrase.split(' '))];
  return index.filter(item => words.every(word => item.normalizedText.includes(word))).map(item => {
    const title = item.normalizedTitle;
    const direct=title.includes(phrase)||(item.type==='术语'&&item.id===phrase);
    const core=(item.normalizedCore||'').includes(phrase);
    const priority={'测试方法':60,'互动实验':50,'术语':30,'测量功能':20,'常见问题':10}[item.type]||0;
    const score = (direct?3000:core?2000:1000) + (item.normalizedName===phrase||(direct&&item.id===phrase)?500:title.startsWith(phrase)?250:0) + priority + words.reduce((sum, word) => sum + (title.includes(word)?40:(item.normalizedCore||'').includes(word)?10:0),0);
    return {...item, score};
  }).sort((a,b) => b.score - a.score);
}

(function initFiberHeaderTools() {
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
  const find = id => document.getElementById(id);
  const themeButton = find('theme-toggle');
  if (themeButton) {
    const storageKey = 'fiber-field-guide.theme.v1';
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const validTheme = value => value === 'light' || value === 'dark';
    let savedTheme = null;
    try { savedTheme = window.localStorage.getItem(storageKey); } catch {}
    let explicitTheme = validTheme(savedTheme);
    function applyTheme(theme) {
      document.documentElement.dataset.theme = theme;
      const dark = theme === 'dark';
      themeButton.setAttribute('aria-pressed', String(dark));
      const action = dark ? '切换到白天模式' : '切换到黑夜模式';
      themeButton.setAttribute('aria-label', action);
      themeButton.title = action;
      document.querySelector?.('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111827' : '#3459df');
    }
    applyTheme(explicitTheme ? savedTheme : validTheme(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : media?.matches ? 'dark' : 'light');
    themeButton.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      explicitTheme = true;
      applyTheme(next);
      try { window.localStorage.setItem(storageKey, next); } catch {}
    });
    media?.addEventListener?.('change', event => { if (!explicitTheme) applyTheme(event.matches ? 'dark' : 'light'); });
    window.addEventListener('storage', event => {
      if (event.key !== storageKey && event.key !== null) return;
      let value = event.key === storageKey ? event.newValue : null;
      explicitTheme = validTheme(value);
      applyTheme(explicitTheme ? value : media?.matches ? 'dark' : 'light');
    });
  }

  function openLinkedQuestion() {
    const hash = window.location.hash;
    if (!/^#faq-\d+$/.test(hash)) return;
    const question = find(hash.slice(1));
    if (question?.tagName === 'DETAILS') question.open = true;
  }
  openLinkedQuestion();
  window.addEventListener('hashchange', openLinkedQuestion);

  const headerForm = find('site-search-form'), headerInput = find('site-search-input');
  const dialog = find('search-dialog'), dialogForm = find('dialog-search-form'), dialogInput = find('dialog-search-input');
  const results = find('search-results'), summary = find('search-summary'), closeButton = find('close-search');
  if (!headerForm || !headerInput || !dialog || !dialogForm || !dialogInput || !results || !summary || !closeButton) return;
  const index = buildFiberSiteSearchIndex();
  const batchSize = 24;
  let visibleCount = batchSize, returnFocus = null;
  const escapeText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function excerptFor(item) {
    // 简介用于阅读，完整索引仅用于匹配，避免把编码和关联目录拼进摘要。
    const content = item.excerpt || '';
    return content.length > 105 ? content.slice(0, 104) + '…' : content;
  }
  function renderSearch(reset = true) {
    if (reset) visibleCount = batchSize;
    const query = dialogInput.value;
    const normalized = normalizeFiberSearchText(query);
    if (!normalized) {
      summary.textContent = '输入一个关键词，查找术语、功能、方法、实验和常见问题。';
      results.innerHTML = '<p class="search-empty">试试“温度”“振动”或“FBG”。多个关键词用空格隔开。</p>';
      return;
    }
    const matches = searchFiberSiteContent(index, query);
    const shown = Math.min(visibleCount, matches.length);
    summary.textContent = matches.length ? '找到 ' + matches.length + ' 条结果' + (shown < matches.length ? '，当前显示 ' + shown + ' 条。' : '。') : '没有找到与“' + query.trim() + '”相关的内容。';
    if (!matches.length) {
      results.innerHTML = '<p class="search-empty">换一个常用词试试，或减少关键词。</p>';
      return;
    }
    results.innerHTML = matches.slice(0, shown).map(item => '<a class="search-result" href="' + escapeText(item.url) + '"><span class="search-result-type">' + escapeText(item.type) + '</span><h3>' + escapeText(item.title) + '</h3><p>' + escapeText(excerptFor(item)) + '</p><span class="search-result-open">查看内容 →</span></a>').join('') + (shown < matches.length ? '<button type="button" class="search-load-more" data-search-more>再显示 ' + Math.min(batchSize, matches.length - shown) + ' 条结果</button>' : '');
  }
  function openSearch(query) {
    if (!dialog.open) {
      returnFocus = document.activeElement;
      dialog.showModal();
    }
    dialogInput.value = query;
    renderSearch();
    dialogInput.focus({preventScroll:true});
  }
  function closeSearch() { if (dialog.open) dialog.close(); }
  headerForm.addEventListener('submit', event => { event.preventDefault(); openSearch(headerInput.value); });
  document.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape' && dialog.open) {
      event.preventDefault();
      closeSearch();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch(dialog.open ? dialogInput.value : headerInput.value);
    }
  });
  dialogForm.addEventListener('submit', event => { event.preventDefault(); renderSearch(); });
  dialogInput.addEventListener('input', () => renderSearch());
  closeButton.addEventListener('click', closeSearch);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeSearch(); });
  dialog.addEventListener('close', () => {
    headerInput.value = dialogInput.value;
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
    else headerInput.focus({preventScroll:true});
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSearch();
  });
  results.addEventListener('click', event => {
    if (!event.target.closest('[data-search-more]')) return;
    visibleCount += batchSize;
    renderSearch(false);
    const nextButton = results.querySelector('[data-search-more]');
    if (nextButton) nextButton.focus({preventScroll:true});
    else results.querySelector('.search-result:last-of-type')?.focus({preventScroll:true});
  });
  find('search-suggestions')?.addEventListener('click', event => {
    const button = event.target.closest('[data-search-query]');
    if (!button) return;
    dialogInput.value = button.dataset.searchQuery;
    renderSearch();
    dialogInput.focus({preventScroll:true});
  });
})();
