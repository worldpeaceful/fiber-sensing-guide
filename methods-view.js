'use strict';
function methodLinks(ids){return `<div class="related-links method-links">${ids.map(id=>`<button type="button" data-method="${id}">${esc(METHOD_BY_ID[id].title)}</button>`).join('')}</div>`;}
function renderMethods(){
 if($('method-grid'))$('method-grid').innerHTML=METHODS.map(m=>`<button type="button" id="method-${m.id}" class="guide-card method-card ${m.color}" data-method="${m.id}"><span class="function-label">${esc(m.title)}</span>${methodIllustration(m.id)}<h3 class="card-prompt">${esc(m.question)}</h3><span class="card-foot"><b>看看测量过程 →</b></span></button>`).join('');
 if($('method-filter'))$('method-filter').innerHTML='<option value="all">全部方法</option>'+METHODS.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('');
}
function openMethod(id,trigger){
 if(!Object.hasOwn(METHOD_BY_ID,id))return;
 const m=METHOD_BY_ID[id];
 recordDetail('method',id);
 $('dialog-category').textContent='按测试方法 · '+m.title;
 $('dialog-content').innerHTML=`<h2 id="dialog-title">${esc(m.title)}</h2><p class="detail-intro">${esc(m.one)}</p><div class="analogy">${esc(m.analogy)}</div>
 ${renderDetailIllustration('method',m)}
 <section class="detail-section"><h3>一步步看：它是怎么测的？</h3><p>${esc(m.principle)}</p><div class="readout-note"><strong>仪器实际读什么？</strong><p>${esc(m.readout)}</p></div></section>
 <section class="detail-section"><h3>典型技术与测量方法</h3><div class="technology-list">${m.technologies.map(t=>`<div class="technology-item"><strong>${esc(t.name)}</strong><p>${esc(t.copy)}</p></div>`).join('')}</div></section>
 <section class="detail-section"><h3>可以服务哪些测量功能？</h3><div class="function-tags">${m.functionIds.map(id=>`<button type="button" data-function="${id}">${esc(FUNCTION_BY_ID[id].title)}</button>`).join('')}</div></section>
 <section class="detail-section"><h3>容易混淆的地方</h3><p class="detail-warning">${esc(m.care)}</p></section>
 <section class="detail-section"><h3>动手观察 · 每个实验演示到哪一步？</h3><div class="method-experiments">${m.experiments.map(e=>`<div class="technology-item"><button type="button" class="button primary" data-experiment="${e.mode}">${esc(e.label)} →</button><p>${esc(e.scope)}</p></div>`).join('')}</div></section>
 <section class="detail-section"><h3>相关术语</h3><div class="related-links">${m.termIds.map(id=>`<button type="button" data-term="${id}">${esc(TERMS.find(t=>t.id===id).name)}</button>`).join('')}<button type="button" data-related-method="${m.id}">查看这一方法的全部词条 →</button></div></section>${sourceLinks(m.sources)}`;
 showDialog(trigger);
}
