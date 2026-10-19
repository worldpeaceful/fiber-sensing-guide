'use strict';
// Static, independent Anatomy renderers: share geometry and LabMath with the lab,
// but never touch its scene, parameters, storage, or animation loop.
(function(root){
 let generation=0,renderers=[],serial=0;
 const SPECS={
  fbg:{before:0,after:70,labels:['未伸缩','拉长后'],values:['0%','+70%'],notes:['夹具之间的纤芯含有规则的折射率周期。','移动夹具向外，光纤变长，纤芯周期变大。'],plot:'参考与拉长后的反射光谱',legend:'虚线：未伸缩参考；实线：拉长后的反射峰。',conclusion:'光栅被拉长，反射峰向较长波长移动。这里显示归一化峰偏移，不指定nm或微应变。'},
  pressure:{before:0,after:70,labels:['未受压','受压后'],values:['相对压力 0%','相对压力 70%'],notes:['膜片与固定光纤端面之间留有光学腔。','膜片向端面下凹，腔长缩短；端面保持不动。'],plot:'相对压力与膜片形变',legend:'空心点：未受压参考；实心点：受压后的形变。',conclusion:'相对压力从0%变为70%，归一化形变从0变为0.70。腔体剖切与膜片形变均放大，不代表真实压力或长度。'},
  dts:{before:20,after:80,labels:['与背景同温','局部升温后'],values:['20 °C','80 °C'],notes:['光纤与热台均为20°C，温度曲线平直。','热台仍在同一位置，局部热点与回波比例一起改变。'],plot:'同一位置的回波与温度对照',legend:'橙色：Stokes；紫色：anti-Stokes。虚线：20°C参考。',conclusion:'两路回波的比例提供温度线索，还要结合定位、损耗校正与校准，才能得到沿线温度。'},
  das:{before:0,after:70,labels:['零扰动参考','存在周期扰动'],values:['扰动 0%','扰动 70%'],notes:['读出仪指针位于零位，相位波形为零线。','在同一观察时刻，指针与曲线末端指向同一个瞬时相位。'],plot:'同一时刻的相位波形',legend:'虚线：零扰动；蓝线：扰动后。实心点对应仪表指针。',conclusion:'扰动让相位随时间变化。相位读数不直接等于声压、速度或加速度，需要机械耦合与系统标定。'},
  shape:{before:-70,after:70,labels:['向下弯曲','向上弯曲'],values:['弯曲 −70%','弯曲 +70%'],notes:['柔性试件向下弯，两侧纤芯相对伸缩方向相反。','弯曲方向反过来，两侧纤芯的拉伸与压缩也互换。'],plot:'两侧纤芯的伸缩对照',legend:'蓝色：纤芯A；紫色：纤芯B。虚线：向下弯曲参考。',conclusion:'两侧纤芯的应变差提供曲率线索。这里放大平面弯曲和芯间距；完整三维形状还需要方向、参考姿态与重建算法。'},
  fog:{before:-70,after:70,labels:['反向转动','正向转动'],values:['转动 −70%','转动 +70%'],notes:['光纤环与转台同轴，两束光沿同一个环反向传播。','转动方向反过来，两路光的相对相位差改变符号。'],plot:'两路光的相位与转动方向',legend:'蓝色/紫色：反向传播的两路光。空心点：反转；实心点：正转。',conclusion:'转动改变两路光的相位关系；静态图保留环路和方向标记。波形为放大示意，转动参数表示角速度方向，不是转角。'},
  chemical:{before:5,after:9,labels:['酸性样品','碱性样品'],values:['pH 5','pH 9'],notes:['探头尖端的敏感材料浸入样品，理想荧光响应较弱。','样品改变材料状态，敏感尖端的理想荧光响应增强。'],plot:'同一敏感材料的酸碱响应',legend:'曲线：理想探针的相对荧光；空心点：pH 5；实心点：pH 9。',conclusion:'这里取 pKa=7，只演示一种理想荧光探针。不同材料可能反向响应，也可能读取吸收、寿命或共振，实际测量需要选择性与校准。'},
  current:{before:-70,after:70,labels:['反向电流','正向电流'],values:['电流 −70%','电流 +70%'],notes:['导体穿过环形敏感光路，磁光作用让偏振方向偏转。','电流反向，偏振读出转到零位的另一侧。'],plot:'电流方向与偏振响应',legend:'虚线：零电流方向；空心点：反向电流；实心点：正向电流。',conclusion:'采用示意比例展示电流与偏振旋转的对应，不代表真实器件的灵敏度。电场或电压测量可使用专用电光晶体，不能直接套用此电流装置。'},
  dvs:{before:0,after:70,labels:['无局部扰动','同处施加扰动'],values:['扰动 0%','扰动 70%'],notes:['回波本来就有沿线纹理；记录同一时刻的参考。','激振器仍在600 m处，局部回波与参考产生差异。'],plot:'瑞利强度读出的局部变化示例',legend:'上图虚线：无扰动参考；实线：当前回波。下图：逐点差异的绝对值。',conclusion:'这里用强度比较展示一种瑞利读出方式。差异峰提供扰动位置线索；相位读出与散射指纹比较使用不同架构，差异幅值不直接等于振动量。'},
  brillouin:{mode:'dts',before:20,after:80,labels:['参考温度','同一位置升温'],values:['20 °C','80 °C'],notes:['固定伸缩条件，热台与背景同为20°C。','热台位置不变，升温改变局部布里渊频移。'],plot:'布里渊频率谱 · 定性对照',legend:'虚线：参考谱；橙线：升温后的谱。横轴是相对频率，不是波长。',conclusion:'以常见石英光纤的升温响应作例子。谱峰位置同时受温度与应变影响，单个频移不能将两者分开；此谱只示意方向，不给MHz或温度灵敏度。'},
  interference:{mode:'pressure',before:0,after:70,labels:['参考腔长','膜片下凹后'],values:['相对压力 0%','相对压力 70%'],notes:['固定端面与膜片构成两处反射面，两束反射光会重新叠加。','膜片下凹使腔长缩短，两束反射光的相位关系随之改变。'],plot:'两束反射光的相位关系 · 示意',legend:'蓝色：端面反射光；紫色：膜片反射光。虚线：参考相位；实线：变化后的相位。',conclusion:'两束反射光叠加形成干涉，响应随相位周期变化，不能简单理解为越受压就越亮。波形仅示意相位关系，未将压力标定为相位；腔长、形变均放大。'}
 };
 function clear(){generation++;for(const renderer of renderers)renderer.clear();renderers=[];}
 function readings(topic){
  const spec=SPECS[topic];
  const mode=spec.mode||topic;
  return [spec.before,spec.after].map(v=>({fbg:()=>LabMath.normalized(v),pressure:()=>LabMath.normalized(v),dts:()=>LabMath.ramanRatio(v),das:()=>LabMath.phase(v,1.2),shape:()=>LabMath.normalized(v),fog:()=>LabMath.phaseLimit(v),chemical:()=>LabMath.fluorescence(v),current:()=>LabMath.rotation(v),dvs:()=>v===0?0:600}[mode]()));
 }
 // The two method-only plots are qualitative, not new laboratory models.
 // Brillouin: thermal/strain cross-sensitivity, https://eprints.soton.ac.uk/21002/
 // Two reflected waves: https://ira.lib.polyu.edu.hk/bitstream/10397/5657/1/Liao_Fabry-Perot_Interferometer_Cavity.pdf
 function methodPlot(topic){
  const curve=fn=>Array.from({length:201},(_,i)=>{const x=i/200;return(i?'L':'M')+(35+x*290).toFixed(3)+' '+fn(x).toFixed(3);}).join('');
  const line=(fn,color,dashed=false)=>`<path d="${curve(fn)}" fill="none" stroke="var(--ill-${color})" stroke-width="2.5"${dashed?' stroke-dasharray="6 5"':''}/>`;
  if(topic==='brillouin')return `<g class="anatomy-plot"><path class="anatomy-grid" d="M35 30V139H325"/>${line(x=>134-85/(1+((x-.32)/.065)**2),'line',true)}${line(x=>134-85/(1+((x-.65)/.065)**2),'orange')}<text x="35" y="19" class="anatomy-axis">归一化谱强度</text><text x="35" y="166" class="anatomy-axis">低频</text><text x="325" y="166" text-anchor="end" class="anatomy-axis">高频</text></g>`;
  return `<g class="anatomy-plot"><path class="anatomy-grid" d="M35 90H325"/>${line(x=>90-32*Math.sin(x*Math.PI*4),'blue')}${line(x=>90-32*Math.sin(x*Math.PI*4),'line',true)}${line(x=>90-32*Math.sin(x*Math.PI*4-.7*Math.PI),'purple')}<text x="35" y="22" class="anatomy-axis">反射光相位 · 放大示意</text><text x="35" y="166" class="anatomy-axis">光波相位</text><text x="325" y="166" text-anchor="end" class="anatomy-axis">示意区间</text></g>`;
 }
 function turnDirection(host,renderer,geometry,value){
  const c=geometry.coil,sign=Math.sign(value),points=Array.from({length:25},(_,i)=>{const a=sign*(-.8+i/24*1.6);return renderer.project([c.cx+19*Math.cos(a),c.cy+19*Math.sin(a),c.hubZ+.2],geometry.P);});
  const end=points[24],previous=points[23],dx=end[0]-previous[0],dy=end[1]-previous[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
  const path=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join('')+`M${end[0]-ux*5-uy*3} ${end[1]-uy*5+ux*3}L${end.join(' ')}L${end[0]-ux*5+uy*3} ${end[1]-uy*5-ux*3}`;
  host.querySelector('[data-seven-turn]').setAttribute('d',path);
 }
 function readingText(topic,values){
  const pair=digits=>values.map(v=>v.toFixed(digits)).join(' → ');
  return {fbg:()=>`反射峰相对偏移：${pair(2)}`,pressure:()=>`归一化形变：${pair(2)}`,dts:()=>`AS/S相对比值：${pair(2)}（20°C归一化为1）；两路作教学归一化，不表示实际绝对光强。`,das:()=>`瞬时相位差：${pair(3)} rad；时刻 t=1.2 s。扰动幅度与瞬时读数不同。`,shape:()=>`中点纤芯A相对应变：${pair(2)}；纤芯B符号相反。`,fog:()=>`示意相位差：${pair(2)} rad`,chemical:()=>`相对荧光：${pair(3)}（0–1，pKa=7）`,current:()=>`偏振相对旋转：${pair(1)}°（示意比例）`,dvs:()=>`扰动位置：600 m；当前与参考使用相同的 t=1.2 s。`,brillouin:()=>`谱峰位置：参考 → 向高频移动（定性示意，无频率标定）`,interference:()=>`腔长缩短 → 相位关系改变；图中相移仅作示意，不给出压力到相位的换算。`}[topic]();
 }
 function gratingInset(strength){
  const travel=11*(LabMath.normalized(strength)+1),spacing=7*(1+travel/128)/(1+11/128);
  return `<div class="mechanism-inset"><span>纤芯折射率周期 · 放大示意</span><svg viewBox="0 0 280 46" role="img" aria-label="${strength===0?'未伸缩的光栅周期':'拉长后更疏的光栅周期'}" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="13" width="256" height="20" rx="10" fill="var(--ill-panel)" stroke="var(--ill-line)" stroke-width="1.2"/><path d="M20 23h240" stroke="var(--ill-ghost)" stroke-width="12"/>${Array.from({length:17},(_,i)=>`<path d="M${(140+(i-8)*spacing).toFixed(3)} 17v12" stroke="var(--ill-blue)" stroke-width="2.2"/>`).join('')}</svg></div>`;
 }
 function uniqueIDs(host,prefix){
  const ids=new Map();for(const el of host.querySelectorAll('[id]')){const id=el.id;ids.set(id,prefix+id);el.setAttribute('id',prefix+id);}
  for(const el of host.querySelectorAll('*'))for(const name of ['clip-path','fill','stroke','filter','mask','href','aria-labelledby','aria-describedby']){
   const value=el.getAttribute(name);if(!value)continue;
   let next=value;for(const [old,id]of ids)next=next.replaceAll('url(#'+old+')','url(#'+id+')').replace(new RegExp('^#'+old+'$'),'#'+id);
   if(next!==value)el.setAttribute(name,next);
  }
 }
 async function dependencies(){
  await Promise.all([loadDetailAsset('anatomy/iso.css?v=1',true),loadDetailAsset('anatomy/lab.css?v=2',true)]);
  if(typeof LabMath==='undefined')await loadDetailAsset('lab-models.js?v=13');
  if(typeof path!=='function')await loadDetailAsset('experiments.js?v=13');
  if(!root.LabAnatomySceneFiles)await loadDetailAsset('anatomy/lab-scenes.js?v=2');
  if(!root.LabSceneLoader)await loadDetailAsset('anatomy/scene-loader.js?v=1');
  if(!root.LabAnatomySeven)await loadDetailAsset('anatomy/seven-runtime.js?v=1');
  if(!root.LabAnatomy?.createRenderer)await loadDetailAsset('anatomy/lab-runtime.js?v=2');
 }
 async function mount(slot,retry=false){
  clear();const ticket=generation,topic=slot.dataset.mechanismDetail,spec=SPECS[topic];
  if(!spec)return;
  const mode=spec.mode||topic;
  const status=slot.querySelector('[data-mechanism-status]'),retryButton=slot.querySelector('[data-mechanism-retry]');
  const restoreFocus=document.activeElement===retryButton;
  retryButton.hidden=true;status.textContent='正在准备装置的前后对照…';
  const live=()=>ticket===generation&&slot.isConnected&&slot.closest('dialog')?.open;
  try{
   await dependencies();if(!live())return;
   const geometry=await root.LabSceneLoader.load(mode,{retry});if(!live())return;
   if(!geometry)throw new Error('Figure geometry unavailable');
   const content=slot.querySelector('[data-mechanism-content]'),values=readings(topic);
   content.innerHTML=`<div class="mechanism-state-switch" role="group" aria-label="切换装置状态">${spec.labels.map((label,i)=>`<button type="button" data-compare-state="${i}" aria-pressed="${i===1}">${label}</button>`).join('')}</div><div class="mechanism-frames" data-selected-state="1">${spec.labels.map((label,i)=>`<figure class="mechanism-state" data-apparatus-stage><figcaption><strong>${label}</strong><span>${spec.values[i]}</span></figcaption><div class="mechanism-model lab-apparatus iso" data-mechanism-state="${i}"></div><p class="mechanism-note">${spec.notes[i]}</p></figure>`).join('')}</div><section class="mechanism-response"><h4>${spec.plot}</h4><p class="mechanism-legend">${spec.legend}</p><svg class="mechanism-plot" role="img" aria-label="${spec.plot}"><g></g></svg><svg class="mechanism-hidden-plot" hidden aria-hidden="true"><g></g></svg><p class="mechanism-reading" data-mechanism-reading></p></section><p class="mechanism-conclusion">${spec.conclusion}</p>`;
   const hosts=[...content.querySelectorAll('[data-mechanism-state]')],plot=content.querySelector('.mechanism-plot'),hiddenPlot=content.querySelector('.mechanism-hidden-plot');
   for(let i=0;i<2;i++){
    const renderer=root.LabAnatomy.createRenderer();renderers.push(renderer);
    const svg=i?plot:hiddenPlot;
    renderer.render({mode,position:600,strength:i?spec.after:spec.before,time:1.2,reference:i?{position:600,strength:spec.before}:null,width:360,host:hosts[i],svg,scene:svg.querySelector('g'),paused:true,still:true});
    const focus={fbg:[[-80,105],[-32,15],[12,51]],pressure:[[-18,98],[-28,35],[20,80]],dts:[[10,110],[-30,31],[9,38]],das:[[18,102],[-30,28],[15,82]],shape:[[-30,125],[-22,38],[12,48]],fog:[[-12,99],[-51,51],[14,38]],chemical:[[24,116],[-26,27],[12,80]],current:[[6,130],[-42,42],[12,72]],dvs:[[10,110],[-30,31],[9,38]]};
    const ranges=topic==='brillouin'?[[20,95],[-12,26],[15,35]]:focus[mode];
    if(ranges){
     const points=ranges[0].flatMap(x=>ranges[1].flatMap(y=>ranges[2].map(z=>renderer.project([x,y,z],geometry.P))));
     const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
     hosts[i].querySelector('svg').setAttribute('viewBox',[Math.min(...xs)-6,Math.min(...ys)-6,Math.max(...xs)-Math.min(...xs)+12,Math.max(...ys)-Math.min(...ys)+12].join(' '));
    }
    uniqueIDs(hosts[i],'detail-'+(++serial)+'-');
    hosts[i].querySelector('svg').setAttribute('aria-label',spec.labels[i]+'：'+spec.notes[i]);
    if(mode==='fog')turnDirection(hosts[i],renderer,geometry,i?spec.after:spec.before);
    if(topic==='fbg')hosts[i].parentElement.querySelector('.mechanism-note').insertAdjacentHTML('beforebegin',gratingInset(i?spec.after:spec.before));
   }
   // Explain the teaching comparison in its own words; no record controls here.
   for(const el of plot.querySelectorAll('[data-plot-note],[data-seven-plot-note]'))el.textContent='';
   if(topic==='fbg'||topic==='pressure')plot.querySelector('.anatomy-plot-title').textContent=topic==='fbg'?'反射光谱':'归一化形变';
   if(spec.mode){plot.setAttribute('viewBox','0 0 360 190');plot.innerHTML=methodPlot(topic);}
   content.querySelector('[data-mechanism-reading]').textContent=readingText(topic,values);
   content.querySelector('.mechanism-state-switch').onclick=event=>{const button=event.target.closest('[data-compare-state]');if(!button)return;content.querySelector('.mechanism-frames').dataset.selectedState=button.dataset.compareState;content.querySelectorAll('[data-compare-state]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
   slot.dataset.ready='true';status.textContent='装置对照已就绪。';
   if(restoreFocus&&(document.activeElement===document.body||document.activeElement===retryButton))slot.querySelector('.mechanism-title').focus({preventScroll:true});
  }catch{
   if(!live())return;
   status.textContent='装置对照图暂时未载入，仍可查看简图与三步解释。';retryButton.hidden=false;retryButton.onclick=()=>mount(slot,true);
  }
 }
 root.DetailMechanisms=Object.freeze({mount,clear,readings,specs:SPECS});
})(window);
