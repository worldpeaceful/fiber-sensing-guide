'use strict';
// 在绘制页面前恢复主题，避免跨页面时先闪出日间背景。
(() => {
  let theme;
  try { theme = window.localStorage.getItem('fiber-field-guide.theme.v1'); } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.setAttribute('content', theme === 'dark' ? '#111827' : '#3459df');
})();
