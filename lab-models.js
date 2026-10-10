'use strict';
// 科普模型：实际单位只用于往返时间；其余比例不作为仪器标定。
const LabMath = Object.freeze({
  roundTrip: distance => 2 * distance * 1.468 / 299792458 * 1e6,
  ramanRatio: temperature => Math.exp(625 * (1 / 293.15 - 1 / (temperature + 273.15))),
  temperatureAt: (distance, position, temperature) => 20 + (temperature - 20) * Math.exp(-(((distance - position) / 80) ** 2)),
  intensity: (distance, position, strength, time) => .65 + .12 * Math.sin(distance * .02) + .06 * Math.sin(distance * .071) + strength / 100 * .24 * Math.cos((distance - position) / 12 + time * 2) * Math.exp(-(((distance - position) / 70) ** 2)),
  phase: (strength, time) => strength * .012 * Math.sin(time * 2),
  phaseLimit: strength => strength * .012,
  fluorescence: ph => 1 / (1 + 10 ** (7 - ph)),
  normalized: strength => strength / 100,
  rotation: strength => strength * .6,
  shapeStrain: (fraction, strength) => strength / 100 * Math.sin(Math.PI * fraction) / (1 + (strength / 100 * Math.PI / 6 * Math.cos(Math.PI * fraction)) ** 2) ** 1.5,
  snap(value, min, max, step) {
    const decimals = String(step).split('.')[1]?.length || 0;
    return Number(Math.min(max, Math.max(min, min + Math.round((value - min) / step) * step)).toFixed(decimals));
  }
});
if (typeof module !== 'undefined') module.exports = LabMath;
