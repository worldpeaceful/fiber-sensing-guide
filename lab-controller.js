'use strict';
const modeMemory = new Map();
let animationFrame = 0, lastDraw = 0, labVisible = true, lastDrawingWidth = 0, labScenePending = false;
let labRetryFocusMode = null;
const modeOrder = EXPERIMENT_GROUPS.flatMap(group => group.modes.map(([id]) => id));
const modeNames = Object.fromEntries(EXPERIMENT_GROUPS.flatMap(group => group.modes));
const positionedModes = ['echo', 'dts', 'dvs', 'das'];
const LAB_STORAGE_KEY = 'fiber-field-guide.lab.v1';

function validLabParameters(mode, value) {
  const spec = MODES[mode];
  if (!spec || !value || typeof value !== 'object' || !Number.isFinite(value.position) || value.position < 50 || value.position > 950 || !Number.isFinite(value.strength) || value.strength < (spec.min ?? 0) || value.strength > (spec.max ?? 0)) return null;
  return {position: LabMath.snap(value.position, 50, 950, 10), strength: LabMath.snap(value.strength, spec.min ?? 0, spec.max ?? 0, spec.step ?? 1)};
}
function saveLabSession() {
  try {
    rememberMode();
    window.sessionStorage.setItem(LAB_STORAGE_KEY, JSON.stringify({version: 1, currentMode: state.mode, paused: state.paused, speed: state.speed, modes: Object.fromEntries(modeMemory)}));
  } catch {} // 存储被浏览器禁用时，当前页的实验仍然可用。
}
function restoreLabSession() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(LAB_STORAGE_KEY));
    if (!saved || saved.version !== 1 || !saved.modes || typeof saved.modes !== 'object') return null;
    for (const mode of modeOrder) {
      const entry = saved.modes[mode], parameters = validLabParameters(mode, entry);
      if (!parameters) continue;
      modeMemory.set(mode, {...parameters, time: Number.isFinite(entry.time) && entry.time >= 0 ? entry.time : 1.2, reference: validLabParameters(mode, entry.reference)});
    }
    if (typeof saved.paused === 'boolean') state.paused = saved.paused;
    if ([.5, 1, 1.5].includes(saved.speed)) state.speed = saved.speed;
    return Object.hasOwn(MODES, saved.currentMode) ? saved.currentMode : null;
  } catch {return null;}
}

function labResult(mode, position, strength) {
  const n = LabMath.normalized(strength);
  const results = {
    echo: ['回波往返时间', LabMath.roundTrip(position).toFixed(2), 'μs', '距离包含去程与回程。按群折射率 1.468 换算。'],
    dts: ['anti-Stokes / Stokes 相对比值', LabMath.ramanRatio(strength).toFixed(2), '×', '把 20 °C 时的比值设为 1。这里显示归一化比例，实际需要校准。'],
    fbg: ['反射峰相对偏移', signedNumber(n, 2), '示意单位', '正值：向较长波长移动；负值：向较短波长移动。温度固定。'],
    dvs: ['扰动示意位置', strength === 0 ? '无扰动' : String(position), strength === 0 ? '' : 'm', strength === 0 ? '当前没有施加扰动。位置滑块只是观察位置，不能作为检出结果。' : '这里显示设定的扰动位置。下方差异使用当前与参考回波逐点计算。'],
    das: ['相位差摆动范围', strength === 0 ? '0.00' : '±' + LabMath.phaseLimit(strength).toFixed(2), 'rad', '范围描述整个摆动的幅度；图中指针显示瞬时值。比例仅用于示意。'],
    pressure: ['相对膜片形变', n.toFixed(2), '归一化', '零压力对应参考形态；这里未指定实际压力、膜片尺寸或腔长。'],
    shape: ['弯曲方向', strength === 0 ? '直线参考' : strength > 0 ? '向上弯曲' : '向下弯曲', '', '下方蓝、紫两条曲线分别表示两侧纤芯的相对应变。'],
    fog: ['示意萨格纳克相位差', signedNumber(LabMath.phaseLimit(strength), 2), 'rad', '反向转动时相位差反号；静止时为零。系数仅为教学比例。'],
    chemical: ['相对荧光强度', LabMath.fluorescence(strength).toFixed(3), '归一化', '理想探针的参考 pKa 为 7；响应范围 0–1，并非所有探针的通用关系。'],
    current: ['示意偏振旋转', signedNumber(LabMath.rotation(strength), 1), '°', '零电流对应虚线方向；电流反向，旋转方向也反向。比例仅为示意。']
  };
  return results[mode];
}
function signedNumber(value, decimals) {
  return (value > 0 ? '+' : '') + (Math.abs(value) < .5 * 10 ** -decimals ? 0 : value).toFixed(decimals);
}
function rememberMode() {
  modeMemory.set(state.mode, {position: state.position, strength: state.strength, time: state.time, reference: state.reference ? {...state.reference} : null});
}
function selectMode(mode, options = {}) {
  if (!Object.hasOwn(MODES, mode)) return;
  if(mode!==state.mode)labRetryFocusMode=null;
  if (!options.initial) rememberMode();
  const saved = options.reset ? null : modeMemory.get(mode);
  state.mode = mode;
  state.position = saved?.position ?? (options.position ?? 600);
  state.strength = saved?.strength ?? MODES[mode].default;
  state.time = saved?.time ?? 1.2;
  state.reference = saved?.reference ? {...saved.reference} : null;
  const m = MODES[mode], content = LAB_CONTENT[mode], positioned = positionedModes.includes(mode);
  document.querySelectorAll('[data-mode]').forEach(button => {
    const selected = button.dataset.mode === mode;
    button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
  });
  $('lab-panel').setAttribute('aria-labelledby', 'tab-' + mode);
  $('lab-title').textContent = m.title; $('lab-copy').textContent = m.copy;
  $('stage-caption').textContent = m.caption; $('stage-hint').textContent = m.hint;
  $('svg-title').textContent = m.svg;
  $('position-control').hidden = !positioned;
  $('strength-control').hidden = mode === 'echo';
  for (const id of ['position', 'position-number']) $(id).disabled = !positioned;
  for (const id of ['strength', 'strength-number']) $(id).disabled = mode === 'echo';
  if (mode !== 'echo') {
    $('strength-label').textContent = m.label;
    for (const id of ['strength', 'strength-number']) Object.assign($(id), {min: m.min ?? 0, max: m.max, step: m.step ?? 1});
    $('strength-number').setAttribute('aria-label', m.label + '数值');
    $('strength-min').textContent = (m.min ?? 0) + (m.unit || '');
    $('strength-max').textContent = m.max + (m.unit || '');
  }
  $('animation-tools').hidden = m.animated === false;
  $('static-note').hidden = m.animated !== false;
  $('lab-progress').textContent = `${modeOrder.indexOf(mode) + 1} / ${modeOrder.length} · ${modeNames[mode]}`;
  $('lab-picker-current').textContent = modeNames[mode];
  $('lab-presets').innerHTML = content.presets.map(([label, value], index) => `<button type="button" data-preset="${index}" aria-pressed="false">${esc(label)}</button>`).join('');
  $('lab-steps').innerHTML = content.steps.map(([title, copy], index) => `<li><span aria-hidden="true">${index + 1}</span><strong>${esc(title)}</strong><p>${esc(copy)}</p></li>`).join('');
  $('challenge-question').textContent = content.question;
  $('challenge-answer').textContent = content.takeaway;
  $('lab-challenge').open = false; $('lab-model').open = false;
  $('model-copy').textContent = content.formula;
  $('lab-related').innerHTML = '<span>遇到生词：</span>' + content.terms.map(id => `<button data-term="${id}">${esc(TERMS.find(term => term.id === id).name)}</button>`).join('') + content.sources.map(id => `<a href="${SOURCES[id].url}" target="_blank" rel="noopener noreferrer">原理资料 ↗</a>`).join('');
  clearControlError(); updateControls(); draw(); wakeAnimation();
  if (typeof syncLabModeUrl === 'function') syncLabModeUrl(mode);
}
function labObservation() {
  const p = state.position, s = state.strength;
  const direction = s > 0 ? '正向' : s < 0 ? '反向' : '零';
  return {
    echo: `现在观察 ${p} m 处：光来回经过 ${p * 2} m，往返 ${LabMath.roundTrip(p).toFixed(2)} μs。试着记录它，再把位置移远，比较两条回波峰。`,
    dts: s === 20 ? '局部温度与 20 °C 的背景相同，温度曲线是平的，相对回波比值为 1。' : `${p} m 附近是${s > 20 ? '热点' : '冷点'}。改变温度会改变峰高和回波比例；只移动位置时，设定温度保持不变。`,
    fbg: s === 0 ? '光栅回到不伸缩的参考状态。当前反射峰与零伸缩峰重合。' : `现在${s > 0 ? '拉长' : '压短'}光栅：条纹${s > 0 ? '变疏' : '变密'}，反射峰向${s > 0 ? '右侧的长波' : '左侧的短波'}移动。`,
    dvs: s === 0 ? (state.reference?.strength ? '当前无扰动，但记录对照曾有扰动，因此两者仍可能存在差异。清除对照后，两条回波重合，差异为零。' : '当前无扰动，两条回波重合，差异曲线为零。位置滑块不代表检测到了事件。') : `扰动设在 ${p} m 附近。下方差异来自上方两条回波的真实逐点相减；暂停后可把两幅图对应起来看。`,
    das: s === 0 ? '伸缩幅度为零，指针停止摆动，动态相位差曲线成为零线。' : `示意摆幅为 ±${LabMath.phaseLimit(s).toFixed(2)} rad。波形最右端和指针对应同一时刻；改变幅度只改变摆幅，动画周期不变。`,
    pressure: s === 0 ? '压力回到零：受压标记消失，膜片回到参考形态，归一化响应为零。' : `相对压力为 ${s}%：膜片下凹，固定端面与膜片之间的光学腔缩短。响应图的实心点与右侧归一化读数对应。`,
    shape: s === 0 ? '光纤保持直线，两侧应变都回到零线。' : `${s > 0 ? '向上' : '向下'}弯曲时，纤芯 A（蓝）${s > 0 ? '伸长' : '压短'}，纤芯 B（紫）${s > 0 ? '压短' : '伸长'}。反向弯曲会交换两条曲线的符号。`,
    fog: s === 0 ? '光纤环静止，相位差为零；两路示意波形重合。环内光点仍在传播，传播与环转动是不同的事情。' : `${direction}转动产生 ${signedNumber(LabMath.phaseLimit(s), 2)} rad 的示意相位差。切换到相反转向，看波形相位关系与响应点一起反转。`,
    chemical: s === 7 ? '本探针在 pH 7 时相对荧光为 0.500，处于响应曲线中段。' : `pH ${s.toFixed(1)} 对应相对荧光 ${LabMath.fluorescence(s).toFixed(3)}。靠近曲线两端时逐渐饱和，同样的 pH 改变量不再带来同样的亮度变化。`,
    current: s === 0 ? '零电流时偏振线与参考虚线重合，旋转角度为 0°。' : `${direction}电流对应 ${signedNumber(LabMath.rotation(s), 1)}° 的示意偏振旋转。偏振线和响应点表示相对参考方向的旋转；反向电流让角度反号。`
  }[state.mode];
}
function parameterSummary(position, strength) {
  if (state.mode === 'echo') return position + ' m';
  const m = MODES[state.mode];
  return (positionedModes.includes(state.mode) ? position + ' m · ' : '') + strength + (m.unit || '');
}
function updateControls() {
  const m = MODES[state.mode];
  for (const id of ['position', 'position-number']) $(id).value = state.position;
  for (const id of ['strength', 'strength-number']) $(id).value = state.strength;
  $('position-value').textContent = state.position + ' m';
  $('strength-value').textContent = (state.strength > 0 && (m.min ?? 0) < 0 ? '+' : '') + state.strength + (m.unit ? ' ' + m.unit : '');
  $('position').setAttribute('aria-valuetext', state.position + ' 米');
  $('strength').setAttribute('aria-valuetext', state.strength + ' ' + (m.unit || 'pH'));
  const result = labResult(state.mode, state.position, state.strength);
  $('result-label').textContent = result[0]; $('result-value').innerHTML = esc(result[1]) + ` <small>${esc(result[2])}</small>`; $('result-copy').textContent = result[3];
  $('stage-reading').textContent = result[0] + '：' + result[1] + ' ' + result[2];
  $('observation-copy').textContent = labObservation();
  $('svg-desc').textContent = MODES[state.mode].hint + ' ' + labObservation();
  document.querySelectorAll('[data-preset]').forEach(button => {
    const value = LAB_CONTENT[state.mode].presets[Number(button.dataset.preset)][1];
    button.setAttribute('aria-pressed', String(value === (state.mode === 'echo' ? state.position : state.strength)));
  });
  $('play-button').textContent = state.paused ? '播放动画' : '暂停动画';
  $('play-button').setAttribute('aria-pressed', String(!state.paused));
  $('animation-speed').value = state.speed;
  $('lab-comparison').hidden = !state.reference;
  if (state.reference) {
    const r = labResult(state.mode, state.reference.position, state.reference.strength);
    $('reference-parameter').textContent = parameterSummary(state.reference.position, state.reference.strength);
    $('reference-result').textContent = r[1] + ' ' + r[2];
    $('current-parameter').textContent = parameterSummary(state.position, state.strength);
    $('current-result').textContent = result[1] + ' ' + result[2];
    $('comparison-note').textContent = ['dvs', 'das'].includes(state.mode) ? '虚线与当前图形对齐同一动画时刻，比较参数变化。' : '虚线或空心点表示记录对照；实线或实心点表示当前。';
  }
  window.LabLearning?.updateSummary({mode:state.mode,position:state.position,strength:state.strength,reference:state.reference,result});
  dirty = true;
  saveLabSession();
}
function clearControlError() {
  $('control-error').hidden = true;
  for (const id of ['position-number', 'strength-number']) $(id).removeAttribute('aria-invalid');
}
function setLabParameter(name, value) {
  const m = MODES[state.mode], min = name === 'position' ? 50 : m.min ?? 0, max = name === 'position' ? 950 : m.max;
  const step = name === 'position' ? 10 : m.step ?? 1;
  if (value === '' || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) {
    $(name + '-number').setAttribute('aria-invalid', 'true');
    $('control-error').textContent = `请输入 ${min} 至 ${max} 之间的有效数值。当前实验参数保持原值。`;
    $('control-error').hidden = false; return false;
  }
  state[name] = LabMath.snap(Number(value), min, max, step);
  clearControlError(); updateControls(); draw(); return true;
}
function draw() {
  const loader=window.LabSceneLoader,stage=$('lab-stage'),status=$('lab-scene-status');
  if(loader&&window.SVGSVGElement&&!window.LabAnatomyScenes?.[state.mode]){
    labScenePending=true;
    window.LabAnatomy?.clear($('lab-apparatus'));window.LabLearning?.clearScene();
    const failed=loader.status(state.mode)==='error';
    stage.classList.add('anatomy-pending');stage.setAttribute('aria-busy',String(!failed));
    status.hidden=false;$('lab-scene-message').textContent=failed?'装置暂时未能加载，参数和记录已保留。':'正在准备'+modeNames[state.mode]+'装置…';
    $('retry-lab-scene').hidden=!failed;
    if(!failed)loader.load(state.mode);
    dirty=false;return;
  }
  labScenePending=false;
  if(status){status.hidden=true;stage.classList.remove('anatomy-pending');stage.setAttribute('aria-busy','false');}
  const width = $('lab-svg').clientWidth < 580 ? 360 : 760;
  lastDrawingWidth = width;
  if (typeof window.LabAnatomy !== 'undefined' && window.LabAnatomy.render({mode:state.mode,position:state.position,strength:state.strength,time:state.time,reference:state.reference,width,host:$('lab-apparatus'),scene:$('scene'),svg:$('lab-svg'),paused:state.paused,still:typeof reducedMotion!=='undefined' && reducedMotion.matches})) {window.LabLearning?.syncScene(state.mode,$('lab-apparatus'),$('lab-svg'));dirty=false;return;}
  if (typeof window.LabAnatomy !== 'undefined') window.LabAnatomy.clear($('lab-apparatus'));
  $('lab-svg').setAttribute('viewBox', `0 0 ${width} ${width === 360 ? 480 : 420}`);
  $('scene').innerHTML = drawExperiment(width);
  window.LabLearning?.clearScene();
  dirty = false;
}
function animationCanRun() {
  return !state.paused && MODES[state.mode].animated !== false && !document.hidden && labVisible && !labScenePending && !(typeof reducedMotion!=='undefined' && reducedMotion.matches);
}
function wakeAnimation() {
  if (!animationFrame && animationCanRun()) {lastFrame = 0; animationFrame = requestAnimationFrame(animate);}
}
function animate(timestamp) {
  animationFrame = 0;
  if (!animationCanRun()) {lastFrame = 0; return;}
  const dt = lastFrame ? Math.min((timestamp - lastFrame) / 1000, .1) : 0;
  lastFrame = timestamp; state.time += dt * state.speed;
  if (timestamp - lastDraw >= 50) {draw(); lastDraw = timestamp;}
  animationFrame = requestAnimationFrame(animate);
}
function initLabControls() {
  window.LabSceneLoader?.subscribe(mode=>{if(mode===state.mode){
    const returnFocus=labRetryFocusMode===mode&&(document.activeElement===document.body||document.activeElement===$('retry-lab-scene'));
    draw();if(returnFocus)(window.LabSceneLoader.status(mode)==='ready'?$('inspect-buttons').querySelector('button'):$('retry-lab-scene'))?.focus({preventScroll:true});
    labRetryFocusMode=null;wakeAnimation();
  }});
  $('retry-lab-scene')?.addEventListener('click',()=>{labRetryFocusMode=state.mode;window.LabSceneLoader?.load(state.mode,{retry:true});draw();});
  for (const name of ['position', 'strength']) {
    $(name).addEventListener('input', event => setLabParameter(name, event.target.value));
    $(name + '-number').addEventListener('change', event => setLabParameter(name, event.target.value));
    $(name + '-number').addEventListener('keydown', event => {
      if (event.key === 'Enter') {event.preventDefault(); setLabParameter(name, event.target.value);}
      if (event.key === 'Escape') {event.preventDefault(); clearControlError(); updateControls();}
    });
  }
  $('lab-presets').addEventListener('click', event => {
    const button = event.target.closest('[data-preset]'); if (!button) return;
    const value = LAB_CONTENT[state.mode].presets[Number(button.dataset.preset)][1];
    setLabParameter(state.mode === 'echo' ? 'position' : 'strength', value);
  });
  $('compare-button').addEventListener('click', () => {state.reference = {position: state.position, strength: state.strength}; updateControls(); draw();});
  $('clear-comparison').addEventListener('click', () => {state.reference = null; $('compare-button').focus({preventScroll:true}); updateControls(); draw();});
  $('reset-button').addEventListener('click', () => selectMode(state.mode, {reset: true, position: 600}));
  $('play-button').addEventListener('click', () => {state.paused = !state.paused; updateControls(); draw(); wakeAnimation();});
  $('step-button').addEventListener('click', () => {state.paused = true; state.time += .35; updateControls(); draw();});
  $('animation-speed').addEventListener('change', event => {state.speed = Number(event.target.value); lastFrame = 0; saveLabSession();});
  for (const [id, delta] of [['previous-experiment', -1], ['next-experiment', 1]]) {
    $(id).addEventListener('click', () => selectMode(modeOrder[(modeOrder.indexOf(state.mode) + delta + modeOrder.length) % modeOrder.length]));
  }
  $('lab-related').addEventListener('click', event => {const button = event.target.closest('[data-term]'); if (button) openTerm(button.dataset.term, button);});
  const resizing = new ResizeObserver(() => {
    const width = $('lab-svg').clientWidth < 580 ? 360 : 760;
    if (width !== lastDrawingWidth) draw();
  }); resizing.observe($('lab-stage'));
  const visibility = new IntersectionObserver(entries => {labVisible = entries[entries.length-1].isIntersecting; if (labVisible) wakeAnimation();}, {rootMargin:'80px'}); visibility.observe($('lab-stage'));
  document.addEventListener('visibilitychange', () => {lastFrame = 0; wakeAnimation();});
  window.addEventListener('pagehide', saveLabSession);
  window.LabLearning?.init();
}
