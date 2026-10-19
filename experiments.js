'use strict';
// 依据实验画布的可用宽度布局，图形和读数共用 LabMath。
const text = (x, y, value, cls = '', anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
const line = (x1, y1, x2, y2, color = '#3d5277', width = 1, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const path = (points, color, width = 2, extra = '') => `<path d="${points.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const dot = (x, y, color = '#ffd2a1', hollow = false) => `<circle cx="${x}" cy="${y}" r="6" fill="${hollow ? '#12213d' : color}" stroke="${color}" stroke-width="2"/>`;
const DASH = 'stroke-dasharray="6 5"';
function plotFrame(x, y, width, height, left, right, title) {
  let svg = '';
  for (let i = 0; i <= 3; i++) svg += line(x, y - i * height / 3, x + width, y - i * height / 3, '#304769');
  return svg + line(x, y - height, x, y, '#6880a7') + line(x, y, x + width, y, '#6880a7') + text(x, y - height - 18, title, 'small-text') + text(x, y + 27, left, 'plot-label') + text(x + width, y + 27, right, 'plot-label', 'end');
}
function curvePoints(x, width, fn, count = 200) {
  return Array.from({length: count + 1}, (_, i) => [x + width * i / count, fn(i / count)]);
}
function legend(x, y, first = '参考', second = '当前') {
  return line(x, y - 5, x + 23, y - 5, '#8d9dbd', 2, DASH) + text(x + 31, y, first, 'small-text') + line(x + 152, y - 5, x + 175, y - 5, '#9bc9ff', 3) + text(x + 183, y, second, 'small-text');
}
function drawExperiment(width) {
  const compact = width === 360, p = state.position, v = state.strength, a = LabMath.normalized(v), time = state.time, ref = state.reference;
  const x0 = compact ? 68 : 98, x1 = width - 42, fiberSpan = x1 - x0;
  const fiberX = distance => x0 + fiberSpan * distance / 1000;
  const labelX = x => Math.min(width - 55, Math.max(112, x));
  const fiber = y => `<rect x="18" y="${y - 21}" width="${x0 - 21}" height="42" rx="8" fill="#294267" stroke="#536f98"/>` + text((18 + x0) / 2, y + 6, '仪器', '', 'middle') + line(x0, y, x1, y, '#7195cc', 4);
  let svg = '';
  if (state.mode === 'echo') {
    const y = compact ? 108 : 124, px = fiberX(p);
    svg = fiber(y) + line(x0, y + 38, px, y + 38, '#bda7f9', 2, DASH) + dot(px, y, '#9bc9ff') + text(labelX(px), y - 38, p + ' m', 'main-text', 'middle');
    svg += text(x0 + 4, y - 14, '去程 →', 'small-text') + text(x0 + 4, y + 64, '← 回程', 'small-text');
    const movingTime = 3.2 * p / 1000, clock = time % (movingTime + .7), progress = Math.min(1, clock / movingTime);
    if (clock < movingTime / 2) svg += dot(x0 + (px - x0) * progress * 2, y, '#9ed8ff');
    else if (clock < movingTime) svg += dot(px - (px - x0) * (progress * 2 - 1), y + 38, '#c9b0ff');
    else svg += dot(x0, y + 38, '#c9b0ff');
    svg += text(width / 2, compact ? 225 : 217, clock < movingTime / 2 ? '光正在去程' : clock < movingTime ? '回波正在返回' : '回波到达仪器', 'small-text', 'middle');
    const gx = compact ? 44 : 58, gw = width - gx - 36, gy = compact ? 400 : 345, gh = 104;
    svg += plotFrame(gx, gy, gw, gh, '0 μs', LabMath.roundTrip(1000).toFixed(2) + ' μs', '回波时间 · 峰的位置随距离改变');
    const peak = gx + gw * p / 1000, gaussian = center => curvePoints(gx, gw, z => gy - 6 - gh * .72 * Math.exp(-(((gx + gw * z - center) / 12) ** 2)));
    if (ref) svg += path(gaussian(gx + gw * ref.position / 1000), '#8d9dbd', 2, DASH);
    svg += path(gaussian(peak), '#c6aafa', 3) + line(peak, gy - gh, peak, gy, '#8baddb', 1, DASH);
    svg += text(width / 2, compact ? 466 : 402, `往返 ${LabMath.roundTrip(p).toFixed(2)} μs · 路程 ${p * 2} m`, 'small-text', 'middle');
    return svg;
  }
  if (state.mode === 'dts') {
    const y = compact ? 63 : 89, px = fiberX(p), ratio = LabMath.ramanRatio(v);
    svg = fiber(y) + `<rect x="${px - 17}" y="${y - 11}" width="34" height="22" rx="11" fill="${v >= 20 ? '#ffb18b' : '#88d7ef'}"/>` + text(labelX(px), y - 28, v + ' °C', 'main-text', 'middle');
    svg += text(width / 2, y + 44, p + ' m 附近 · 背景 20 °C', 'small-text', 'middle');
    const gx = compact ? 44 : 52, gw = compact ? 282 : 400, gy = compact ? 414 : 340, gh = compact ? 86 : 110;
    svg += plotFrame(gx, gy, gw, gh, '0 m', '1000 m', '沿线温度 · °C');
    svg += text(gx - 7, gy - gh + 5, '120', 'plot-label', 'end') + text(gx - 7, gy + 5, '0', 'plot-label', 'end');
    const trace = (position, temperature) => curvePoints(gx, gw, z => gy - LabMath.temperatureAt(z * 1000, position, temperature) / 120 * gh);
    svg += path(trace(ref?.position ?? p, ref?.strength ?? 20), '#8d9dbd', 2, DASH) + path(trace(p, v), '#ffb18b', 3);
    svg += dot(gx + gw * p / 1000, gy - v / 120 * gh, '#ffb18b');
    const bx = compact ? 102 : 550, by = compact ? 254 : 340, bh = compact ? 84 : 110, gap = compact ? 122 : 100;
    svg += text(bx + gap / 2, by - bh - (compact ? 32 : 17), '两路回波 · 相对比例', 'small-text', 'middle');
    for (const [offset, value, color, name] of [[0, ratio, '#ffb18b', 'anti-Stokes'], [gap, 1, '#95c4ff', 'Stokes']]) {
      const height = value / 2 * bh;
      svg += `<rect x="${bx + offset - 20}" y="${by - height}" width="40" height="${height}" rx="4" fill="${color}"/>` + text(bx + offset, by - height - 10, value.toFixed(2), 'small-text', 'middle') + text(bx + offset, by + 27, name, 'small-text', 'middle');
    }
    svg += legend(gx, compact ? 470 : 402, ref ? '记录温度' : '20 °C 参考', '当前温度');
    return svg;
  }
  if (state.mode === 'dvs') {
    const y = compact ? 80 : 82, px = fiberX(p);
    svg = fiber(y) + text(labelX(px), y - 34, v === 0 ? '无扰动' : p + ' m', 'main-text', 'middle');
    if (v > 0) svg += `<circle cx="${px}" cy="${y}" r="${12 + a * 8 * (.5 + .5 * Math.sin(time * 3))}" stroke="#c7a5ff" fill="none" stroke-width="2"/>`;
    const gx = compact ? 44 : 58, gw = width - gx - 36, gy = compact ? 270 : 250, gh = 88;
    const current = z => LabMath.intensity(z * 1000, p, v, time), before = z => LabMath.intensity(z * 1000, ref?.position ?? p, ref?.strength ?? 0, time);
    svg += plotFrame(gx, gy, gw, gh, '0 m', '1000 m', '参考与当前回波 · 同一时刻');
    const intensityY = value => gy - (value - .15) * gh;
    svg += path(curvePoints(gx, gw, z => intensityY(before(z))), '#8d9dbd', 2, DASH) + path(curvePoints(gx, gw, z => intensityY(current(z))), '#c7a5ff', 3);
    const dy = compact ? 410 : 360, dh = compact ? 62 : 40;
    svg += plotFrame(gx, dy, gw, dh, '0 m', '1000 m', '|当前 − 参考| · 逐点差异');
    svg += path(curvePoints(gx, gw, z => dy - Math.abs(current(z) - before(z)) / .5 * dh), '#9bc9ff', 3);
    if (v > 0) svg += line(gx + gw * p / 1000, gy - gh, gx + gw * p / 1000, dy, '#88a4d1', 1, DASH);
    svg += legend(gx, compact ? 470 : 409, ref ? '记录回波' : '无扰动参考', '当前回波');
    return svg;
  }
  if (state.mode === 'das') {
    const angle = LabMath.phase(v, time), cx = compact ? 100 : 178, cy = compact ? 121 : 211, radius = compact ? 57 : 76;
    svg = text(compact ? 36 : 65, compact ? 24 : 52, '相位差指针', 'main-text') + `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#6685b6" stroke-width="2"/>`;
    svg += line(cx - radius - 10, cy, cx + radius + 10, cy) + line(cx, cy - radius - 10, cx, cy + radius + 10);
    if (ref) {const oldAngle = LabMath.phase(ref.strength, time); svg += line(cx, cy, cx + radius * Math.cos(oldAngle), cy - radius * Math.sin(oldAngle), '#8d9dbd', 2, DASH);}
    else svg += line(cx, cy, cx + radius, cy, '#8d9dbd', 2, DASH);
    svg += line(cx, cy, cx + radius * Math.cos(angle), cy - radius * Math.sin(angle), '#9bc9ff', 4) + dot(cx + radius * Math.cos(angle), cy - radius * Math.sin(angle), '#9bc9ff');
    svg += text(cx, cy + radius + 33, 'Δφ = ' + signedNumber(angle, 2) + ' rad', 'main-text', 'middle');
    svg += text(cx + radius + 8, cy + 8, 'I', 'small-text') + text(cx + 5, cy - radius - 13, 'Q', 'small-text');
    if (compact) svg += text(197, 110, p + ' m', 'main-text') + text(197, 138, '附近的相位差', 'small-text');
    else svg += text(cx, 360, '观察 ' + p + ' m 附近', 'small-text', 'middle');
    const gx = compact ? 44 : 365, gw = compact ? 282 : 347, gy = compact ? 405 : 322, gh = compact ? 106 : 156, zero = gy - gh / 2;
    svg += plotFrame(gx, gy, gw, gh, '过去', '现在', '动态相位差 · 与指针同步');
    svg += line(gx, zero, gx + gw, zero, '#6e86aa', 1, DASH);
    svg += text(gx - 7, zero - gh * .43 + 5, '+1.2', 'plot-label', 'end') + text(gx - 7, zero + gh * .43 + 5, '−1.2', 'plot-label', 'end');
    const trace = strength => curvePoints(gx, gw, z => zero - LabMath.phase(strength, time + (z - 1) * 2 * Math.PI) / 1.2 * gh * .43);
    if (ref) svg += path(trace(ref.strength), '#8d9dbd', 2, DASH);
    svg += path(trace(v), '#9bc9ff', 3) + dot(gx + gw, zero - angle / 1.2 * gh * .43, '#ffd2a1');
    svg += text(compact ? 180 : 538, compact ? 467 : 395, '橙点 = 此刻指针的相位差', 'small-text', 'middle');
    return svg;
  }
  if (state.mode === 'fbg') {
    const y = compact ? 105 : 110, spacing = 10 + a * 4;
    svg = fiber(y) + text(width / 2, compact ? 36 : 51, '光栅间距 · 温度保持不变', 'main-text', 'middle');
    for (let i = 0; i < 10; i++) svg += line(width / 2 + (i - 4.5) * spacing, y - 23, width / 2 + (i - 4.5) * spacing, y + 23, '#9bc9ff', 3);
    svg += text(width / 2, y + 60, a === 0 ? '不伸缩' : a > 0 ? '拉长 → 间距变大' : '压短 → 间距变小', 'small-text', 'middle');
    const gx = compact ? 44 : 58, gw = width - gx - 36, gy = compact ? 410 : 342, gh = compact ? 121 : 126;
    svg += plotFrame(gx, gy, gw, gh, '较短波长', '较长波长', '反射光谱 · 峰移动，幅值保持');
    const spectrum = strength => curvePoints(gx, gw, z => gy - 5 - gh * .77 * Math.exp(-(((z - (.5 + strength / 100 * .22)) / .045) ** 2)));
    svg += path(spectrum(ref?.strength ?? 0), '#8d9dbd', 2, DASH) + path(spectrum(v), '#9bc9ff', 3);
    const peak = gx + gw * (.5 + a * .22);
    svg += dot(peak, gy - 5 - gh * .77) + legend(gx, compact ? 470 : 403, ref ? '记录反射峰' : '零伸缩参考', '当前反射峰');
    return svg;
  }
  const cx = compact ? 180 : 183, cy = compact ? 119 : 172;
  const gx = compact ? 44 : 402, gw = compact ? 282 : 310, gy = compact ? 410 : 340, gh = compact ? 120 : 148;
  const signed = ['shape', 'fog', 'current'].includes(state.mode), zero = signed ? gy - gh / 2 : gy;
  const graphTitle = {pressure:'膜片形变 · 归一化',shape:'两侧纤芯相对应变',fog:'萨格纳克相位差 · rad',chemical:'相对荧光强度 · 0–1',current:'偏振旋转 · °'}[state.mode];
  svg += plotFrame(gx, gy, gw, gh, state.mode === 'chemical' ? 'pH 0' : state.mode === 'shape' ? '沿线起点' : signed ? '−100%' : '0%', state.mode === 'chemical' ? 'pH 14' : state.mode === 'shape' ? '沿线终点' : '100%', graphTitle);
  if (signed) {
    svg += line(gx, zero, gx + gw, zero, '#6e86aa', 1, DASH);
    const top = state.mode === 'fog' ? '+1.2' : state.mode === 'current' ? '+60' : '+1';
    const bottom = state.mode === 'fog' ? '−1.2' : state.mode === 'current' ? '−60' : '−1';
    svg += text(gx - 7, zero - gh * .4 + 5, top, 'plot-label', 'end') + text(gx - 7, zero + gh * .4 + 5, bottom, 'plot-label', 'end');
  } else svg += text(gx - 7, gy - gh * .85 + 5, '1', 'plot-label', 'end') + text(gx - 7, gy + 5, '0', 'plot-label', 'end');
  if (state.mode === 'pressure') {
    const base = cy + 5, sag = a * 32, fy = base + 69;
    svg += text(cx, compact ? 29 : 46, '压力 → 膜片 → 光学腔', 'main-text', 'middle') + line(cx - 120, base, cx + 120, base, '#8195b6', 1, DASH);
    svg += `<path d="M ${cx - 120} ${base} Q ${cx} ${base + sag * 2} ${cx + 120} ${base}" fill="none" stroke="#9bc9ff" stroke-width="4"/>`;
    if (v > 0) for (const dx of [-64, 0, 64]) {
      const start = base - 29 - a * 32, end = base - 12;
      svg += line(cx + dx, start, cx + dx, end, '#ffc29f', 2) + `<path d="M${cx + dx - 5} ${end - 7}l5 7 5-7" fill="none" stroke="#ffc29f" stroke-width="2"/>`;
    }
    svg += line(cx, base + sag, cx, fy-10, '#9bc9ff', 2) + `<rect x="${cx-12}" y="${fy-10}" width="24" height="28" rx="3" fill="#294267" stroke="#9bc9ff"/>`;
    svg += text(cx, compact ? 242 : 310, '虚线：未受压的膜片', 'small-text', 'middle');
  } else if (state.mode === 'shape') {
    const span = compact ? 266 : 272, start = cx - span / 2, base = compact ? 139 : 192;
    svg += text(cx, compact ? 29 : 46, '蓝：纤芯 A · 紫：纤芯 B', 'small-text', 'middle');
    const shapeTrace = (strength, offset) => curvePoints(start, span, z => base + offset - strength / 100 * span / 6 * Math.sin(Math.PI * z));
    svg += line(start, base, start + span, base, '#7187ac', 1, DASH);
    if (ref) svg += path(shapeTrace(ref.strength, 0), '#8d9dbd', 2, DASH);
    svg += path(shapeTrace(v, -5), '#9bc9ff', 4) + path(shapeTrace(v, 5), '#c7a5ff', 3);
    for (const [sign, color] of [[1, '#9bc9ff'], [-1, '#c7a5ff']]) {
      if (ref) svg += path(curvePoints(gx, gw, z => zero - sign * LabMath.shapeStrain(z, ref.strength) * gh * .42), '#8d9dbd', 2, DASH);
      svg += path(curvePoints(gx, gw, z => zero - sign * LabMath.shapeStrain(z, v) * gh * .42), color, 3);
    }
    svg += text(cx, compact ? 248 : 303, v === 0 ? '直线：两侧应变为零' : v > 0 ? 'A 伸长 · B 压短' : 'A 压短 · B 伸长', 'small-text', 'middle');
    svg += text(gx, compact ? 472 : 407, '正值：伸长', 'small-text') + text(gx + gw, compact ? 472 : 407, '负值：压短', 'small-text', 'end');
    return svg;
  } else if (state.mode === 'fog') {
    const radius = compact ? 50 : 61, phi = LabMath.phaseLimit(v);
    svg += text(cx, compact ? 27 : 44, '两束光 · 沿同一环反向传播', 'small-text', 'middle') + `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#7699cc" stroke-width="4"/>`;
    for (const [direction, color] of [[1, '#9bc9ff'], [-1, '#c7a5ff']]) {
      const angle = time * 1.7 * direction;
      svg += dot(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), color);
    }
    svg += text(cx, cy + 6, v === 0 ? '静止' : v > 0 ? '↻ 正向' : '↺ 反向', 'main-text', 'middle');
    const wx = compact ? 55 : 56, ww = compact ? 250 : 254, wy = compact ? 234 : 304;
    svg += text(cx, wy - 35, '两路光的相位关系（放大）', 'small-text', 'middle');
    for (const [offset, color] of [[phi / 2, '#9bc9ff'], [-phi / 2, '#c7a5ff']]) svg += path(curvePoints(wx, ww, z => wy - 16 * Math.sin(z * 4 * Math.PI + offset)), color, 2.5);
  } else if (state.mode === 'chemical') {
    const f = LabMath.fluorescence(v);
    svg += text(cx, compact ? 27 : 46, '敏感材料的示意荧光', 'main-text', 'middle');
    svg += `<rect x="${cx - 123}" y="${cy - 37}" width="246" height="82" rx="16" fill="#253f5f" stroke="#5b799f"/>` + line(cx - 115, cy + 4, cx + 107, cy + 4, '#9bc9ff', 4);
    svg += `<rect x="${cx - 35}" y="${cy - 20}" width="70" height="48" rx="12" fill="#78e7c2" opacity="${.12 + .8 * f}"/><circle cx="${cx}" cy="${cy + 4}" r="${15 + 19 * f}" fill="none" stroke="#a4f8d9" opacity="${.25 + .7 * f}"/>`;
    svg += text(cx, compact ? 222 : 283, 'pH ' + v.toFixed(1) + ' → 荧光 ' + f.toFixed(3), 'small-text', 'middle');
  } else if (state.mode === 'current') {
    const radius = compact ? 55 : 68, angle = LabMath.rotation(v) * Math.PI / 180;
    svg += text(cx, compact ? 27 : 45, '偏振相对参考方向旋转', 'small-text', 'middle') + `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#6488ba" stroke-width="2"/>`;
    svg += line(cx - radius, cy, cx + radius, cy, '#8d9dbd', 2, DASH);
    if (ref) {const oldAngle = LabMath.rotation(ref.strength) * Math.PI / 180; svg += line(cx - radius * Math.cos(oldAngle), cy + radius * Math.sin(oldAngle), cx + radius * Math.cos(oldAngle), cy - radius * Math.sin(oldAngle), '#8d9dbd', 2, DASH);}
    svg += line(cx - radius * Math.cos(angle), cy + radius * Math.sin(angle), cx + radius * Math.cos(angle), cy - radius * Math.sin(angle), '#ffd2a1', 4);
    if (v !== 0) svg += `<path d="M${cx + 35} ${cy} A35 35 0 0 ${angle > 0 ? 0 : 1} ${cx + 35 * Math.cos(angle)} ${cy - 35 * Math.sin(angle)}" stroke="#ffd2a1" stroke-width="2" fill="none"/>`;
    svg += text(cx, compact ? 224 : 285, signedNumber(LabMath.rotation(v), 1) + '° · ' + (v === 0 ? '零电流' : v > 0 ? '正向电流 ⊙' : '反向电流 ⊗'), 'small-text', 'middle');
  }
  const response = z => state.mode === 'chemical' ? LabMath.fluorescence(z * 14) : signed ? z * 2 - 1 : z;
  const responseY = value => signed ? zero - value * gh * .4 : gy - value * gh * .85;
  svg += path(curvePoints(gx, gw, z => responseY(response(z))), '#9bc9ff', 3);
  const marker = (strength, hollow) => {
    const value = state.mode === 'chemical' ? LabMath.fluorescence(strength) : LabMath.normalized(strength);
    const fraction = state.mode === 'chemical' ? strength / 14 : signed ? (strength / 100 + 1) / 2 : strength / 100;
    return dot(gx + gw * fraction, responseY(value), hollow ? '#b3c5e5' : '#ffd2a1', hollow);
  };
  if (ref) svg += marker(ref.strength, true);
  svg += marker(v, false);
  svg += text(gx + gw / 2, compact ? 469 : 402, ref ? '空心点：记录 · 橙点：当前' : '橙点：当前参数的响应', 'small-text', 'middle');
  return svg;
}
