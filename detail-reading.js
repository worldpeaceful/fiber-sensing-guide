'use strict';
function prepareFiberDetailReading(kind,id,markup){
 const record=kind==='function'?FUNCTION_BY_ID[id]:kind==='method'?METHOD_BY_ID[id]:TERMS.find(t=>t.id===id);
 const experiments=kind==='method'?record.experiments.slice(0,1).map(e=>({mode:e.mode,label:e.label,scope:e.scope})):kind==='function'?record.experiments.map(mode=>({mode,label:MODES[mode].title})):record.experiment?[{mode:record.experiment,label:'动手看看这个原理'}]:[];
 const entry=experiments.length?`<div class="detail-quick-experiment" aria-label="动手观察">${experiments.map(e=>`<button type="button" class="button primary" data-experiment="${esc(e.mode)}">${esc(e.label)}</button>${e.scope?`<p class="detail-quick-scope">${esc(e.scope)}</p>`:''}`).join('')}</div>`:'';
 // Keep the explanation visible; schemes, applications and references remain expandable.
 let first=true;
 markup=markup.replace(/<section class="detail-section"><h3>([^<]+)<\/h3>([\s\S]*?)<\/section>/g,(section,title,body)=>{
  if(first||title==='容易混淆的地方'){first=false;return section;}
  return `<details class="detail-section detail-more"><summary>${title}</summary><div class="detail-more-body">${body}</div></details>`;
 });
 const introEnd=markup.indexOf('</p>');
 if(introEnd>=0)markup=markup.slice(0,introEnd+4)+entry+markup.slice(introEnd+4);
 else markup=markup.replace('<div class="analogy">',entry+'<div class="analogy">');
 return markup;
}
