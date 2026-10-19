'use strict';
// 温度固定的教学模型。1.2 pm/με 是 1550 nm 附近的典型值，不是设备标定。
(() => {
  const constants = Object.freeze({lengthMm:120, wavelengthNm:1550, sensitivityNm:0.0012, maxStrain:1000, visualTravel:22});
  function sample(strain) {
    if (typeof strain !== 'number' || !Number.isFinite(strain) || strain < 0 || strain > constants.maxStrain) throw new RangeError('应变应为 0–1000 με。');
    return Object.freeze({strain, fraction:strain/constants.maxStrain, travel:constants.visualTravel*strain/constants.maxStrain, elongationMm:constants.lengthMm*strain*1e-6, shiftNm:constants.sensitivityNm*strain, wavelengthNm:constants.wavelengthNm+constants.sensitivityNm*strain});
  }
  const model = Object.freeze({constants,sample});
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  if (typeof window !== 'undefined') window.FiberBenchModel = model;
})();
