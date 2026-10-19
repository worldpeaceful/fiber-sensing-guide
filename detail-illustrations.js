'use strict';
// 所有详情按需显示独立的实体对照；方法图明确各自的读出量。
const DETAIL_MECHANISM_TOPICS={function:{temperature:'dts',strain:'fbg',pressure:'pressure',vibration:'das',geometry:'shape',rotation:'fog',chemical:'chemical',electromagnetic:'current'},method:{grating:'fbg',raman:'dts',rayleigh:'dvs',brillouin:'brillouin',interference:'interference','chemical-optics':'chemical',polarization:'current'}};
const DETAIL_MECHANISM_HEADINGS={
 fbg:['夹具拉开后，哪里发生了变化？','对照夹具、光栅条纹和反射峰。温度保持不变。'],
 pressure:['从膜片到光学腔，看受压前后','固定光纤端面，比较膜片下凹后留出的光学间隙。'],
 dts:['同一位置升温，两路回波怎样变化？','热台位置不变，对照局部温度与两路回波的相对比例。'],
 das:['振动怎样留下相位波形？','用相位读出仪作例子：比较同一时刻的零扰动与有扰动状态。'],
 shape:['弯曲方向反过来，两侧纤芯怎样伸缩？','对照同一夹具的向下与向上弯曲，观察两侧纤芯的相对应变。'],
 fog:['转动方向反过来，相位差也反过来','同一光纤环内两束光反向传播；下方示意相位关系与正负响应。'],
 chemical:['同一个探头，换一种酸碱环境','敏感尖端接触样品，比较 pH 5 与 pH 9 的理想荧光响应。'],
 current:['电流反向，偏振方向怎样改变？','以磁光电流传感为例，比较导体、环形敏感光路和偏振读出。'],
 dvs:['怎样从瑞利回波里找到局部扰动？','选择强度比较的一种读出示例；在同一时刻对照参考与扰动后的回波。'],
 brillouin:['加热同一段光纤，比较布里渊频率谱','热台仅展示受控温度的试件；频率谱为定性示意，伸缩保持不变。'],
 interference:['腔长变化，为什么会影响干涉？','以膜片光学腔为例：两处反射面产生的光重新相遇，比较其相位关系。']
};
const detailAssetJobs=new Map();
function loadDetailAsset(src,style=false){
 if(style&&[...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>link.getAttribute('href')===src&&link.sheet))return Promise.resolve();
 if(detailAssetJobs.has(src))return detailAssetJobs.get(src);
 const job=new Promise((resolve,reject)=>{
  const element=document.createElement(style?'link':'script');
  if(style){element.rel='stylesheet';element.href=src;}else{element.src=src;element.async=true;}
  const timer=setTimeout(()=>done(false),20000);let settled=false;
  function done(ok){if(settled)return;settled=true;clearTimeout(timer);element.onload=element.onerror=null;if(ok)resolve();else{element.remove();detailAssetJobs.delete(src);reject(new Error('Detail illustration asset unavailable'));}}
  element.onload=()=>done(true);element.onerror=()=>done(false);document.head.appendChild(element);
 });detailAssetJobs.set(src,job);return job;
}
function mountDetailIllustration(content){
 const slot=content.querySelector('[data-mechanism-detail]');
 if(!slot||typeof SVGSVGElement==='undefined')return;
 const begin=()=>loadDetailAsset('detail-mechanisms.js?v=4').then(()=>{if(slot.isConnected&&slot.closest('dialog')?.open)window.DetailMechanisms.mount(slot);}).catch(()=>{
  if(!slot.isConnected||!slot.closest('dialog')?.open)return;
  slot.querySelector('[data-mechanism-status]').textContent='装置对照图暂时未载入，仍可查看简图与三步解释。';
  const retry=slot.querySelector('[data-mechanism-retry]');retry.hidden=false;retry.onclick=begin;
 });begin();
}
const DETAIL_ILLUSTRATION_CAPTIONS={
 function:{
  temperature:'图中以沿线测温为例：热点对应温度曲线的局部升高。其他方案也可用光栅等读取指定测点。',
  strain:'图中以光栅测伸缩为例：伸缩引起光谱移动。读取这一变化，再结合标定与温度补偿，才能得到相对应变。',
  vibration:'图中表示局部扰动与随时间变化的波形。振动通过耦合变成光学变化；波形不直接等于声压或加速度。',
  pressure:'图中以膜片与干涉腔为例：先受压形变，再读取光程变化。光栅等方案也可用于测量，载荷读数还需要结构标定。',
  geometry:'图中以多芯光纤的平面弯曲为例：比较两侧纤芯的伸缩。完整三维形状还需要方向、参考姿态与重建算法。',
  rotation:'图中两束光沿同一光纤环反向传播，转动留下相位差。示意只表达转动线索，不表示光速被改变。',
  chemical:'图中以 pH 敏感探头为例：样品先改变材料的光学响应，再由光纤送光或收光。检测对象取决于材料设计。',
  electromagnetic:'图中以围绕导体的电流传感为例：磁场引起偏振响应。电场或电压测量还可使用专门的电光晶体。'
 },
 method:{
  grating:'图中展示光栅反射与反射峰移动：仪器读取的是波长，再结合补偿与标定换成温度或应变等被测量。',
  rayleigh:'图中展示沿途微弱的瑞利回波。回波强度、相位或局部散射指纹的比较方式，取决于具体的测量架构。',
  raman:'橙色与紫色分别表示 Stokes 与 anti-Stokes 两路拉曼回波。比较强度关系，并校正损耗、定位与校准后，才得到温度。',
  brillouin:'图中展示布里渊谱峰在频率轴上的移动。一个频移通常同时受温度与应变影响，需要补偿或额外独立信息。',
  interference:'图中以膜片光学腔的两处反射面为例：腔长变化改变两束反射光的相位关系与干涉响应。双光路干涉与光纤陀螺使用不同结构。',
  'chemical-optics':'图中以敏感材料的发光响应为例。吸收与表面共振也可用于检测，具体光学读数取决于探头与材料。',
  polarization:'图中用偏振方向的改变作示意。磁光与电光测量需要各自的敏感材料、光路与标定；电光方案还可读取相位关系的变化。'
 }
};
function renderDetailIllustration(kind,record){
 const isMethod=kind==='method';
 const base=isMethod?methodIllustration(record.id):functionIllustration(record.id);
 const topic=DETAIL_MECHANISM_TOPICS[kind]?.[record.id],heading=DETAIL_MECHANISM_HEADINGS[topic];
 const illustration=topic?`<div class="mechanism-detail" data-mechanism-detail="${topic}"><h3 class="mechanism-title" tabindex="-1">${heading[0]}</h3><p class="mechanism-intro">${heading[1]}</p><div data-mechanism-content>${base}</div><div class="mechanism-status" role="status"><span data-mechanism-status>简图已就绪，装置对照图按需载入。</span><button type="button" data-mechanism-retry hidden>重新加载对照图</button></div></div>`:base;
 const caption=DETAIL_ILLUSTRATION_CAPTIONS[kind]?.[record.id]||'具体光路、敏感结构与读出方式随技术方案而变化。';
 return `<figure class="function-diagram detail-illustration${isMethod?' method-diagram':''}" role="group" aria-label="${esc(record.title+'原理示意与测量过程')}" data-illustration-kind="${isMethod?'method':'function'}" data-illustration-id="${esc(record.id)}">${illustration}<ol class="detail-process" aria-label="测量过程">${record.diagram.map((label,i)=>`<li><span class="detail-step-number" aria-hidden="true">${i+1}</span><span class="detail-step-copy">${esc(label)}</span></li>`).join('')}</ol><figcaption>原理示意 · ${esc(caption)}</figcaption></figure>`;
}
