'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MODES={
 echo:{title:'回波，怎么知道位置？',copy:'发一束短短的光，沿途都有一点光返回。用往返时间，就能把回波放回光纤上的位置。',caption:'返回得越晚，位置就越远。',hint:'拖动位置，比较回波的往返时间。',svg:'光脉冲回波定位',default:0},
 dts:{title:'光，怎么读出温度？',copy:'常见拉曼 DTS 比较 Stokes 与 anti-Stokes 两条回波。温度改变，两者的强度关系也跟着改变。',caption:'温度改变，拉曼回波的比例跟着变。',hint:'移动热点或改变温度，看曲线怎样变化。',svg:'拉曼测温与局部温度分布',label:'局部温度',max:120,default:60,unit:'°C'},
 dvs:{title:'哪里在振动？',copy:'这里演示一种检测回波光强变化的实现。让局部扰动变强，比较“现在”和“之前”的回波，就能发现变化位置。',caption:'比较前后两次回波，发现哪里有变化。',hint:'增强扰动，观察差异出现在哪里。',svg:'回波光强变化与扰动定位',label:'扰动强度',max:100,default:55,unit:'%'},
 das:{title:'相位，怎么记录伸缩？',copy:'想象回波是一根转动的指针。光纤微小伸缩时，相位会改变；比较标距两端的相位，可以获得动态应变。',caption:'指针的朝向变化，留下伸缩的线索。',hint:'改变伸缩幅度，看相位差和波形一起变化。',svg:'相位指针与动态应变示意',label:'伸缩幅度',max:100,default:50,unit:'%'},
 fbg:{title:'光栅，怎么感知拉伸？',copy:'光栅像一块挑“颜色”的小镜子。这里保持温度不变：光栅被拉长，反射峰向更长的波长移动。',caption:'规则间距改变，反射的波长也改变。',hint:'拉伸光栅，看看反射峰向哪边移动。',svg:'光栅间距与反射峰变化',label:'拉伸程度',max:100,default:30,unit:'%'}
};
Object.assign(MODES,{
 pressure:{title:'压力，怎么变成光的变化？',copy:'这里演示膜片式光学腔探头的教学剖切。压力让膜片下凹，固定光纤端面与膜片之间的腔长缩短。这里只归一化显示膜片形变，不模拟干涉强度，也不对应真实压力标定。',caption:'膜片轻轻下凹，光学腔随之缩短。',hint:'增加压力，比较膜片形变与归一化响应。',svg:'膜片式光学腔压力探头剖切与归一化形变',label:'相对压力',min:0,max:100,default:45,unit:'%'},
 shape:{title:'弯曲，怎么拼出形状？',copy:'这里用两侧纤芯作平面弯曲示意：弯曲时一侧伸长、另一侧压短。比较应变差，可估算曲率；真实三维重建需要更多纤芯、方向和参考信息。',caption:'不同纤芯的应变差，提供弯曲线索。',hint:'向两个方向弯曲，观察两条应变曲线交换方向。',svg:'多芯光纤弯曲与应变差',label:'相对弯曲',min:-100,max:100,default:40,unit:'%',animated:false},
 fog:{title:'光纤陀螺，怎么知道在转？',copy:'两束光沿同一光纤环反向传播。转动产生萨格纳克相位差，其方向与角速度相关。这里放大相位响应，只表示趋势，不模拟真实光速或仪器精度。',caption:'转动方向变，相位差也反向。',hint:'从负值滑到正值，比较相位差的符号。',svg:'反向传播光与萨格纳克相位差',label:'相对角速度',min:-100,max:100,default:40,unit:'%'},
 chemical:{title:'酸碱度，怎么让光作回答？',copy:'以一种随 pH 升高而增强荧光的理想敏感探针为例。这里采用参考 pKa 为 7 的简化响应，显示相对强度；其他探针可能有不同甚至相反的趋势。',caption:'敏感材料负责响应，光纤负责传光或读出。',hint:'改变 pH，观察敏感层的示意荧光。',svg:'pH 敏感材料与归一化荧光响应',label:'溶液 pH（示意）',min:0,max:14,step:.1,default:7,unit:'',animated:false},
 current:{title:'电流，怎么转动光学指针？',copy:'电流产生磁场。专门的传感路径利用法拉第效应读取偏振变化，再经过校准得到电流。这里的旋转角度采用任意示意比例。',caption:'电流反向，示意偏振旋转也反向。',hint:'改变电流方向，观察偏振相对参考线的旋转。',svg:'电流引起的法拉第偏振旋转',label:'相对电流',min:-100,max:100,default:50,unit:'%',animated:false}
});
Object.assign(MODES.fbg, {min:-100,label:'相对伸缩（示意）',animated:false,title:'光栅，怎么感知伸缩？',copy:'光栅像一块挑“颜色”的小镜子。温度保持不变：拉长让反射峰向长波移动，压短让它向短波移动。',caption:'伸缩反向，反射峰移动方向也反向。',hint:'先选压短，再选拉长，比较间距与反射峰。'});
MODES.dts.animated=false; MODES.pressure.animated=false;
function renderDirectory(){
 renderMethods();
 if($('function-grid'))$('function-grid').innerHTML=FUNCTIONS.map(f=>`<button id="function-${f.id}" class="guide-card ${f.color}" data-function="${f.id}"><span class="function-label">${esc(f.title)}</span>${functionIllustration(f.id)}<h3 class="card-prompt">${esc(f.question)}</h3><span class="card-foot"><b>看看怎么测 →</b></span></button>`).join('');
 if($('function-filter'))$('function-filter').innerHTML='<option value="all">全部功能</option>'+FUNCTIONS.map(f=>`<option value="${f.id}">${esc(f.title)}</option>`).join('');
 if($('lab-tabs'))$('lab-tabs').innerHTML=EXPERIMENT_GROUPS.map(g=>`<div class="experiment-group" role="presentation"><span aria-hidden="true">${esc(g.name)}</span>${g.modes.map(([id,name])=>`<button role="tab" aria-selected="false" tabindex="-1" data-mode="${id}" id="tab-${id}" aria-controls="lab-panel">${esc(name)}</button>`).join('')}</div>`).join('');
}
const PAGE_FILES={intro:'index.html',guide:'guide.html',methods:'methods.html',lab:'lab.html',terms:'terms.html',questions:'questions.html'};
function visitPage(url,options={}){if(typeof window.navigateFiberPage==='function')window.navigateFiberPage(url,options);else if(options.replace)window.location.replace(url);else window.location.assign(url);}
const pageId=document.body.dataset.page||document.querySelector('main>section')?.id||'intro';
const hasLab=!!$('lab'),hasTerms=!!$('term-grid');
const pageParams=new URLSearchParams(window.location.search);
function redirectLegacySection(){
 const section=window.location.hash.slice(1);
 if(pageId==='intro'&&section!=='intro'&&Object.hasOwn(PAGE_FILES,section)){
  const destination=new URL(PAGE_FILES[section],window.location.href);
  destination.search=window.location.search;visitPage(destination.href,{replace:true});
 }
}
redirectLegacySection();window.addEventListener('hashchange',redirectLegacySection);
renderDirectory();
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const state={mode:'echo',position:600,strength:0,paused:reducedMotion.matches,time:1.2,filter:'all',functionFilter:'all',methodFilter:'all',query:'',reference:null,speed:1};
let lastFrame=0,dirty=true;
const compactLab=window.matchMedia('(max-width:1199px)');
function updateLabPicker(){
 const picker=$('lab-picker');if(!picker)return;
 const focused=picker.contains(document.activeElement);
 picker.open=!compactLab.matches;
 if(focused)(compactLab.matches?picker.querySelector('summary'):$('tab-'+state.mode)).focus({preventScroll:true});
}
if(hasLab){compactLab.addEventListener('change',updateLabPicker);updateLabPicker();}
function experimentFocusTarget(){return $('lab-picker').open?$('tab-'+state.mode):$('lab-picker').querySelector('summary');}
function renderTerms(){
 if(!hasTerms)return;
 const terms=filterFiberTerms(TERMS,state);
 $('term-grid').innerHTML=terms.map(t=>`<button class="term-card" data-term="${t.id}" aria-label="阅读 ${esc(t.name)} 的解释"><span class="term-type">${CATEGORY[t.cat]}</span><h3>${esc(t.name)}</h3><span class="term-en">${esc(t.en)}</span><p>${esc(t.one)}</p><span class="term-foot">读懂这个词 →</span></button>`).join('');
 $('term-count').textContent=`${terms.length} / ${TERMS.length} 个术语`;$('empty').hidden=terms.length!==0;
 document.querySelectorAll('[data-filter]').forEach(b=>{const yes=b.dataset.filter===state.filter;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
}
let detailNavigation=null;
let dialogTrigger=null,dialogNextFocus=null,dialogCurrent=null,dialogHistory=[],restoringDetail=false;
function recordDetail(type,id){
 if(!restoringDetail){
  if(!$('term-dialog').open)dialogHistory=[];
  else if(dialogCurrent&&(dialogCurrent.type!==type||dialogCurrent.id!==id))dialogHistory.push({...dialogCurrent,scroll:$('term-dialog').scrollTop});
 }
 dialogCurrent={type,id};$('dialog-back').hidden=dialogHistory.length===0;
 detailNavigation?.record(type,id);
}
function backDetail(){
 if(detailNavigation?.back())return;
 const previous=dialogHistory.pop();if(!previous)return;
 restoringDetail=true;
 try{if(previous.type==='function')openFunction(previous.id);else if(previous.type==='method')openMethod(previous.id);else openTerm(previous.id);}finally{restoringDetail=false;}
 $('term-dialog').scrollTop=previous.scroll;
 (dialogHistory.length?$('dialog-back'):$('close-dialog')).focus({preventScroll:true});
}
function showDialog(trigger){if($('detail-share-status')){$('detail-share-status').textContent='';$('detail-share-url').hidden=true;}$('dialog-content').innerHTML=prepareFiberDetailReading(dialogCurrent.type,dialogCurrent.id,$('dialog-content').innerHTML);window.DetailMechanisms?.clear();if(!$('term-dialog').open){const origin=dialogHistory[0]||dialogCurrent;const fallback=origin.type==='term'?document.querySelector('#term-grid [data-term="'+origin.id+'"]'):$(origin.type+'-'+origin.id);dialogTrigger=trigger||(document.activeElement!==document.body?document.activeElement:null)||fallback||document.activeElement;$('term-dialog').showModal();}$('term-dialog').scrollTop=0;$('close-dialog').focus();mountDetailIllustration($('dialog-content'));}
function sourceLinks(keys){return `<div class="detail-source">原理资料 ${keys.map(k=>`<a href="${SOURCES[k].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].name)}</a>`).join('')}</div>`;}
function openFunction(id,trigger){
 if(!Object.hasOwn(FUNCTION_BY_ID,id))return;
 const f=FUNCTION_BY_ID[id];
 recordDetail('function',id);
 $('dialog-category').textContent='按测量对象 · '+f.title;
 $('dialog-content').innerHTML=`<h2 id="dialog-title">${esc(f.question)}</h2><p class="detail-intro">${esc(f.one)}</p>
 <div class="analogy">${esc(f.analogy)}</div>
 ${renderDetailIllustration('function',f)}
 <section class="detail-section"><h3>光，是怎样读出变化的？</h3><p>${esc(f.principle)}</p></section>
 <section class="detail-section"><h3>同一功能，可以有哪些方案？</h3><div class="technology-list">${f.technologies.map(t=>`<div class="technology-item"><div class="technology-heading"><strong>${esc(t.name)}</strong><span class="layout-tag">${esc(t.layout)}</span></div><p>${esc(t.copy)}</p><div class="related-links">${t.terms.map(id=>`<button data-term="${id}">${esc(TERMS.find(t=>t.id===id).name)}</button>`).join('')}</div></div>`).join('')}</div></section>
 <section class="detail-section"><h3>关联的测试方法</h3>${methodLinks(f.methodIds)}</section>
 <section class="detail-section"><h3>在哪里用得上？</h3><ul>${f.applications.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></section>
 <section class="detail-section"><h3>容易混淆的地方</h3><p class="detail-warning">${esc(f.care)}</p></section>
 <section class="detail-section"><h3>动手观察</h3><div class="experiment-links">${f.experiments.map(mode=>`<button class="button primary" data-experiment="${mode}">${esc(MODES[mode].title)}</button>`).join('')}</div></section>
 <section class="detail-section"><h3>相关术语</h3><div class="related-links">${f.termIds.map(id=>`<button data-term="${id}">${esc(TERMS.find(t=>t.id===id).name)}</button>`).join('')}<button data-related-function="${f.id}">查看这一功能的全部词条 →</button></div></section>${sourceLinks(f.sources)}`;
 showDialog(trigger);
}

function openTerm(id,trigger){
 const t=TERMS.find(t=>t.id===id);if(!t)return;
 recordDetail('term',id);
 $('dialog-category').textContent=CATEGORY[t.cat];
 $('dialog-content').innerHTML=`<h2 id="dialog-title">${esc(t.name)}</h2><div class="term-en">${esc(t.en)}</div><div class="analogy">${esc(t.analogy)}</div>
 <section class="detail-section"><h3>它是怎么回事？</h3><p>${esc(t.principle)}</p></section>
 <section class="detail-section"><h3>会在哪里遇到它？</h3><p>${esc(t.example)}</p></section>
 <section class="detail-section"><h3>容易混淆的地方</h3><p class="detail-warning">${esc(t.care)}</p></section>
 ${t.methodIds.length?`<section class="detail-section"><h3>关联的测试方法</h3>${methodLinks(t.methodIds)}</section>`:''}
 <section class="detail-section"><h3>关联的测量功能</h3><div class="function-tags">${t.functionIds.map(id=>`<button data-function="${id}">${esc(FUNCTION_BY_ID[id].title)}</button>`).join('')}</div></section>
 ${t.experiment?`<section class="detail-section"><button class="button primary" data-experiment="${t.experiment}">动手看看这个原理</button></section>`:''}${sourceLinks(t.sources)}`;
 showDialog(trigger);
}
function dialogReturnTarget(){let target=dialogNextFocus||dialogTrigger;const directory=target?.closest('.mobile-directory');if(directory&&!directory.open)target=directory.querySelector('summary');const picker=target?.closest('.lab-picker');if(picker&&!picker.open)target=picker.querySelector('summary');return target;}
function closeTerm(nextFocus){dialogNextFocus=nextFocus||null;if($('term-dialog').open){detailNavigation?.close();$('term-dialog').close();const target=dialogReturnTarget();if(target?.isConnected)target.focus({preventScroll:true});}}
function syncLabModeUrl(mode){
 if(!window.history?.replaceState)return;
 const url=new URL(window.location.href);if(url.searchParams.get('mode')===mode)return;
 url.searchParams.set('mode',mode);window.history.replaceState(window.history.state,'',url.href);
}
function visitExperiment(mode){
 if(!Object.hasOwn(MODES,mode))return;
 if(!hasLab){visitPage('lab.html?mode='+encodeURIComponent(mode));return;}
 if(detailNavigation?.depth&&$('term-dialog').open){window.addEventListener('popstate',()=>visitExperiment(mode),{once:true});closeTerm();return;}
 selectMode(mode);closeTerm(experimentFocusTarget());$('lab').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'});experimentFocusTarget().focus({preventScroll:true});
}
function visitRelatedTerms(kind,id){
 if(!['method','function'].includes(kind)||!Object.hasOwn(kind==='method'?METHOD_BY_ID:FUNCTION_BY_ID,id))return;
 if(!hasTerms){visitPage('terms.html?'+kind+'='+encodeURIComponent(id));return;}
 state.methodFilter=kind==='method'?id:'all';state.functionFilter=kind==='function'?id:'all';state.filter='all';state.query='';
 $('method-filter').value=state.methodFilter;$('function-filter').value=state.functionFilter;$('search').value='';renderTerms();
 const options=document.querySelector('.dictionary-options');if(options)options.open=true;
 closeTerm($(kind+'-filter'));$('terms').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'});
}
if(hasLab){
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{selectMode(b.dataset.mode);if(compactLab.matches){$('lab-picker').open=false;experimentFocusTarget().focus({preventScroll:true});}}));
 $('lab-tabs').addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-mode]')];let i=tabs.indexOf(document.activeElement);if(i<0)return;if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectMode(tabs[i].dataset.mode);tabs[i].focus();}});
}
function clearFilters(){if(!hasTerms)return;state.filter='all';state.functionFilter='all';state.methodFilter='all';state.query='';$('search').value='';$('function-filter').value='all';$('method-filter').value='all';renderTerms();$('search').focus();}
if(hasTerms){
 $('search').addEventListener('input',e=>{state.query=e.target.value;renderTerms();});document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;renderTerms();}));
 $('clear-search').addEventListener('click',clearFilters);$('reset-filters').addEventListener('click',clearFilters);$('function-filter').addEventListener('change',e=>{state.functionFilter=e.target.value;renderTerms();});
 $('method-filter').addEventListener('change',e=>{state.methodFilter=e.target.value;renderTerms();});
 $('term-grid').addEventListener('click',e=>{const b=e.target.closest('[data-term]');if(b)openTerm(b.dataset.term,b);});
}
$('dialog-back').addEventListener('click',backDetail);
$('close-dialog').addEventListener('click',()=>closeTerm());
$('term-dialog').addEventListener('click',e=>{if(e.target===$('term-dialog')){const r=$('term-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeTerm();}});
$('term-dialog').addEventListener('cancel',e=>{e.preventDefault();closeTerm();});
$('term-dialog').addEventListener('close',()=>{window.DetailMechanisms?.clear();const target=dialogReturnTarget();if(target?.isConnected)target.focus({preventScroll:true});dialogNextFocus=null;});
$('dialog-content').addEventListener('click',e=>{
 const method=e.target.closest('[data-method]');if(method){openMethod(method.dataset.method);return;}
 const term=e.target.closest('[data-term]');if(term){openTerm(term.dataset.term);return;}
 const b=e.target.closest('[data-experiment]');if(b){visitExperiment(b.dataset.experiment);return;}
 const relatedMethod=e.target.closest('[data-related-method]');if(relatedMethod){visitRelatedTerms('method',relatedMethod.dataset.relatedMethod);return;}
 const related=e.target.closest('[data-related-function]');if(related)visitRelatedTerms('function',related.dataset.relatedFunction);
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-method]');if(b&&!b.closest('#dialog-content'))openMethod(b.dataset.method,b);});
document.addEventListener('click',e=>{const b=e.target.closest('[data-function]');if(b){openFunction(b.dataset.function,b);const directory=document.querySelector('.mobile-directory');if(directory?.open)directory.open=false;}});
document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>visitExperiment({DTS:'dts',DVS:'dvs',DAS:'das',FBG:'fbg'}[b.dataset.topic])));
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable&&!$('term-dialog').open){e.preventDefault();if(hasTerms){$('terms').scrollIntoView({behavior:'auto'});$('search').focus();}else visitPage('terms.html?focus=search');}});
function updateSectionNavigation(){
 document.querySelectorAll('.topnav a').forEach(a=>{const link=new URL(a.getAttribute('href'),window.location.href);const active=link.pathname.split('/').at(-1)===PAGE_FILES[pageId];a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
}
function syncHeaderLayout(){const header=document.querySelector('.topbar');if(header)document.documentElement.style.setProperty('--header-height',Math.ceil(header.getBoundingClientRect().height)+'px');}
window.addEventListener('resize',syncHeaderLayout);const header=document.querySelector('.topbar');if(header)new ResizeObserver(syncHeaderLayout).observe(header);syncHeaderLayout();updateSectionNavigation();
if(hasTerms){
 const functionFilter=pageParams.get('function'),methodFilter=pageParams.get('method'),category=pageParams.get('filter');
 if(Object.hasOwn(FUNCTION_BY_ID,functionFilter))state.functionFilter=functionFilter;
 if(Object.hasOwn(METHOD_BY_ID,methodFilter))state.methodFilter=methodFilter;
 if(category==='all'||Object.hasOwn(CATEGORY,category))state.filter=category;
 state.query=pageParams.get('q')||'';$('function-filter').value=state.functionFilter;$('method-filter').value=state.methodFilter;$('search').value=state.query;renderTerms();
 if(state.functionFilter!=='all'||state.methodFilter!=='all'||state.filter!=='all'){
  const options=document.querySelector('.dictionary-options');if(options)options.open=true;
 }
 if(pageParams.get('focus')==='search')$('search').focus({preventScroll:true});
}
if(hasLab){
 reducedMotion.addEventListener('change',e=>{if(e.matches){state.paused=true;updateControls();draw();}});
 const savedMode=restoreLabSession();if(reducedMotion.matches)state.paused=true;
 initLabControls();const requestedMode=pageParams.get('mode');selectMode(Object.hasOwn(MODES,requestedMode)?requestedMode:savedMode||'echo',{initial:true});
}
detailNavigation=createFiberDetailNavigation({
 readScroll:()=>$('term-dialog').scrollTop,
 restore(type,id,chain){restoringDetail=true;dialogHistory=chain.slice(0,-1);try{if(type==='function')openFunction(id);else if(type==='method')openMethod(id);else openTerm(id);$('term-dialog').scrollTop=chain.at(-1)?.scroll||0;}finally{restoringDetail=false;}},
 dismiss(){dialogHistory=[];dialogCurrent=null;closeTerm();}
});
detailNavigation.start();
$('copy-detail-link')?.addEventListener('click',async()=>{
 const status=$('detail-share-status'),url=window.location.href;
 try{await navigator.clipboard.writeText(url);status.textContent='链接已复制';}catch{status.textContent='复制下方链接';$('detail-share-url').hidden=false;$('detail-share-url').value=url;$('detail-share-url').select();}
});
const restoredChain=window.history?.state?.fiberDetail?.chain;
if(restoredChain?.length){dialogHistory=restoredChain.slice(0,-1);restoringDetail=true;}
if(pageParams.has('term'))openTerm(pageParams.get('term'));
else if(pageParams.has('functionDetail'))openFunction(pageParams.get('functionDetail'));
else if(pageParams.has('methodDetail'))openMethod(pageParams.get('methodDetail'));
restoringDetail=false;
if(restoredChain?.length)$('term-dialog').scrollTop=restoredChain.at(-1).scroll||0;
if(document.modelContext?.registerTool){
 if(typeof hasLab==='undefined'||hasLab){
 const controller=new AbortController();const tool={name:'configure_fiber_experiment',title:'配置光纤原理实验',description:'按测量功能切换十个原理示意，调整沿线位置或当前实验参数，同时更新可见图示。',inputSchema:{type:'object',properties:{mode:{type:'string',enum:Object.keys(MODES)},position:{type:'number',minimum:50,maximum:950},strength:{type:'number',minimum:-100,maximum:120}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['mode','position','strength'].includes(k))||typeof input.mode!=='string'||!Object.hasOwn(MODES,input.mode))throw new Error('请选择有效实验。');
  if(input.position!==undefined&&(!Number.isFinite(input.position)||input.position<50||input.position>950))throw new Error('位置必须在 50 至 950 米之间。');
  if(input.strength!==undefined&&(!Number.isFinite(input.strength)||input.strength<(MODES[input.mode].min??0)||input.strength>(MODES[input.mode].max??0)))throw new Error('参数不在当前实验范围内。');
  selectMode(input.mode,{reset:true,position:state.position});if(input.position!==undefined)state.position=LabMath.snap(input.position,50,950,10);if(input.strength!==undefined)state.strength=LabMath.snap(input.strength,MODES[input.mode].min??0,MODES[input.mode].max??0,MODES[input.mode].step??1);$('strength').value=state.strength;updateControls();draw();return{mode:state.mode,position_m:state.position,strength:state.strength,result:$('result-label').textContent+'：'+$('result-value').textContent};
 }};try{Promise.resolve(document.modelContext.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>controller.abort(),{once:true});
 }
}
