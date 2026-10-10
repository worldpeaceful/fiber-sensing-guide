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
 pressure:{title:'压力，怎么变成光的变化？',copy:'这里演示一种膜片传力的光栅探头。压力让膜片变形，传力结构使光栅伸缩，反射波长随之改变。比例仅为示意，压力读数还需要封装与标定。',caption:'先由结构传力，再用光读出变化。',hint:'增加压力，看膜片形变与光栅响应一起增加。',svg:'膜片传力与光栅压力响应',label:'相对压力',min:0,max:100,default:45,unit:'%'},
 shape:{title:'弯曲，怎么拼出形状？',copy:'这里用两侧纤芯作平面弯曲示意：弯曲时一侧伸长、另一侧压短。比较应变差，可估算曲率；真实三维重建需要更多纤芯、方向和参考信息。',caption:'不同纤芯的应变差，提供弯曲线索。',hint:'向两个方向弯曲，观察两条应变曲线交换方向。',svg:'多芯光纤弯曲与应变差',label:'相对弯曲',min:-100,max:100,default:40,unit:'%',animated:false},
 fog:{title:'光纤陀螺，怎么知道在转？',copy:'两束光沿同一光纤环反向传播。转动产生萨格纳克相位差，其方向与角速度相关。这里放大相位响应，只表示趋势，不模拟真实光速或仪器精度。',caption:'转动方向变，相位差也反向。',hint:'从负值滑到正值，比较相位差的符号。',svg:'反向传播光与萨格纳克相位差',label:'相对角速度',min:-100,max:100,default:40,unit:'%'},
 chemical:{title:'酸碱度，怎么让光作回答？',copy:'以一种随 pH 升高而增强荧光的理想敏感探针为例。这里采用参考 pKa 为 7 的简化响应，显示相对强度；其他探针可能有不同甚至相反的趋势。',caption:'敏感材料负责响应，光纤负责传光或读出。',hint:'改变 pH，观察敏感层的示意荧光。',svg:'pH 敏感材料与归一化荧光响应',label:'溶液 pH（示意）',min:0,max:14,step:.1,default:7,unit:'',animated:false},
 current:{title:'电流，怎么转动光学指针？',copy:'电流产生磁场。专门的传感路径利用法拉第效应读取偏振变化，再经过校准得到电流。这里的旋转角度采用任意示意比例。',caption:'电流反向，示意偏振旋转也反向。',hint:'改变电流方向，观察偏振相对参考线的旋转。',svg:'电流引起的法拉第偏振旋转',label:'相对电流',min:-100,max:100,default:50,unit:'%',animated:false}
});
Object.assign(MODES.fbg, {min:-100,label:'相对伸缩（示意）',animated:false,title:'光栅，怎么感知伸缩？',copy:'光栅像一块挑“颜色”的小镜子。温度保持不变：拉长让反射峰向长波移动，压短让它向短波移动。',caption:'伸缩反向，反射峰移动方向也反向。',hint:'先选压短，再选拉长，比较间距与反射峰。'});
MODES.dts.animated=false; MODES.pressure.animated=false;
function renderDirectory(){
 renderMethods();
 const nav=FUNCTIONS.map(f=>`<button data-function="${f.id}">${esc(f.title)}<span aria-hidden="true">${esc(f.symbol)}</span></button>`).join('');
 $('function-nav').innerHTML=nav;$('mobile-functions').innerHTML=nav;
 $('function-grid').innerHTML=FUNCTIONS.map(f=>`<button class="guide-card ${f.color}" data-function="${f.id}"><span class="function-label">${esc(f.title)}</span><span class="card-icon" aria-hidden="true">${esc(f.symbol)}</span><h3>${esc(f.question)}</h3><p>${esc(f.one)}</p><span class="card-foot">${esc(f.technologies.map(t=>t.name).join(' · '))}<br><b>看看怎么测 →</b></span></button>`).join('');
 $('function-filter').innerHTML='<option value="all">全部功能</option>'+FUNCTIONS.map(f=>`<option value="${f.id}">${esc(f.title)}</option>`).join('');
 $('lab-tabs').innerHTML=EXPERIMENT_GROUPS.map(g=>`<div class="experiment-group" role="presentation"><span aria-hidden="true">${esc(g.name)}</span>${g.modes.map(([id,name])=>`<button role="tab" aria-selected="false" tabindex="-1" data-mode="${id}" id="tab-${id}" aria-controls="lab-panel">${esc(name)}</button>`).join('')}</div>`).join('');
}
renderDirectory();
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const state={mode:'echo',position:600,strength:0,paused:reducedMotion.matches,time:1.2,filter:'all',functionFilter:'all',methodFilter:'all',query:'',reference:null,speed:1};
let lastFrame=0,dirty=true;
const compactLab=window.matchMedia('(max-width:720px)');
function updateLabPicker(){
 const picker=$('lab-picker'),focused=picker.contains(document.activeElement);
 picker.open=!compactLab.matches;
 if(focused)(compactLab.matches?picker.querySelector('summary'):$('tab-'+state.mode)).focus({preventScroll:true});
}
compactLab.addEventListener('change',updateLabPicker);updateLabPicker();
function experimentFocusTarget(){return $('lab-picker').open?$('tab-'+state.mode):$('lab-picker').querySelector('summary');}
function renderTerms(){
 const terms=filterFiberTerms(TERMS,state);
 $('term-grid').innerHTML=terms.map(t=>`<button class="term-card" data-term="${t.id}" aria-label="阅读 ${esc(t.name)} 的解释"><span class="term-type">${CATEGORY[t.cat]}</span><h3>${esc(t.name)}</h3><span class="term-en">${esc(t.en)}</span><p>${esc(t.one)}</p><div class="function-tags">${t.functionIds.slice(0,3).map(id=>`<span>${esc(FUNCTION_BY_ID[id].short)}</span>`).join('')}${t.functionIds.length>3?'<span>多功能通用</span>':''}</div>${t.methodIds.length?`<div class="function-tags method-tags">${t.methodIds.slice(0,2).map(id=>`<span>${esc(METHOD_BY_ID[id].title)}</span>`).join('')}${t.methodIds.length>2?'<span>多方法关联</span>':''}</div>`:''}</button>`).join('');
 $('term-count').textContent=`${terms.length} / ${TERMS.length} 个术语`;$('empty').hidden=terms.length!==0;
 document.querySelectorAll('[data-filter]').forEach(b=>{const yes=b.dataset.filter===state.filter;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
}
let dialogTrigger=null,dialogNextFocus=null,dialogCurrent=null,dialogHistory=[],restoringDetail=false;
function recordDetail(type,id){
 if(!restoringDetail){
  if(!$('term-dialog').open)dialogHistory=[];
  else if(dialogCurrent&&(dialogCurrent.type!==type||dialogCurrent.id!==id))dialogHistory.push({...dialogCurrent,scroll:$('term-dialog').scrollTop});
 }
 dialogCurrent={type,id};$('dialog-back').hidden=dialogHistory.length===0;
}
function backDetail(){
 const previous=dialogHistory.pop();if(!previous)return;
 restoringDetail=true;
 try{if(previous.type==='function')openFunction(previous.id);else if(previous.type==='method')openMethod(previous.id);else openTerm(previous.id);}finally{restoringDetail=false;}
 $('term-dialog').scrollTop=previous.scroll;
 (dialogHistory.length?$('dialog-back'):$('close-dialog')).focus({preventScroll:true});
}
function showDialog(trigger){if(!$('term-dialog').open){dialogTrigger=trigger||document.activeElement;$('term-dialog').showModal();}$('term-dialog').scrollTop=0;$('close-dialog').focus();}
function sourceLinks(keys){return `<div class="detail-source">原理资料 ${keys.map(k=>`<a href="${SOURCES[k].url}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].name)}</a>`).join('')}</div>`;}
function openFunction(id,trigger){
 const f=FUNCTION_BY_ID[id];if(!f)return;
 recordDetail('function',id);
 $('dialog-category').textContent='按测量对象 · '+f.title;
 $('dialog-content').innerHTML=`<h2 id="dialog-title">${esc(f.question)}</h2><p>${esc(f.one)}</p><div class="analogy">${esc(f.analogy)}</div><figure class="function-diagram"><svg viewBox="0 0 300 232" role="img" aria-label="${esc(f.title+'原理流程图')}">${f.diagram.map((label,i)=>`<rect x="12" y="${10+i*78}" width="276" height="54" rx="10" fill="${i===2?'#e0e9ff':'white'}" stroke="#b9cbed"/><text x="150" y="${43+i*78}" text-anchor="middle" fill="#365889" font-size="16">${esc(label)}</text>${i<2?`<path d="M150 ${68+i*78}v12m-4-4 4 4 4-4" stroke="#8ca6d5" fill="none" stroke-width="2"/>`:''}`).join('')}</svg><figcaption>过程示意 · 具体光路与读出方式随技术方案而变化。</figcaption></figure><h3>光，是怎样读出变化的？</h3><p>${esc(f.principle)}</p><h3>同一功能，可以有哪些方案？</h3><div class="technology-list">${f.technologies.map(t=>`<div class="technology-item"><div class="technology-heading"><strong>${esc(t.name)}</strong><span class="layout-tag">${esc(t.layout)}</span></div><p>${esc(t.copy)}</p><div class="related-links">${t.terms.map(id=>`<button data-term="${id}">${esc(TERMS.find(t=>t.id===id).name)}</button>`).join('')}</div></div>`).join('')}</div><h3>关联的测试方法</h3>${methodLinks(f.methodIds)}<h3>在哪里用得上？</h3><ul>${f.applications.map(a=>`<li>${esc(a)}</li>`).join('')}</ul><h3>容易混淆的地方</h3><p class="detail-warning">${esc(f.care)}</p><h3>动手观察</h3><div class="experiment-links">${f.experiments.map(mode=>`<button class="button primary" data-experiment="${mode}">${esc(MODES[mode].title)}</button>`).join('')}</div><h3>相关术语</h3><div class="related-links">${f.termIds.map(id=>`<button data-term="${id}">${esc(TERMS.find(t=>t.id===id).name)}</button>`).join('')}<button data-related-function="${f.id}">查看这一功能的全部词条 →</button></div>${sourceLinks(f.sources)}`;
 showDialog(trigger);
}

function openTerm(id,trigger){
 const t=TERMS.find(t=>t.id===id);if(!t)return;
 recordDetail('term',id);
 $('dialog-category').textContent=CATEGORY[t.cat];
 $('dialog-content').innerHTML=`<h2 id="dialog-title">${esc(t.name)}</h2><div class="term-en">${esc(t.en)}</div><div class="analogy">${esc(t.analogy)}</div><h3>它是怎么回事？</h3><p>${esc(t.principle)}</p><h3>会在哪里遇到它？</h3><p>${esc(t.example)}</p><h3>容易混淆的地方</h3><p class="detail-warning">${esc(t.care)}</p>${sourceLinks(t.sources)}${t.methodIds.length?`<h3>关联的测试方法</h3>${methodLinks(t.methodIds)}`:''}<h3>关联的测量功能</h3><div class="function-tags">${t.functionIds.map(id=>`<button data-function="${id}">${esc(FUNCTION_BY_ID[id].title)}</button>`).join('')}</div>${t.experiment?`<button class="button primary" data-experiment="${t.experiment}">动手看看这个原理</button>`:''}`;
 showDialog(trigger);
}
function dialogReturnTarget(){let target=dialogNextFocus||dialogTrigger;const directory=target?.closest('.mobile-directory');if(directory&&!directory.open)target=directory.querySelector('summary');const picker=target?.closest('.lab-picker');if(picker&&!picker.open)target=picker.querySelector('summary');return target;}
function closeTerm(nextFocus){dialogNextFocus=nextFocus||null;if($('term-dialog').open){$('term-dialog').close();const target=dialogReturnTarget();if(target?.isConnected)target.focus({preventScroll:true});}}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{selectMode(b.dataset.mode);if(compactLab.matches){$('lab-picker').open=false;experimentFocusTarget().focus({preventScroll:true});}}));
document.querySelector('.lab-tabs').addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-mode]')];let i=tabs.indexOf(document.activeElement);if(i<0)return;if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectMode(tabs[i].dataset.mode);tabs[i].focus();}});
$('search').addEventListener('input',e=>{state.query=e.target.value;renderTerms();});document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;renderTerms();}));
function clearFilters(){state.filter='all';state.functionFilter='all';state.methodFilter='all';state.query='';$('search').value='';$('function-filter').value='all';$('method-filter').value='all';renderTerms();$('search').focus();}
$('clear-search').addEventListener('click',clearFilters);$('reset-filters').addEventListener('click',clearFilters);$('function-filter').addEventListener('change',e=>{state.functionFilter=e.target.value;renderTerms();});
$('method-filter').addEventListener('change',e=>{state.methodFilter=e.target.value;renderTerms();});
$('dialog-back').addEventListener('click',backDetail);
$('term-grid').addEventListener('click',e=>{const b=e.target.closest('[data-term]');if(b)openTerm(b.dataset.term,b);});$('close-dialog').addEventListener('click',()=>closeTerm());
$('term-dialog').addEventListener('click',e=>{if(e.target===$('term-dialog')){const r=$('term-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeTerm();}});
$('term-dialog').addEventListener('cancel',e=>{e.preventDefault();closeTerm();});
$('term-dialog').addEventListener('close',()=>{const target=dialogReturnTarget();if(target?.isConnected)target.focus({preventScroll:true});dialogNextFocus=null;});
$('dialog-content').addEventListener('click',e=>{
 const method=e.target.closest('[data-method]');if(method){openMethod(method.dataset.method);return;}
 const term=e.target.closest('[data-term]');if(term){openTerm(term.dataset.term);return;}
 const b=e.target.closest('[data-experiment]');if(b){selectMode(b.dataset.experiment);closeTerm($('tab-'+state.mode));$('lab').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'});return;}
 const relatedMethod=e.target.closest('[data-related-method]');if(relatedMethod){state.methodFilter=relatedMethod.dataset.relatedMethod;state.functionFilter='all';state.filter='all';state.query='';$('method-filter').value=state.methodFilter;$('function-filter').value='all';$('search').value='';renderTerms();closeTerm($('method-filter'));$('terms').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'});return;}
 const related=e.target.closest('[data-related-function]');if(related){state.functionFilter=related.dataset.relatedFunction;state.methodFilter='all';state.filter='all';state.query='';$('method-filter').value='all';$('function-filter').value=state.functionFilter;$('search').value='';renderTerms();closeTerm($('function-filter'));$('terms').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'});}
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-method]');if(b&&!b.closest('#dialog-content'))openMethod(b.dataset.method,b);});
document.addEventListener('click',e=>{const b=e.target.closest('[data-function]');if(b){openFunction(b.dataset.function,b);const directory=document.querySelector('.mobile-directory');if(directory.open)directory.open=false;}});
document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{selectMode({DTS:'dts',DVS:'dvs',DAS:'das',FBG:'fbg'}[b.dataset.topic]);$('lab').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth'});experimentFocusTarget().focus({preventScroll:true});}));
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('term-dialog').open){e.preventDefault();$('terms').scrollIntoView({behavior:'auto'});$('search').focus();}});
let navigationFrame=0;
function updateSectionNavigation(){
 const sections=[...document.querySelectorAll('main>section')];
 const threshold=document.querySelector('.topbar').getBoundingClientRect().height+80;
 const current=sections.filter(s=>s.getBoundingClientRect().top<=threshold).at(-1)||sections[0];
 document.querySelectorAll('.side-link,.topnav a,.mobile-directory nav a').forEach(a=>{const active=a.getAttribute('href')==='#'+current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
}
window.addEventListener('scroll',()=>{if(!navigationFrame)navigationFrame=requestAnimationFrame(()=>{navigationFrame=0;updateSectionNavigation();});},{passive:true});
function syncHeaderLayout(){document.documentElement.style.setProperty('--header-height',Math.ceil(document.querySelector('.topbar').getBoundingClientRect().height)+'px');updateSectionNavigation();}
window.addEventListener('resize',syncHeaderLayout);new ResizeObserver(syncHeaderLayout).observe(document.querySelector('.topbar'));syncHeaderLayout();
reducedMotion.addEventListener('change',e=>{if(e.matches){state.paused=true;updateControls();}});initLabControls();renderTerms();selectMode('echo');
if(document.modelContext?.registerTool){
 const controller=new AbortController();const tool={name:'configure_fiber_experiment',title:'配置光纤原理实验',description:'按测量功能切换十个原理示意，调整沿线位置或当前实验参数，同时更新可见图示。',inputSchema:{type:'object',properties:{mode:{type:'string',enum:Object.keys(MODES)},position:{type:'number',minimum:50,maximum:950},strength:{type:'number',minimum:-100,maximum:120}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['mode','position','strength'].includes(k))||typeof input.mode!=='string'||!Object.hasOwn(MODES,input.mode))throw new Error('请选择有效实验。');
  if(input.position!==undefined&&(!Number.isFinite(input.position)||input.position<50||input.position>950))throw new Error('位置必须在 50 至 950 米之间。');
  if(input.strength!==undefined&&(!Number.isFinite(input.strength)||input.strength<(MODES[input.mode].min??0)||input.strength>(MODES[input.mode].max??0)))throw new Error('参数不在当前实验范围内。');
  selectMode(input.mode,{reset:true,position:state.position});if(input.position!==undefined)state.position=LabMath.snap(input.position,50,950,10);if(input.strength!==undefined)state.strength=LabMath.snap(input.strength,MODES[input.mode].min??0,MODES[input.mode].max??0,MODES[input.mode].step??1);$('strength').value=state.strength;updateControls();draw();return{mode:state.mode,position_m:state.position,strength:state.strength,result:$('result-label').textContent+'：'+$('result-value').textContent};
 }};try{Promise.resolve(document.modelContext.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
