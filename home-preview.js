'use strict';

// 场景的问题和介绍复用功能图鉴数据，首页仅提供选择与跳转。
(() => {
  const question = document.getElementById('scene-question');
  const description = document.getElementById('scene-description');
  const symbol = document.getElementById('scene-symbol');
  const link = document.getElementById('scene-experiment');
  const action = document.getElementById('scene-action');
  const status = document.getElementById('scene-announcement');
  const scenes = {
    temperature: {mode:'dts', symbol:'°C', label:'温度'},
    strain: {mode:'fbg', symbol:'↔', label:'伸缩'},
    vibration: {mode:'das', symbol:'∿', label:'振动'}
  };
  if (!question || typeof FUNCTIONS === 'undefined') return;
  function selectScene(id, announce) {
    const scene = scenes[id];
    const content = FUNCTIONS.find(item => item.id === id);
    if (!scene || !content) return;
    question.textContent = content.question;
    description.textContent = content.one;
    symbol.textContent = scene.symbol;
    action.textContent = '动手观察' + scene.label;
    link.setAttribute('href', 'lab.html?mode=' + scene.mode);
    if (announce) status.textContent = '已选择' + scene.label + '。' + content.question + content.one;
  }
  document.querySelectorAll('input[name="scene"]').forEach(input => {
    input.addEventListener('change', () => selectScene(input.value, true));
  });
  // 使用浏览器恢复的表单状态初始化，确保返回页面后文案与选择一致。
  window.addEventListener('pageshow', () => {
    const selected = document.querySelector('input[name="scene"]:checked');
    if (selected) selectScene(selected.value, false);
  });
})();
