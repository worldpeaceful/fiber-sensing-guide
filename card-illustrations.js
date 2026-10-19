'use strict';
// 每幅图只保留主要对象、一个变化过程和两个短标签；完整解释放在详情文字中。
function cardIllustration(content) {
 return '<span class="card-illustration"><svg viewBox="0 0 320 160" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="var(--ill-ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'+content+'</g></svg></span>';
}
function illustrationLabel(x,y,label,color='ink',size=16) {
 return '<text x="'+x+'" y="'+y+'" fill="var(--ill-'+color+')" stroke="none" text-anchor="middle" font-family="inherit" font-size="'+size+'">'+label+'</text>';
}
function illustrationArrow(x1,y,x2,color='line') {
 const dir=x2>x1?1:-1;
 return '<path d="M'+x1+' '+y+'H'+x2+'m'+(-dir*7)+'-5 '+(dir*7)+' 5 '+(-dir*7)+' 5" stroke="var(--ill-'+color+')"/>';
}
function illustrationPair(left,right,first,second) {
 return left+illustrationArrow(164,76,196)+right+illustrationLabel(90,140,first)+illustrationLabel(258,140,second);
}
function illustrationSpectrumShift() {
 return '<path d="M216 40v69h88" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M221 105c13 0 11-47 23-47s10 47 23 47" stroke="var(--ill-line)" stroke-dasharray="5 5"/>'+
 '<path d="M249 105c13 0 11-47 23-47s10 47 23 47" stroke="var(--ill-blue)" stroke-width="3.5"/>';
}
// 只放大各自的关键结构，仍保持两个短标签。
function illustrationFiberClamps(){
 return '<path d="M26 102h127v11H26Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M36 97V52h22v45m64 0V52h22v45" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<path d="m36 52 6-6h22l-6 6m64 0 6-6h22l-6 6v39l6-6V46" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M24 72h132" stroke="var(--ill-blue)" stroke-width="4"/>'+
 '<path d="M66 63v18m7-18v18m7-18v18m7-18v18m7-18v18m7-18v18m7-18v18m7-18v18" stroke="var(--ill-blue)" stroke-width="2"/>'+
 '<circle cx="47" cy="91" r="3" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/><circle cx="133" cy="91" r="3" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 illustrationArrow(37,30,22,'orange')+illustrationArrow(135,30,151,'orange');
}
function illustrationMembrane(){
 return '<path d="M35 57v56h110V57Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<path d="M47 59v42h86V59" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M35 57h110" stroke="var(--ill-line)" stroke-dasharray="4 4" stroke-width="1.5"/>'+
 '<path d="M35 57Q90 92 145 57" stroke="var(--ill-blue)" stroke-width="4"/>'+
 '<path d="M77 101V89h26v12m-9-12V78h-8v11m4 12v17" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<path d="M90 77v-4" stroke="var(--ill-orange)" stroke-width="3"/>'+
 '<circle cx="41" cy="106" r="2" fill="var(--ill-line)" stroke="none"/><circle cx="139" cy="106" r="2" fill="var(--ill-line)" stroke="none"/>'+
 '<path d="M90 25v21m-5-5 5 5 5-5" stroke="var(--ill-orange)" stroke-width="3"/>';
}
function illustrationHeatStage(){
 return '<path d="m38 99 12-8h89l12 8v13H38Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M66 96V64l10-7h36l8 7v32Z" fill="var(--ill-panel)" stroke="var(--ill-orange)" stroke-width="2"/>'+
 '<path d="M66 64h54m-44-7v7m36-7v7" stroke="var(--ill-orange)" stroke-width="1.5"/>'+
 '<path d="M39 91V73h11v18m82 0V73h11v18" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<path d="M25 72h131" stroke="var(--ill-blue)" stroke-width="4"/>'+
 '<path d="M80 74h26" stroke="var(--ill-orange)" stroke-width="5"/>'+
 '<path d="M83 47v-9m10 9V32m10 15v-9" stroke="var(--ill-orange)" stroke-width="2"/>';
}
function illustrationShaker(){
 return '<path d="m29 103 9-7h110v17H29Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M47 96V60l8-8h69v44Z" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<path d="M47 60h69l8-8m-8 8v36" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<circle cx="82" cy="77" r="15" fill="var(--ill-ghost)" stroke="var(--ill-purple)" stroke-width="2"/><circle cx="82" cy="77" r="6" stroke="var(--ill-purple)"/>'+
 '<path d="M24 91h131" stroke="var(--ill-blue)" stroke-width="4"/><path d="M64 43v-8m18 8V27m18 16v-8" stroke="var(--ill-purple)" stroke-width="2"/>'+
 '<circle cx="39" cy="107" r="2" fill="var(--ill-line)" stroke="none"/><circle cx="140" cy="107" r="2" fill="var(--ill-line)" stroke="none"/>';
}
function illustrationBendRig(){
 return '<path d="M27 105h126v9H27Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M34 105V79h17v26m78 0V79h17v26" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<path d="M42 81Q90 12 138 81L138 88Q90 29 42 88Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M42 81Q90 15 138 81" stroke="var(--ill-blue)" stroke-width="3"/><path d="M42 87Q90 31 138 87" stroke="var(--ill-purple)" stroke-width="3"/>'+
 '<path d="M37 83h11m84 0h11" stroke="var(--ill-line)" stroke-width="2"/>';
}
function illustrationCoil(){
 return '<path d="m32 101 13-9h93l13 9v12H32Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<ellipse cx="91" cy="81" rx="55" ry="27" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<path d="M36 81v9c0 35 110 35 110 0v-9" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<ellipse cx="91" cy="77" rx="45" ry="21" stroke="var(--ill-blue)" stroke-width="3"/><ellipse cx="91" cy="77" rx="39" ry="16" stroke="var(--ill-blue)" stroke-width="2"/>'+
 '<path d="M87 69v16h8V69Z" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M62 46q30-18 58 0m-8-8 8 8-11 1" stroke="var(--ill-orange)" stroke-width="2.5"/>';
}
function illustrationSampleProbe(){
 return '<path d="M39 58v46q48 18 96 0V58" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="2"/>'+
 '<ellipse cx="87" cy="58" rx="48" ry="12" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M40 80q47 17 94 0v24q-47 18-94 0Z" fill="var(--ill-ghost)" stroke="var(--ill-teal)" stroke-width="1.5"/>'+
 '<path d="M87 26v52" stroke="var(--ill-blue)" stroke-width="5"/><path d="M80 47h14v11H80Z" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<rect x="81" y="77" width="12" height="19" rx="5" fill="var(--ill-teal)" stroke="var(--ill-teal)" stroke-width="2"/>'+
 '<path d="M70 82h-7m41 0h7m-38 17-5 5m33-5 5 5" stroke="var(--ill-teal)" stroke-width="2"/>';
}
function illustrationCurrentLoop(){
 return '<path d="M29 104h123v10H29Z" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M48 105V83h12v22m65 0V83h12v22" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
 '<path d="M87 109V32" stroke="var(--ill-orange)" stroke-width="8"/><path d="M88 47V27m-6 7 6-7 6 7" stroke="var(--ill-orange)" stroke-width="2"/>'+
 '<ellipse cx="88" cy="79" rx="54" ry="22" stroke="var(--ill-line)" stroke-width="8"/><ellipse cx="88" cy="78" rx="54" ry="22" stroke="var(--ill-blue)" stroke-width="3"/>'+
 '<path d="M88 71v21" stroke="var(--ill-orange)" stroke-width="8"/><rect x="35" y="74" width="13" height="10" rx="2" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>';
}
const FUNCTION_ILLUSTRATIONS={
 temperature:illustrationPair(illustrationHeatStage(),
  '<path d="M216 40v69h88M220 105h80" stroke="var(--ill-line)" stroke-width="1.5" stroke-dasharray="4 4"/>'+
  '<path d="M220 105h18c12 0 10-47 24-47s11 47 24 47h14" stroke="var(--ill-blue)" stroke-width="3.5"/>'+
  '<circle cx="262" cy="58" r="4" fill="var(--ill-orange)" stroke="none"/>',
  '局部热台','热点位置'),
 strain:illustrationPair(illustrationFiberClamps(),illustrationSpectrumShift(),'光栅拉长','反射峰移动'),
 vibration:illustrationPair(illustrationShaker(),
  '<path d="M216 43v66h88M217 78h86" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M218 78h84" stroke="var(--ill-line)" stroke-dasharray="5 5"/>'+
  '<path d="M218 78q10-42 20 0t20 0t20 0t20 0" stroke="var(--ill-purple)" stroke-width="3"/>'+
  '<circle cx="298" cy="78" r="3.5" fill="var(--ill-purple)" stroke="none"/>',
  '局部激振','相位波形'),
 pressure:illustrationPair(illustrationMembrane(),
  '<path d="M220 55h80m-70 48h60" stroke="var(--ill-line)" stroke-dasharray="4 4" stroke-width="1.5"/>'+
  '<path d="M220 72q40 19 80 0" stroke="var(--ill-blue)" stroke-width="4"/>'+
  '<path d="M250 110V97h20v13m-10-13V86m-5 4 5-4 5 4" fill="var(--ill-ghost)" stroke="var(--ill-orange)" stroke-width="2.5"/>',
  '膜片受压','腔长缩短'),
 geometry:illustrationPair(illustrationBendRig(),
  '<path d="M216 75h88" stroke="var(--ill-line)" stroke-width="1.5" stroke-dasharray="5 5"/>'+
  '<path d="M218 75Q260 14 302 75" stroke="var(--ill-blue)" stroke-width="3"/>'+
  '<path d="M218 75Q260 136 302 75" stroke="var(--ill-purple)" stroke-width="3"/>'+
  '<circle cx="218" cy="75" r="3" fill="var(--ill-panel)"/><circle cx="302" cy="75" r="3" fill="var(--ill-panel)"/>',
  '多芯弯曲','两侧伸缩'),
 rotation:illustrationPair(illustrationCoil(),
  '<path d="M216 78h88" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M218 78q10-32 20 0t20 0t20 0t20 0" stroke="var(--ill-blue)" stroke-width="3"/>'+
  '<path d="M218 96q10-32 20 0t20 0t20 0t20 0" stroke="var(--ill-purple)" stroke-width="3"/>'+
  '<path d="M238 41h10m-5-5v10m17-5h10" stroke="var(--ill-line)" stroke-width="1.5"/>',
  '光纤环转台','相位差反向'),
 chemical:illustrationPair(illustrationSampleProbe(),
  '<path d="M217 43v66h86" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M222 104c54 0 18-55 76-55" stroke="var(--ill-teal)" stroke-width="3"/>'+
  '<circle cx="241" cy="99" r="4" fill="var(--ill-panel)" stroke="var(--ill-teal)" stroke-width="2"/>'+
  '<circle cx="280" cy="54" r="4" fill="var(--ill-teal)" stroke="none"/>',
  '敏感尖端','酸碱响应'),
 electromagnetic:illustrationPair(illustrationCurrentLoop(),
  '<circle cx="260" cy="77" r="31" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="2"/>'+
  '<path d="M230 77h60m-30-30v60" stroke="var(--ill-line)" stroke-width="1" stroke-dasharray="3 5"/>'+
  '<path d="M239 95l42-36" stroke="var(--ill-orange)" stroke-width="3.5"/>'+
  '<path d="M239 59l42 36" stroke="var(--ill-blue)" stroke-width="2" stroke-dasharray="4 4"/>',
  '电流反向','偏振反转')
};
function functionIllustration(id) {
 return cardIllustration(FUNCTION_ILLUSTRATIONS[id]||FUNCTION_ILLUSTRATIONS.strain);
}
const METHOD_ILLUSTRATIONS={
 grating:illustrationPair(
  '<path d="M24 63h126" stroke="var(--ill-ghost)" stroke-width="15"/>'+
  '<path d="M24 63h126" stroke="var(--ill-blue)" stroke-width="3"/>'+
  '<path d="M84 51v24m8-24v24m8-24v24m8-24v24m8-24v24m8-24v24" stroke="var(--ill-blue)" stroke-width="2.5"/>'+
  illustrationArrow(26,38,66,'blue')+
  '<path d="M91 80 72 104H27m7-5-7 5 7 5" stroke="var(--ill-orange)" stroke-width="3"/>',
  illustrationSpectrumShift(),'周期结构','选择性反射'),
 rayleigh:illustrationPair(illustrationShaker()+
  '<circle cx="34" cy="91" r="3" fill="var(--ill-purple)" stroke="none"/><circle cx="137" cy="91" r="3" fill="var(--ill-purple)" stroke="none"/>',
  '<path d="M216 44v66h88" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M220 72l10-7 10 13 10-9 10 14 10-19 10 11 10-6 10 5" stroke="var(--ill-line)" stroke-dasharray="4 4" stroke-width="2"/>'+
  '<path d="M220 72l10-7 10 13 10-9 10 26 10-44 10 24 10-6 10 5" stroke="var(--ill-purple)" stroke-width="3"/>'+
  '<path d="M259 104h20" stroke="var(--ill-purple)" stroke-width="4"/>',
  '局部扰动','回波差异'),
 raman:illustrationPair(
  '<path d="M27 40h124" stroke="var(--ill-ghost)" stroke-width="13"/>'+
  illustrationArrow(27,40,119,'blue')+
  '<circle cx="134" cy="40" r="5" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M130 47 109 75H38m7-5-7 5 7 5" stroke="var(--ill-orange)" stroke-width="3"/>'+
  '<path d="M140 47 155 104H38m7-5-7 5 7 5" stroke="var(--ill-purple)" stroke-width="3"/>'+
  '<rect x="25" y="68" width="12" height="14" rx="2" fill="var(--ill-ghost)" stroke="var(--ill-orange)" stroke-width="1.5"/>'+
  '<rect x="25" y="97" width="12" height="14" rx="2" fill="var(--ill-ghost)" stroke="var(--ill-purple)" stroke-width="1.5"/>',
  '<path d="M216 109h88" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<rect x="225" y="57" width="25" height="51" rx="3" fill="var(--ill-orange)" stroke="none"/>'+
  '<rect x="271" y="72" width="25" height="36" rx="3" fill="var(--ill-purple)" stroke="none"/>'+
  '<path d="M271 83h25" stroke="var(--ill-panel)" stroke-width="2" stroke-dasharray="3 3"/>',
  '两路回波','强度比变化'),
 brillouin:illustrationPair(illustrationHeatStage(),
  '<path d="M216 40v69h88" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M220 105c17 0 11-47 24-47s7 47 24 47" stroke="var(--ill-line)" stroke-dasharray="5 5"/>'+
  '<path d="M248 105c17 0 11-47 24-47s7 47 24 47" stroke="var(--ill-orange)" stroke-width="3"/>'+
  illustrationArrow(245,40,277,'orange'),
  '固定伸缩升温','频率谱移动'),
 interference:illustrationPair(illustrationMembrane(),
  '<path d="M216 78h88" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M218 78q10-36 20 0t20 0t20 0t20 0" stroke="var(--ill-blue)" stroke-width="3"/>'+
  '<path d="M218 95q10-36 20 0t20 0t20 0t20 0" stroke="var(--ill-purple)" stroke-width="3"/>'+
  '<circle cx="242" cy="104" r="4" fill="var(--ill-ghost)" stroke="none"/>',
  '两面反射','相位关系'),
 'chemical-optics':illustrationPair(illustrationSampleProbe(),
  '<rect x="216" y="41" width="38" height="70" rx="5" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<rect x="270" y="41" width="34" height="70" rx="5" fill="var(--ill-ghost)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<circle cx="235" cy="76" r="6" fill="var(--ill-teal)" opacity=".25" stroke="none"/><circle cx="287" cy="76" r="11" fill="var(--ill-teal)" stroke="none"/>'+
  '<path d="M287 54v6m0 32v6m-22-22h6m32 0h6" stroke="var(--ill-teal)" stroke-width="2"/>',
  '样品接触材料','荧光读出'),
 polarization:illustrationPair(illustrationCurrentLoop(),
  '<ellipse cx="260" cy="77" rx="30" ry="36" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.5"/>'+
  '<path d="M260 47v60" stroke="var(--ill-line)" stroke-dasharray="4 4" stroke-width="1.5"/>'+
  '<path d="M241 100l38-46" stroke="var(--ill-orange)" stroke-width="3.5"/>'+
  '<path d="M241 54l38 46" stroke="var(--ill-blue)" stroke-width="2.5"/>'+
  '<circle cx="260" cy="77" r="3" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1"/>',
  '磁光敏感环','偏振方向')
};
function methodIllustration(id) {
 return cardIllustration(METHOD_ILLUSTRATIONS[id]||METHOD_ILLUSTRATIONS.grating);
}
