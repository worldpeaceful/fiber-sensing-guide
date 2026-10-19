'use strict';
(() => {
  const links = [...document.querySelectorAll('[data-directory-link]')];
  if (!links.length) return;

  const targets = [];
  const knownIds = new Set();
  for (const link of links) {
    const id = link.getAttribute('href')?.slice(1);
    const target = id && document.getElementById(id);
    if (target && !knownIds.has(id)) {
      knownIds.add(id);
      targets.push(target);
      target.classList.add('page-directory-target');
    }
  }
  if (!targets.length) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentId = targets[0].id;
  let scrollPending = false;

  function setCurrent(id) {
    currentId = id;
    for (const link of links) {
      const current = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function hashTarget() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return null; }
    return knownIds.has(id) ? document.getElementById(id) : null;
  }

  function reveal(target, focus, behavior) {
    let details = target.closest('details');
    while (details) {
      details.open = true;
      details = details.parentElement?.closest('details');
    }
    setCurrent(target.id);
    if (focus) {
      const focusTarget = target.tagName === 'DETAILS' ? target.querySelector('summary') : target;
      if (focusTarget) {
        if (!['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(focusTarget.tagName) && focusTarget.getAttribute('tabindex') === null) {
          focusTarget.setAttribute('tabindex', '-1');
        }
        focusTarget.focus({preventScroll: true});
      }
    }
    target.scrollIntoView({behavior, block: 'start'});
  }

  function updateFromScroll() {
    const header = document.querySelector('.topbar');
    // 与 html 的 header + 20px scroll-padding 及目标的 8px scroll-margin 对齐。
    const threshold = (header?.getBoundingClientRect().bottom || 0) + 32;
    const positions = targets.map(target => ({target, top: target.getBoundingClientRect().top}));
    let chosen = positions[0];
    let closestTop = -Infinity;
    for (const position of positions) {
      if (position.top <= threshold && position.top > closestTop + 1) {
        chosen = position;
        closestTop = position.top;
      }
    }
    // 同一行的卡片或实验控制区保留用户刚选择的条目。
    const current = positions.find(position => position.target.id === currentId);
    if (current && Math.abs(current.top - chosen.top) < 2) chosen = current;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const documentHeight = Math.max(document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0);
    const scrollTop = window.scrollY ?? document.documentElement.scrollTop ?? 0;
    if (viewportHeight > 0 && documentHeight > viewportHeight && scrollTop + viewportHeight >= documentHeight - 2) {
      chosen = positions.at(-1);
    }
    setCurrent(chosen.target.id);
  }

  function scheduleScrollUpdate() {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      scrollPending = false;
      updateFromScroll();
    });
  }

  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || (event.button !== undefined && event.button !== 0)) return;
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      event.preventDefault();
      const mobileDirectory = link.closest('.page-directory-mobile');
      if (mobileDirectory) mobileDirectory.open = false;

      const hash = '#' + target.id;
      if (window.location.hash !== hash) {
        const url = new URL(window.location.href);
        url.hash = hash;
        if (window.history?.pushState) window.history.pushState(null, '', url.href);
        else window.location.hash = hash;
      }
      reveal(target, true, motion.matches ? 'auto' : 'smooth');
    });
  }

  window.addEventListener('hashchange', () => {
    const target = hashTarget();
    if (target) reveal(target, true, motion.matches ? 'auto' : 'smooth');
    else updateFromScroll();
  });
  window.addEventListener('scroll', scheduleScrollUpdate, {passive: true});
  window.addEventListener('resize', scheduleScrollUpdate);
  window.addEventListener('pageshow', updateFromScroll);
  const initialTarget = hashTarget();
  if (initialTarget) reveal(initialTarget, false, 'auto');
  else updateFromScroll();
})();
