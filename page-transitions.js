'use strict';
// 独立 HTML 页面保留浏览器的刷新、历史和链接语义。
(() => {
  const files = ['index.html', 'guide.html', 'methods.html', 'lab.html', 'terms.html', 'questions.html'];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const key = 'fiber-field-guide.transition.v1';
  let pending = null, leaveTimer = null, arrivalTimer = null;
  const fileOf = url => url.pathname.split('/').pop() || 'index.html';
  const usesNativeTransition = () => Boolean(window.PageSwapEvent) && Boolean(window.CSS?.supports?.('view-transition-name: fiber-content'));

  function directionFor(from, to) {
    const previous = files.indexOf(fileOf(from)), next = files.indexOf(fileOf(to));
    return previous >= 0 && next >= 0 && next < previous ? 'backward' : 'forward';
  }
  function rememberDestination(destination) {
    const direction = directionFor(new URL(window.location.href), destination);
    root.dataset.transitionDirection = direction;
    try { window.sessionStorage.setItem(key, JSON.stringify({destination: destination.href, direction})); } catch {}
  }
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(key));
    if (saved?.destination === window.location.href) root.dataset.transitionDirection = saved.direction;
    window.sessionStorage.removeItem(key);
  } catch {}
  root.dataset.transitionDirection ||= 'forward';
  if (!motion.matches) root.classList.add('page-arriving');

  function restorePage() {
    clearTimeout(leaveTimer); clearTimeout(arrivalTimer);
    leaveTimer = null; arrivalTimer = null; pending = null;
    root.classList.remove('page-leaving', 'page-arriving');
  }
  function commitNavigation() {
    if (!pending) return;
    const navigation = pending;
    pending = null;
    clearTimeout(leaveTimer); leaveTimer = null;
    try { window.location[navigation.replace ? 'replace' : 'assign'](navigation.href); }
    catch (error) { restorePage(); throw error; }
  }
  window.navigateFiberPage = (href, {replace = false} = {}) => {
    if (pending) return false;
    const destination = new URL(href, window.location.href);
    const current = new URL(window.location.href);
    // 仅对站内内容页做离场处理，查询参数和锚点原样传递。
    const localPage = destination.origin === current.origin && files.includes(fileOf(destination));
    const sameDocument = destination.pathname === current.pathname && destination.search === current.search;
    if (localPage && !sameDocument) rememberDestination(destination);
    if (!localPage || sameDocument || motion.matches || usesNativeTransition()) {
      window.location[replace ? 'replace' : 'assign'](destination.href);
      return true;
    }
    pending = {href: destination.href, replace};
    root.classList.remove('page-arriving');
    root.classList.add('page-leaving');
    leaveTimer = setTimeout(commitNavigation, 140);
    return true;
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || (event.button !== undefined && event.button !== 0) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.getAttribute('download') !== null || (link.getAttribute('target') && link.getAttribute('target') !== '_self') || /\bexternal\b/i.test(link.getAttribute('rel') || '')) return;
    const current = new URL(window.location.href), destination = new URL(link.getAttribute('href'), current);
    if (destination.origin !== current.origin || !files.includes(fileOf(destination)) || (destination.pathname === current.pathname && destination.search === current.search)) return;
    rememberDestination(destination);
    if (motion.matches || usesNativeTransition()) return;
    event.preventDefault();
    window.navigateFiberPage(destination.href);
  });
  document.addEventListener('animationend', event => {
    if (event.animationName === 'fiber-leave' && event.target.id === 'main') commitNavigation();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { restorePage(); return; }
    arrivalTimer = setTimeout(() => root.classList.remove('page-arriving'), 460);
  });
  window.addEventListener('pagereveal', event => {
    const from = window.navigation?.activation?.from?.url;
    if (from) root.dataset.transitionDirection = directionFor(new URL(from), new URL(window.location.href));
    if (event.viewTransition) {
      root.classList.remove('page-arriving');
      if (motion.matches) event.viewTransition.skipTransition();
    }
  });
  window.addEventListener('pageswap', event => {
    if (motion.matches && event.viewTransition) event.viewTransition.skipTransition();
  });
  motion.addEventListener('change', event => {
    if (!event.matches) return;
    root.classList.remove('page-arriving', 'page-leaving');
    commitNavigation();
  });
})();
