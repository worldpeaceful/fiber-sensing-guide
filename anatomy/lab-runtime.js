'use strict';
// Anatomy只渲染，参数、曲线和时间来自原实验；不注册第二个动画循环。
(function(root){
 function createRenderer(){
 const modes=['echo','fbg','pressure','dts','dvs','das','shape','fog','chemical','current'];
 let active=null;
 const project=(p,P)=>{const a=(P.azimuth??45)*Math.PI/180,e=(P.elevation??30)*Math.PI/180,s=P.scale*Math.sqrt(1.6);return[P.origin[0]+(p[0]*Math.sin(a)-p[1]*Math.cos(a))*s,P.origin[1]+((p[0]*Math.cos(a)+p[1]*Math.sin(a))*Math.sin(e)-p[2]*Math.cos(e))*s];};
 const path=(points,closed=false)=>points.map((p,i)=>(i?'L':'M')+p.map(v=>Number(v.toFixed(3))).join(' ')).join('')+(closed?'Z':'');
 const worldPath=(points,P,closed=false)=>path(points.map(p=>project(p,P)),closed);
 function sample(mode,position,strength,time){
   if(!modes.includes(mode)||![position,strength,time].every(Number.isFinite))throw new RangeError('Invalid Anatomy laboratory state');
   if(seven?.modes.includes(mode))return seven.sample(mode,position,strength,time);
   const a=LabMath.normalized(strength);
   if(mode==='echo'){
     const movingTime=3.2*position/1000,clock=time%(movingTime+.7),progress=Math.min(1,clock/movingTime),outbound=clock<movingTime/2,returning=clock<movingTime;
     return{value:LabMath.roundTrip(position),fraction:position/1000,travel:(position-50)/900*160.2,pointX:-54+178*position/1000,pulseX:outbound?-54+178*position/1000*progress*2:returning?-54+178*position/1000*(2-progress*2):-54,phase:outbound?'光正在去程':returning?'回波正在返回':'回波到达仪器',outbound};
   }
   return{value:a,fraction:mode==='fbg'?.5+a*.22:a,travel:mode==='fbg'?11*(a+1):0,sag:mode==='pressure'?12*a:0,gap:mode==='pressure'?64.3-12*a-43.4:null};
 }
 function clear(host){
   if(active){active.host.replaceChildren();active.stage.classList.remove('anatomy-active');active=null;}
   if(host)host.hidden=true;
 }
 function mount(opts){
   clear(opts.host);
   const config=root.LabAnatomyScenes[opts.mode],host=opts.host,stage=host.closest('[data-apparatus-stage],.lab-stage');
   host.hidden=false;host.innerHTML=`<div class="apparatus-heading"><span>${{echo:'01 · 回波定位装置',fbg:'02 · 光栅拉伸台',pressure:'03 · 膜片探头剖切',...seven?.titles}[opts.mode]}</span><span>装置原理示意</span></div>${config.svg}<details class="apparatus-notes" data-apparatus-notes open><summary>装置说明与示意范围</summary><p class="apparatus-caption" data-apparatus-caption></p></details>`;
   stage.classList.add('anatomy-active');
   const svg=host.querySelector('svg');
   if(config.frame){svg.setAttribute('viewBox',config.frame.join(' '));svg.setAttribute('width',config.frame[2]);svg.setAttribute('height',config.frame[3]);}
   // 叠加的标记是读图提示，不是虚构的实体零件。
   if(opts.mode==='echo')svg.insertAdjacentHTML('beforeend','<g data-apparatus-overlay><circle data-position-dot class="apparatus-position" r="5"/><circle data-pulse-dot class="apparatus-pulse" r="4"/></g>');
   if(opts.mode==='pressure')svg.insertAdjacentHTML('beforeend','<g data-apparatus-overlay><path data-cavity-reference class="apparatus-reference"/><path data-cavity-light class="apparatus-light"/><path data-load class="apparatus-load"/></g>');
   const ref=s=>host.querySelector(s);
   active={mode:opts.mode,host,stage,config,width:0,scene:opts.scene,caption:ref('[data-apparatus-caption]'),moves:[...host.querySelectorAll('[data-cursor-move],[data-bench-move]')],fiber:ref('[data-bench-fiber]'),grating:ref('[data-bench-grating]'),screen:ref('[data-bench-screen]'),membraneTop:ref('[data-membrane-top]'),membraneFront:ref('[data-membrane-front]'),membraneEdge:ref('[data-membrane-edge]'),position:ref('[data-position-dot]'),pulse:ref('[data-pulse-dot]'),cavity:ref('[data-cavity-light]'),cavityReference:ref('[data-cavity-reference]'),load:ref('[data-load]')};
   if(seven?.modes.includes(opts.mode))seven.decorate(active,opts);
 }
 function setupPlot(opts){
   if(seven?.modes.includes(opts.mode)){seven.setupPlot(opts,active);return;}
   const w=opts.width,small=w===360,x=small?42:54,gw=w-x-(small?25:32),y=small?143:144,h=90;
   opts.svg.setAttribute('viewBox',`0 0 ${w} ${small?210:204}`);
   const name={echo:'回波时间 · 峰的位置随距离改变',fbg:'反射光谱 · 峰移动，幅值保持',pressure:'膜片形变 · 归一化响应'}[opts.mode];
   const labels=opts.mode==='echo'?['0 μs',LabMath.roundTrip(1000).toFixed(2)+' μs']:opts.mode==='fbg'?['较短波长','较长波长']:['0%','100%'];
   opts.scene.innerHTML=`<g class="anatomy-plot"><text x="${x}" y="22" class="anatomy-plot-title">${name}</text><path class="anatomy-grid" d="${[0,1,2,3].map(i=>`M${x} ${y-i*h/3}H${x+gw}`).join('')}M${x} ${y-h}V${y}"/><path data-plot-reference class="anatomy-reference"/><path data-plot-current class="anatomy-current"/><circle data-plot-reference-dot class="anatomy-reference-dot" r="4"/><circle data-plot-dot class="anatomy-plot-dot" r="4"/><text x="${x}" y="${y+19}" class="anatomy-axis">${labels[0]}</text><text x="${x+gw}" y="${y+19}" text-anchor="end" class="anatomy-axis">${labels[1]}</text><text data-plot-note x="${x}" y="${small?196:190}" class="anatomy-axis"/></g>`;
   const ref=s=>opts.scene.querySelector(s);
   active.plot={x,gw,y,h,current:ref('[data-plot-current]'),reference:ref('[data-plot-reference]'),dot:ref('[data-plot-dot]'),referenceDot:ref('[data-plot-reference-dot]'),note:ref('[data-plot-note]')};
   active.width=w;
 }
 const set=(el,name,value)=>el?.setAttribute(name,String(value));
 const seven=typeof root.LabAnatomySeven==='function'?root.LabAnatomySeven({project,path,worldPath,set}):null;
 function updatePlot(opts,s){
   if(seven?.modes.includes(opts.mode)){seven.updatePlot(opts,s,active);return;}
   const p=active.plot,{x,gw,y,h}=p;
   const reference=opts.reference;
   const samples=fn=>path(Array.from({length:201},(_,i)=>{const z=i/200;return[x+gw*z,fn(z)];}));
   const graph=(position,strength)=>{
     if(opts.mode==='echo'){const center=x+gw*position/1000;return samples(z=>y-6-h*.72*Math.exp(-(((x+gw*z-center)/12)**2)));}
     if(opts.mode==='fbg')return samples(z=>y-5-h*.77*Math.exp(-(((z-(.5+LabMath.normalized(strength)*.22))/.045)**2)));
     return path([[x,y],[x+gw,y-h*.85]]);
   };
   set(p.current,'d',graph(opts.position,opts.strength));
   set(p.reference,'d',opts.mode==='pressure'||(opts.mode==='echo'&&!reference)?'':graph(reference?.position??opts.position,reference?.strength??0));
   const dotY=opts.mode==='echo'?y-6-h*.72:opts.mode==='fbg'?y-5-h*.77:y-h*.85*s.value;
   set(p.dot,'cx',x+gw*s.fraction);set(p.dot,'cy',dotY);
   set(p.referenceDot,'visibility',reference&&opts.mode==='pressure'?'visible':'hidden');
   if(reference){set(p.referenceDot,'cx',x+gw*LabMath.normalized(reference.strength));set(p.referenceDot,'cy',y-h*.85*LabMath.normalized(reference.strength));}
   p.note.textContent=opts.mode==='echo'?`往返 ${s.value.toFixed(2)} μs · 来回 ${opts.position*2} m`:(reference?'虚线 / 空心点：记录 · 实心点：当前':opts.mode==='fbg'?'虚线：零伸缩参考 · 实线：当前':'形变放大 · 实心点：当前参数');
 }
 function updateRig(opts,s){
   const a=active,P=a.config.P;
   if(seven?.modes.includes(opts.mode)){seven.updateRig(opts,s,a);a.host.dataset.value=String(s.value);a.host.dataset.mode=opts.mode;return;}
   const origin=project([0,0,0],P),offset=project([s.travel,0,0],P);
   for(const el of a.moves)set(el,'transform',`translate(${offset[0]-origin[0]} ${offset[1]-origin[1]})`);
   if(opts.mode==='echo'){
     const point=project([s.pointX,15.5,22],P),pulse=project([s.pulseX,15.5,22],P);
     set(a.position,'cx',point[0]);set(a.position,'cy',point[1]);set(a.pulse,'cx',pulse[0]);set(a.pulse,'cy',pulse[1]);set(a.pulse,'data-returning',String(!s.outbound));
     set(a.pulse,'visibility',opts.still?'hidden':'visible');
     a.caption.textContent=`${opts.position} m · ${opts.still?'传播静止，仍可调整位置':opts.paused?'已暂停 · '+s.phase:s.phase}。游标标记观察位置，并非额外反射器；光程按比例缩短。`;
   }else if(opts.mode==='fbg'){
     set(a.fiber,'d',worldPath([[-64,-10,35],[64+s.travel,-10,35]],P));
     const spacing=2.7*(1+s.travel/128),center=s.travel/2;
     set(a.grating,'d',Array.from({length:17},(_,i)=>worldPath([[center+(i-8)*spacing,-11,35],[center+(i-8)*spacing,-9,35]],P)).join(''));
     const centerX=-84+LabMath.normalized(opts.strength)*10;
     set(a.screen,'d',worldPath(Array.from({length:61},(_,i)=>{const x=-106+i*.78;return[x,49-12*Math.exp(-(((x-centerX)/3.1)**2)),36.16];}),P));
     a.caption.textContent=`${opts.strength===0?'不伸缩':opts.strength>0?'拉长 · 条纹变疏':'压短 · 条纹变密'}。温度固定；夹具行程、光栅纹理和光纤直径均放大，读数为原实验的示意单位。`;
   }else{
     const top=Array.from({length:49},(_,i)=>{const x=-4+i*88/48;return[x,65-s.sag*(1-((x-40)/44)**2)];});
     const topD=worldPath([...top.map(([x,z])=>[x,-12,z]),...top.slice().reverse().map(([x,z])=>[x,22,z])],P,true);
     set(a.membraneTop,'d',topD);set(a.membraneEdge,'d',topD);
     set(a.membraneFront,'d',worldPath([...top.map(([x,z])=>[x,22,z]),...top.slice().reverse().map(([x,z])=>[x,22,z-.7])],P,true));
     set(a.cavityReference,'d',worldPath([[-4,22,65],[84,22,65]],P));
     set(a.cavity,'d',worldPath([[40,8,43.4],[40,8,65-s.sag-.7]],P));
     set(a.load,'d',opts.strength===0?'':[10,40,70].map(x=>{const z=65-s.sag*(1-((x-40)/44)**2);return worldPath([[x,5,z+14],[x,5,z+4],[x-3,5,z+7],[x,5,z+4],[x+3,5,z+7]],P);}).join(''));
     a.caption.textContent=`相对压力 ${opts.strength}% · 形变 ${s.value.toFixed(2)}（归一化）。前侧为教学剖切；膜片下凹，端面与膜片间的光学腔缩短，不代表真实尺寸或压力标定。`;
   }
   a.host.dataset.value=String(s.value);a.host.dataset.mode=opts.mode;
 }
 function render(opts){
   if((!['echo','fbg','pressure'].includes(opts.mode)&&!seven)||!root.LabAnatomyScenes?.[opts.mode]||typeof SVGSVGElement==='undefined'||!(opts.svg instanceof SVGSVGElement)||!opts.host)return false;
   if(!active||active.mode!==opts.mode||active.host!==opts.host)mount(opts);
   if(active.width!==opts.width||active.scene!==opts.scene)setupPlot(opts);
   const s=sample(opts.mode,opts.position,opts.strength,opts.time);
   updateRig(opts,s);updatePlot(opts,s);return true;
 }
 return Object.freeze({render,clear,sample,project});
 }
 root.LabAnatomy=Object.freeze({...createRenderer(),createRenderer});
})(typeof window==='undefined'?globalThis:window);
