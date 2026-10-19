'use strict';
(function(root){
 root.LabAnatomySeven=function({project,path,worldPath,set}){
  const modes=['dts','dvs','das','shape','fog','chemical','current'];
  const titles={dts:'04 · 拉曼测温台',dvs:'05 · 局部激振台',das:'06 · 相位读出仪',shape:'07 · 多芯弯曲夹具',fog:'08 · 光纤环转台',chemical:'09 · 荧光探头样品台',current:'10 · 电流偏振台'};
  function sample(mode,p,v,time){
   const a=LabMath.normalized(v),travel=['dts','dvs'].includes(mode)?(p-50)/900*160.2:0;
   return {value:{dts:()=>LabMath.ramanRatio(v),dvs:()=>v===0?0:p,das:()=>LabMath.phase(v,time),shape:()=>a,fog:()=>LabMath.phaseLimit(v),chemical:()=>LabMath.fluorescence(v),current:()=>LabMath.rotation(v)}[mode](),a,travel};
  }
  function decorate(active,opts){
   const host=active.host,svg=host.querySelector('svg');
   const marks={dts:'<path data-seven-thermal class="seven-thermal-mark"/>',dvs:'',das:'<path data-seven-dial-ref class="apparatus-reference"/><path data-seven-needle class="seven-needle"/><circle data-seven-pivot class="seven-pivot" r="1.5"/>',shape:'',fog:'<circle data-seven-cw class="apparatus-pulse" r="3.5"/><circle data-seven-ccw class="apparatus-pulse" data-returning="true" r="3.5"/><path data-seven-turn class="seven-turn"/>',chemical:'<path data-seven-fluorescence class="seven-fluorescence"/>',current:'<path data-seven-dial-ref class="apparatus-reference"/><path data-seven-needle class="seven-needle"/><path data-seven-current class="seven-current-arrow"/>'};
   svg.insertAdjacentHTML('beforeend','<g data-seven-overlay>'+marks[opts.mode]+'</g>');
   if(opts.mode==='shape')host.querySelector('[data-bend-strip]').insertAdjacentHTML('beforeend','<path data-seven-core-a class="iso-line seven-core-a"/><path data-seven-core-b class="iso-line seven-core-b"/>');
   if(opts.mode==='dvs')host.querySelector('[data-bench-part="cursor.piezo-window"]').insertAdjacentHTML('beforeend','<path data-seven-excitation class="seven-excitation"/>');
   active.seven={};for(const [name,selector]of Object.entries({thermal:'[data-seven-thermal]',excitation:'[data-seven-excitation]',needle:'[data-seven-needle]',dialRef:'[data-seven-dial-ref]',pivot:'[data-seven-pivot]',coreA:'[data-seven-core-a]',coreB:'[data-seven-core-b]',cw:'[data-seven-cw]',ccw:'[data-seven-ccw]',turn:'[data-seven-turn]',glow:'[data-seven-fluorescence]',currentArrow:'[data-seven-current]'}))active.seven[name]=host.querySelector(selector);
   active.seven.heatFace=host.querySelector('[data-bench-part="cursor.heater-face"] .iso-top');
   active.seven.tip=host.querySelector('[data-bench-part="probe.sensitive-tip"] .iso-top');
   active.seven.bendTop=host.querySelector('[data-bend-top]');active.seven.bendOutline=host.querySelector('[data-bend-outline]');active.seven.bendFront=host.querySelector('[data-bend-front]');
  }
  function updateRig(o,s,b){
   const P=b.config.P,r=b.seven,a=s.a,v=o.strength,t=o.time;
   if(s.travel!==undefined){const p=project([s.travel,0,0],P),z=project([0,0,0],P);for(const el of b.moves)set(el,'transform',`translate(${p[0]-z[0]} ${p[1]-z[1]})`);}
   if(o.mode==='dts'){
    const ratio=Math.max(0,Math.min(1,v/120)),color=[134,173,224].map((c,i)=>Math.round(c+([232,154,89][i]-c)*ratio));
    set(r.heatFace,'style',`fill:rgb(${color.join(',')})`);
    const x=-45.1+s.travel;set(r.thermal,'d',worldPath([[x-6,3,24],[x-3,3,26],[x,3,24],[x+3,3,26],[x+6,3,24]],P));
    b.caption.textContent=`观察 ${o.position} m · 局部 ${v} °C，背景20 °C。热台与光纤直径放大；比较两路回波相对比例，不代表绝对光强。`;
   }else if(o.mode==='dvs'){
    const amp=v===0?0:1.3*a,phase=o.still?0:t*3;
    set(r.excitation,'d',v===0?'':worldPath(Array.from({length:33},(_,i)=>{const x=-48+i*6/32;return[x,5+amp*Math.sin(i/32*Math.PI*4-phase),28.5];}),P));
    b.caption.textContent=v===0?'无扰动：激振标记停止。当前与参考回波的逐点差异见下图；游标只是观察位置。':`${o.position} m · 扰动 ${v}%。壳体上的动态图示表示激振强度，回波变化由原光强模型计算；不等同于声压或加速度。`;
   }else if(o.mode==='das'||o.mode==='current'){
    const d=b.config.dial,angle=o.mode==='das'?s.value: s.value*Math.PI/180;
    set(r.dialRef,'d',worldPath([[d.cx-d.r,d.cy,d.cz],[d.cx+d.r,d.cy,d.cz]],P));
    const ends=o.mode==='das'?[[d.cx,d.cy,d.cz],[d.cx+d.r*Math.cos(angle),d.cy,d.cz+d.r*Math.sin(angle)]]:[[d.cx-d.r*Math.cos(angle),d.cy,d.cz-d.r*Math.sin(angle)],[d.cx+d.r*Math.cos(angle),d.cy,d.cz+d.r*Math.sin(angle)]];
    set(r.needle,'d',worldPath(ends,P));
    if(r.pivot){const c=project([d.cx,d.cy,d.cz],P);set(r.pivot,'cx',c[0]);set(r.pivot,'cy',c[1]);}
    if(o.mode==='das')b.caption.textContent=`观察 ${o.position} m · 瞬时相位差 ${s.value.toFixed(2)} rad。指针与波形最右端对应同一时刻，摆幅为 ±${LabMath.phaseLimit(v).toFixed(2)} rad；这是动态应变原理示意。`;
    else{
     const c=b.config.conductor,positive=v>0,z0=positive?c.z0:c.z1,z1=positive?c.z1:c.z0;
     set(r.currentArrow,'d',v===0?'':worldPath([[c.x,c.y,z0],[c.x,c.y,z1],[c.x-3,c.y,z1+(positive?-5:5)],[c.x,c.y,z1],[c.x+3,c.y,z1+(positive?-5:5)]],P));
     b.caption.textContent=`${v===0?'零电流参考':v>0?'正向电流':'反向电流'} · 偏振相对旋转 ${s.value.toFixed(1)}°。导体穿过专用磁光光路；线圈与导体直径放大，不指定实际安培值。`;
    }
   }else if(o.mode==='shape'){
    const top=Array.from({length:65},(_,i)=>[-5+i*100/64,36+a*10*Math.sin(Math.PI*i/64)]);
    const td=worldPath([...top.map(([x,z])=>[x,-7,z]),...top.slice().reverse().map(([x,z])=>[x,7,z])],P,true);
    set(r.bendTop,'d',td);set(r.bendOutline,'d',td);
    set(r.bendFront,'d',worldPath([...top.map(([x,z])=>[x,7,z]),...top.slice().reverse().map(([x,z])=>[x,7,z-.7])],P,true));
    set(r.coreA,'d',worldPath(top.map(([x,z])=>[x,-4,z+.1]),P));set(r.coreB,'d',worldPath(top.map(([x,z])=>[x,4,z+.1]),P));
    b.caption.textContent=`${v===0?'直线参考':v>0?'向上弯曲':'向下弯曲'} · 蓝/紫表示两侧纤芯。下方曲线比较相对应变；试件弯曲和芯间距放大，仅示意平面弯曲，不是完整三维重建。`;
   }else if(o.mode==='fog'){
    const c=b.config.coil;
    for(const [key,dir]of [['cw',1],['ccw',-1]]){const theta=(o.still?0:t*1.7)*dir,p=project([c.cx+c.r*Math.cos(theta),c.cy+c.r*Math.sin(theta),c.z],P);set(r[key],'cx',p[0]);set(r[key],'cy',p[1]);set(r[key],'visibility',o.still?'hidden':'visible');}
    const angle=o.still?0:t*a*.5;
    set(r.turn,'d',worldPath([[c.cx+12*Math.cos(angle),c.cy+12*Math.sin(angle),c.hubZ],[c.cx+23*Math.cos(angle),c.cy+23*Math.sin(angle),c.hubZ]],P));
    b.caption.textContent=`${v===0?'转台静止':v>0?'正向转动':'反向转动'} · 示意相位差 ${s.value.toFixed(2)} rad。两光点沿同一环反向传播；标记仅演示转动方向，光点速度不代表真实光速，角速度不是转角。`;
   }else{
    const c=b.config.probe;
    set(r.glow,'d',worldPath(Array.from({length:65},(_,i)=>{const a=i*Math.PI/32;return[c.x+5*Math.cos(a),c.y+5*Math.sin(a),c.z+.15];}),P,true));
    set(r.glow,'opacity',.08+s.value*.65);set(r.tip,'style',`fill:var(--seven-fluorescence);opacity:${.2+s.value*.8}`);
    b.caption.textContent=`pH ${v.toFixed(1)} · 相对荧光 ${s.value.toFixed(3)}。敏感尖端接触样品；pKa取7，只示意一种理想探针，不代表所有材料的响应或选择性。`;
   }
  }
  function setupPlot(o,b){
   const w=o.width,small=w===360,x=small?42:54,gw=w-x-(small?25:32),dual=['dts','dvs','fog'].includes(o.mode),stack=dual&&(small||o.mode==='dvs');
   const first={x,top:16,w:dual&&!stack?(o.mode==='dts'?430:280):gw,h:85},second=stack?{x,top:190,w:gw,h:85}:{x:o.mode==='dts'?550:400,top:16,w:o.mode==='dts'?w-580:w-432,h:85};
   const title={dts:'沿线温度 · °C',dvs:'参考与当前回波 · 同一时刻',das:'动态相位差 · rad',shape:'两侧纤芯相对应变',fog:'两路光的相位关系（放大）',chemical:'相对荧光 · 0–1',current:'偏振相对旋转 · °'}[o.mode];
   const frame=(f,t,l,r)=>{f.y=f.top+25+f.h;return `<text x="${f.x}" y="${f.top}" class="anatomy-plot-title">${t}</text><path class="anatomy-grid" d="${[0,1,2,3].map(i=>`M${f.x} ${f.y-i*f.h/3}H${f.x+f.w}`).join('')}M${f.x} ${f.y-f.h}V${f.y}"/><text x="${f.x}" y="${f.y+19}" class="anatomy-axis">${l}</text><text x="${f.x+f.w}" y="${f.y+19}" class="anatomy-axis" text-anchor="end">${r}</text>`;};
   const labels=['dts','dvs','shape'].includes(o.mode)?['0 m',o.mode==='shape'?'沿线终点':'1000 m']:o.mode==='chemical'?['pH 0','pH 14']:o.mode==='current'?['−100%','+100%']:['过去','现在'];
   let markup=frame(first,title,...labels);
   if(o.mode==='shape')markup=markup.replace('0 m','沿线起点');
   if(dual)markup+=frame(second,{dts:'两路回波 · 相对比例',dvs:'|当前 − 参考| · 逐点差异',fog:'相位差响应 · rad'}[o.mode],o.mode==='dvs'?'0 m':o.mode==='fog'?'−100%':'anti-Stokes',o.mode==='dvs'?'1000 m':o.mode==='fog'?'+100%':'Stokes');
   const height=stack?370:210;o.svg.setAttribute('viewBox',`0 0 ${w} ${height}`);
   markup+='<path data-seven-plot-current class="anatomy-current"/><path data-seven-plot-other class="seven-plot-other"/><path data-seven-plot-reference class="anatomy-reference"/><path data-seven-plot-reference-other class="anatomy-reference"/><path data-seven-plot-second class="anatomy-current"/><path data-seven-plot-zero class="anatomy-grid"/><circle data-seven-plot-dot class="anatomy-plot-dot" r="4"/><circle data-seven-plot-reference-dot class="anatomy-reference-dot" r="4"/>';
   if(o.mode==='dts')markup+=`<rect data-seven-bar-a class="seven-bar-a"/><rect data-seven-bar-b class="seven-bar-b"/><text data-seven-bar-a-value class="anatomy-axis" text-anchor="middle"/><text data-seven-bar-b-value class="anatomy-axis" text-anchor="middle"/>`;
   markup+=`<text data-seven-plot-note x="${x}" y="${height-8}" class="anatomy-axis"/>`;
   o.scene.innerHTML='<g class="anatomy-plot">'+markup+'</g>';
   const q=s=>o.scene.querySelector('[data-seven-'+s+']');
   b.sevenPlot={first,second,current:q('plot-current'),other:q('plot-other'),reference:q('plot-reference'),referenceOther:q('plot-reference-other'),secondPath:q('plot-second'),zero:q('plot-zero'),dot:q('plot-dot'),referenceDot:q('plot-reference-dot'),note:q('plot-note'),barA:q('bar-a'),barB:q('bar-b'),barAValue:q('bar-a-value'),barBValue:q('bar-b-value')};b.width=w;
  }
  function updatePlot(o,s,b){
   const p=b.sevenPlot,F=p.first,S=p.second,ref=o.reference,v=o.strength,pos=o.position,t=o.time;
   const trace=(f,fn)=>path(Array.from({length:201},(_,i)=>{const z=i/200;return[f.x+f.w*z,fn(z)];}));
   const zero=f=>f.y-f.h/2;
   set(p.dot,'visibility','hidden');set(p.referenceDot,'visibility','hidden');
   if(o.mode==='dts'){
    const temperature=(position,value)=>trace(F,z=>F.y-LabMath.temperatureAt(z*1000,position,value)/120*F.h);
    set(p.current,'d',temperature(pos,v));set(p.reference,'d',temperature(ref?.position??pos,ref?.strength??20));
    set(p.dot,'visibility','visible');set(p.dot,'cx',F.x+F.w*pos/1000);set(p.dot,'cy',F.y-v/120*F.h);
    const ratio=LabMath.ramanRatio(v),values=[ratio,1];
    for(const[i,el]of [p.barA,p.barB].entries()){const cx=S.x+S.w*(i?.75:.25),height=values[i]/2*S.h;set(el,'x',cx-12);set(el,'y',S.y-height);set(el,'width',24);set(el,'height',height);const label=i?p.barBValue:p.barAValue;set(label,'x',cx);set(label,'y',S.y-height-7);label.textContent=values[i].toFixed(2);}
   }else if(o.mode==='dvs'){
    const current=z=>LabMath.intensity(z*1000,pos,v,t),before=z=>LabMath.intensity(z*1000,ref?.position??pos,ref?.strength??0,t);
    set(p.current,'d',trace(F,z=>F.y-(current(z)-.15)*F.h));set(p.reference,'d',trace(F,z=>F.y-(before(z)-.15)*F.h));set(p.secondPath,'d',trace(S,z=>S.y-Math.abs(current(z)-before(z))/.5*S.h));
   }else if(o.mode==='das'){
    const wave=strength=>trace(F,z=>zero(F)-LabMath.phase(strength,t+(z-1)*Math.PI*2)/1.2*F.h*.43);
    set(p.current,'d',wave(v));set(p.reference,'d',ref?wave(ref.strength):'');set(p.zero,'d',path([[F.x,zero(F)],[F.x+F.w,zero(F)]]));set(p.dot,'visibility','visible');set(p.dot,'cx',F.x+F.w);set(p.dot,'cy',zero(F)-s.value/1.2*F.h*.43);
   }else if(o.mode==='shape'){
    const core=(strength,sign)=>trace(F,z=>zero(F)-sign*LabMath.shapeStrain(z,strength)*F.h*.42);
    set(p.current,'d',core(v,1));set(p.other,'d',core(v,-1));set(p.reference,'d',ref?core(ref.strength,1):'');set(p.referenceOther,'d',ref?core(ref.strength,-1):'');set(p.zero,'d',path([[F.x,zero(F)],[F.x+F.w,zero(F)]]));
   }else if(o.mode==='fog'){
    for(const[key,sign]of [['current',1],['other',-1]])set(p[key],'d',trace(F,z=>zero(F)-16*Math.sin(z*Math.PI*4+sign*s.value/2)));
    set(p.secondPath,'d',path([[S.x,S.y-S.h*.1],[S.x+S.w,S.y-S.h*.9]]));set(p.zero,'d',path([[S.x,zero(S)],[S.x+S.w,zero(S)]]));
    set(p.dot,'visibility','visible');set(p.dot,'cx',S.x+S.w*(s.a+1)/2);set(p.dot,'cy',zero(S)-s.value/1.2*S.h*.4);
    if(ref){set(p.referenceDot,'visibility','visible');set(p.referenceDot,'cx',S.x+S.w*(LabMath.normalized(ref.strength)+1)/2);set(p.referenceDot,'cy',zero(S)-LabMath.phaseLimit(ref.strength)/1.2*S.h*.4);}
   }else{
    const chemical=o.mode==='chemical',value=chemical?s.value:s.value/60;
    set(p.current,'d',chemical?trace(F,z=>F.y-LabMath.fluorescence(z*14)*F.h*.85):path([[F.x,F.y-F.h*.1],[F.x+F.w,F.y-F.h*.9]]));
    if(!chemical)set(p.zero,'d',path([[F.x,zero(F)],[F.x+F.w,zero(F)]]));
    const dot=(el,strength)=>{const fraction=chemical?strength/14:(LabMath.normalized(strength)+1)/2,val=chemical?LabMath.fluorescence(strength):LabMath.rotation(strength)/60;set(el,'cx',F.x+F.w*fraction);set(el,'cy',chemical?F.y-val*F.h*.85:zero(F)-val*F.h*.4);set(el,'visibility','visible');};dot(p.dot,v);if(ref)dot(p.referenceDot,ref.strength);
   }
   p.note.textContent={dts:ref?'虚线：记录温度 · 实线：当前':'虚线：20 °C参考 · 实线：当前',dvs:v===0&&!ref?'无扰动：差异为零':'虚线：参考 · 实线：当前 · 下图：差异',das:'实心点 = 仪表指针的瞬时相位差',shape:'蓝：纤芯A · 紫：纤芯B · 虚线：记录',fog:'蓝/紫：反向光 · 空心点：记录',chemical:'空心点：记录 · 实心点：当前',current:'虚线：零电流方向 · 空心点：记录'}[o.mode];
  }
  return Object.freeze({modes,titles,sample,decorate,updateRig,setupPlot,updatePlot});
 };
})(typeof window==='undefined'?globalThis:window);
