'use strict';
(() => {
  const host=document.getElementById('fiber-anatomy');
  if(!host || typeof SVGSVGElement==='undefined' || typeof IntersectionObserver==='undefined' || !window.FiberBenchModel || !window.FiberBenchGeometry) return;
  const M=window.FiberBenchModel,G=window.FiberBenchGeometry,C=G.camera,P=G.P;
  const stage=host.querySelector('[data-bench-stage]'),svg=stage.querySelector('svg'),slider=host.querySelector('#fiber-bench-strain');
  const moving=[...host.querySelectorAll('[data-bench-move]')];
  const fiber=host.querySelector('[data-bench-fiber]'),grating=host.querySelector('[data-bench-grating]'),screen=host.querySelector('[data-bench-screen]');
  const strainOut=host.querySelector('[data-bench-strain]'),waveOut=host.querySelector('[data-bench-wave]'),extensionOut=host.querySelector('[data-bench-extension]');
  const current=host.querySelector('[data-bench-spectrum]'),reference=host.querySelector('[data-bench-reference]'),tour=host.querySelector('[data-bench-tour]'),hint=host.querySelector('[data-bench-hint]'),status=host.querySelector('[data-bench-announcement]');
  const presets=[...host.querySelectorAll('[data-bench-preset]')],still=matchMedia('(prefers-reduced-motion: reduce)');
  const project=([x,y,z])=>[P.origin[0]+(x*C.sinA-y*C.cosA)*C.k,P.origin[1]+((x*C.cosA+y*C.sinA)*C.sinE-z*C.cosE)*C.k];
  const path=points=>points.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(2)).join(' ')).join('');
  const clamp=value=>Math.min(1000,Math.max(0,value));
  const curve=wave=>path(Array.from({length:141},(_,i)=>{const nm=1549.8+i/140*1.6;return [18+i/140*484,63-49*Math.exp(-(((nm-wave)/.055)**2))];}));
  let value=0,target=0,frame=0,last=0,clock=0,visible=false,touring=!still.matches,hover=false,focused=false,drag=null;
  const syncTheme=()=>host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  reference.setAttribute('d',curve(1550));
  function describe(announce=false) {
    const s=M.sample(target),words=`光纤应变${Math.round(s.strain)}微应变，反射峰${s.wavelengthNm.toFixed(3)}纳米`;
    stage.setAttribute('aria-valuenow',String(Math.round(s.strain)));
    stage.setAttribute('aria-valuetext',words);
    if(announce) status.textContent=words;
  }
  function draw() {
    const s=M.sample(value),dx=C.sinA*C.k*s.travel,dy=C.cosA*C.sinE*C.k*s.travel;
    for(const part of moving) part.setAttribute('transform',`translate(${dx.toFixed(3)} ${dy.toFixed(3)})`);
    const start=[G.fixed,G.fiberY,G.fiberZ],end=[G.right+s.travel,G.fiberY,G.fiberZ];
    fiber.setAttribute('d',path([project(start),project(end)]));
    const center=(G.fixed+G.right+s.travel)/2,pitch=2.7*(1+s.fraction*.18);
    grating.setAttribute('d',Array.from({length:17},(_,i)=>{const x=center+(i-8)*pitch;return path([project([x,G.fiberY-1,G.fiberZ]),project([x,G.fiberY+1,G.fiberZ])]);}).join(''));
    const cx=-99+s.fraction*31;
    screen.setAttribute('d',path(Array.from({length:61},(_,i)=>{const x=-106+i*.78;return project([x,49-12*Math.exp(-(((x-cx)/3.1)**2)),36.16]);})));
    strainOut.textContent=String(Math.round(s.strain));
    waveOut.textContent=s.wavelengthNm.toFixed(3);
    extensionOut.textContent=`伸长 ${s.elongationMm.toFixed(3)} mm`;
    current.setAttribute('d',curve(s.wavelengthNm));
    host.dataset.strain=String(Math.round(s.strain));
    host.dataset.motion=(!visible||document.hidden)?'offscreen':(touring&&!hover&&!focused?'tour':(Math.abs(value-target)<.05?'settled':'following'));
    for(const button of presets) button.setAttribute('aria-pressed',String(Math.abs(Number(button.dataset.benchPreset)-target)<1));
  }
  function setTourLabel() { tour.textContent=touring?'暂停演示':'自动演示';tour.setAttribute('aria-pressed',String(touring)); }
  function tick(now) {
    // 指数跟随有解析解；直接使用真实帧间隔，在内嵌预览降帧时仍按实际时间收敛。
    // 本组件没有数值积分的弹簧，离屏和后台又会停止调度，因此无需逐帧截断成1/30秒。
    const dt=last?Math.min((now-last)/1000,1):1/60;last=now;
    if(touring&&!hover&&!focused&&!still.matches) { clock+=dt;if(clock>1.4) { target=450-450*Math.cos((clock-1.4)*Math.PI/5);slider.value=String(Math.round(target/10)*10); } }
    value=still.matches?target:value+(target-value)*(1-Math.exp(-dt/.22));
    if(Math.abs(target-value)<.025) value=target;
    draw();
    frame=visible&&!document.hidden&&((touring&&!hover&&!focused&&!still.matches)||value!==target)?requestAnimationFrame(tick):0;
  }
  function run() { if(!frame&&visible&&!document.hidden) {last=0;frame=requestAnimationFrame(tick);} }
  function pauseForInput() { touring=false;setTourLabel();hint.textContent='夹具移动，反射峰随之移动'; }
  function steer(next,announce=false) { if(!Number.isFinite(next))return;pauseForInput();target=Math.round(clamp(next)/10)*10;slider.value=String(target);describe(announce);if(still.matches){value=target;draw();}else run(); }
  slider.addEventListener('input',()=>steer(Number(slider.value)));
  slider.addEventListener('change',()=>describe(true));
  for(const button of presets) button.addEventListener('click',()=>steer(Number(button.dataset.benchPreset),true));
  tour.addEventListener('click',()=>{touring=!touring;if(still.matches&&touring){touring=false;hint.textContent='已减少动态效果，请用滑块调整';}clock=1.4;hover=false;focused=false;setTourLabel();run();});
  stage.addEventListener('pointerenter',()=>{hover=true;});
  stage.addEventListener('pointerleave',()=>{hover=false;if(touring)run();});
  host.addEventListener('focusin',event=>{focused=true;if(event.target===stage){target=Math.round(value/10)*10;slider.value=String(target);describe();}});
  host.addEventListener('focusout',event=>{if(!host.contains(event.relatedTarget)){focused=false;if(touring)run();}});
  stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,start:target,id:event.pointerId};stage.setPointerCapture(event.pointerId);stage.focus({preventScroll:true});pauseForInput();});
  stage.addEventListener('pointermove',event=>{if(!drag)return;const rect=svg.getBoundingClientRect();const axis=[C.sinA,C.cosA*C.sinE],norm=axis[0]**2+axis[1]**2;const delta=((event.clientX-drag.x)*axis[0]+(event.clientY-drag.y)*axis[1])/norm;steer(drag.start+delta/(rect.width*.26)*1000);});
  const release=event=>{if(!drag)return;if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);drag=null;describe(true);};
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  stage.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey)return;let next=null;const step=event.shiftKey?200:50;if(['ArrowRight','ArrowUp'].includes(event.key))next=target+step;if(['ArrowLeft','ArrowDown'].includes(event.key))next=target-step;if(event.key==='Home')next=0;if(event.key==='End')next=1000;if(next!==null){event.preventDefault();steer(next);}if(event.key===' '||event.key==='Enter'){event.preventDefault();tour.click();}if(event.key==='Escape'){pauseForInput();stage.blur();}});
  still.addEventListener('change',()=>{if(still.matches){touring=false;value=target;setTourLabel();draw();}run();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;host.dataset.motion='offscreen';}else run();});
  new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;if(!visible){if(frame)cancelAnimationFrame(frame);frame=0;host.dataset.motion='offscreen';}else run();},{rootMargin:'0px'}).observe(host);
  setTourLabel();draw();describe();
})();
