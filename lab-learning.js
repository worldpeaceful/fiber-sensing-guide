'use strict';
// 读图与比较层只消费既有实验状态，不改模型、存储或动画时间。
(function(root){
  const byId=id=>document.getElementById(id);
  const near=(a,b)=>Math.abs(a-b)<1e-12;
  const signed=(n,d=2)=>(n>0?'+':'')+(near(n,0)?0:n).toFixed(d);
  const delta=(n,d=2)=>Math.abs(n)>0&&Math.abs(n)<10**-d?n.toExponential(2):signed(n,d);
  const direction=n=>n>0?'向上弯曲':n<0?'向下弯曲':'直线参考';
  function compare(mode,position,strength,reference){
    if(!reference)return null;
    const p=position,s=strength,r=reference,dp=p-r.position,ds=s-r.strength;
    const located=['echo','dts','dvs','das'].includes(mode),sameStrength=mode==='echo'||near(ds,0);
    if((!located||near(dp,0))&&sameStrength)return {title:'当前参数与记录相同',copy:['dvs','das'].includes(mode)?'参考与当前使用同一动画时刻，两者重合。播放中的瞬时变化不代表参数发生了变化。':'当前与记录的模型响应相同。改变参数后，可以继续比较变化。'};
    const moved=dp?`观察位置从 ${r.position} m 移到 ${p} m。`:'';
    const sFromTo=(unit='%',digits=0)=>`${r.strength.toFixed(digits)}${unit} → ${s.toFixed(digits)}${unit}`;
    if(mode==='echo')return {title:dp>0?'位置更远，回波返回更晚':'位置更近，回波返回更早',copy:`${moved}往返时间变化 ${delta(LabMath.roundTrip(p)-LabMath.roundTrip(r.position))} μs；回波峰随之向${dp>0?'右':'左'}移动。光要经过一次去程和一次回程。`};
    if(mode==='dts')return {title:ds?`相对记录，温度${ds>0?'升高':'降低'}，回波比值${ds>0?'增大':'减小'}`:s===20?'局部与背景同温，温度曲线仍然平直':'温度不变，局部区域的位置改变',copy:`${moved}${ds?`局部温度 ${sFromTo(' °C')}，相对回波比值变化 ${delta(LabMath.ramanRatio(s)-LabMath.ramanRatio(r.strength),3)}。`:s===20?'两种状态的温度均为20 °C，比值均为1。':'两种状态的设定温度与回波比值相同，曲线的局部区域随位置移动。'}`};
    if(mode==='fbg')return {title:`相对记录，反射峰向${ds>0?'长':'短'}波方向移动`,copy:`相对伸缩 ${sFromTo()}，峰偏移变化 ${delta(LabMath.normalized(ds))}（示意单位）。当前${s>0?'为拉长状态':s<0?'为压短状态':'回到不伸缩参考'}；温度保持固定。`};
    if(mode==='dvs'){
      const bothZero=s===0&&r.strength===0;
      return {title:bothZero?'两种状态都无扰动，差异仍为零':s===0?'当前扰动归零，与有扰动的记录仍有差异':r.strength===0?'从无扰动变为有扰动':dp?'扰动位置改变，差异分布随之改变':'扰动强度改变，局部回波随之改变',copy:`${moved}${ds?`扰动强度 ${sFromTo()}。`:''}${bothZero?'观察位置的改变不会凭空产生扰动。':'下图逐点计算同一时刻的 |当前回波 − 记录回波|。差异的位置和形状要结合两条回波看，不能只按参数大小判断差异峰高。'}`};
    }
    if(mode==='das')return {title:ds?`相位摆幅${ds>0?'增大':'减小'}，周期保持不变`:'观察位置改变，模型中的相位摆幅不变',copy:`${moved}${ds?`伸缩幅度 ${sFromTo()}，摆幅从 ±${LabMath.phaseLimit(r.strength).toFixed(2)} 变为 ±${LabMath.phaseLimit(s).toFixed(2)} rad。`:'本图对所选位置使用同一相位函数。'}参考波形与当前波形对齐同一动画时刻；瞬时值为零不表示摆幅为零。`};
    if(mode==='pressure')return {title:ds>0?'膜片更向下凹，光学腔缩短':'膜片回升，光学腔增大',copy:`相对压力 ${sFromTo()}，归一化形变变化 ${delta(LabMath.normalized(ds))}。光纤端面固定，腔长随膜片与端面的间距改变。`};
    if(mode==='shape')return {title:s===0?'试件回到直线，两侧应变归零':s*r.strength<0?'弯曲反向，两侧纤芯的应变交换':`弯曲${Math.abs(s)>Math.abs(r.strength)?'增大':'减小'}，两侧应变相应变化`,copy:`相对弯曲 ${sFromTo()}，当前为${direction(s)}。沿线中点的纤芯A应变从 ${signed(LabMath.shapeStrain(.5,r.strength))} 变为 ${signed(LabMath.shapeStrain(.5,s))}（归一化）；纤芯B符号相反。`};
    if(mode==='fog')return {title:s===0?'转台静止，示意相位差归零':s*r.strength<0?'转动反向，示意相位差反号':`相对记录，相位差向${ds>0?'正':'负'}方向变化`,copy:`相对角速度 ${sFromTo()}，相位差变化 ${delta(LabMath.phaseLimit(ds))} rad。环内光点始终反向传播；光的传播与转台转动是两件事。`};
    if(mode==='chemical'){
      const difference=LabMath.fluorescence(s)-LabMath.fluorescence(r.strength);
      return {title:Math.abs(difference)<.001?'两种状态接近曲线端部，荧光变化很小':`相对记录，荧光${ds>0?'增强':'减弱'}`,copy:`pH ${sFromTo('',1)}，相对荧光变化 ${delta(difference,3)}。本探针参考pKa为7，响应呈S形；同样的pH改变量不一定带来相同的亮度变化。`};
    }
    if(mode==='current')return {title:s===0?'电流归零，偏振回到参考方向':s*r.strength<0?'电流反向，偏振旋转也反向':`相对记录，偏振向${ds>0?'正':'负'}方向旋转`,copy:`相对电流 ${sFromTo()}，示意偏振角变化 ${delta(LabMath.rotation(ds),1)}°。比较的是相对零电流参考的旋转，不对应实际安培值。`};
    return null;
  }
  // 原生按钮在图外，实体只加交互属性与描边，不增加虚构零件或标线。
  const part=prefix=>`[data-bench-part^="${prefix}"]`;
  const inspections={
    echo:[['被测光纤',part('fiber.sample'),'光沿同一根光纤去程和回程。图上的光纤长度按比例缩短，动画也已放慢。'],['观察窗',part('cursor.'),'这个游标标记所选的沿线观察位置，并不是光纤上额外安装的反射器。拖动位置时，游标和回波时间一起改变。'],['回波峰','[data-plot-current],[data-plot-dot]','峰的横向位置表示往返时间。距离越远，光往返越久，峰就越靠右。']],
    dts:[['局部热台',part('cursor.'),'热台表示所选位置的局部温度。移动位置只移动局部区域，温度由另一滑块独立设置。'],['被测光纤',part('optic.sample'),'沿线温度由拉曼回波的两路相对比例读取。光纤与热台直径放大，不代表真实装置尺寸。'],['两路回波','[data-seven-bar-a],[data-seven-bar-b]','柱形比较anti-Stokes与Stokes的相对比例。Stokes归一化为1；本模型在20 °C时两柱一样高。']],
    dvs:[['激振头',part('cursor.'),'激振头的位置和窗口图示表示扰动设在哪里、强度多大。它们不等同于声压或加速度读数。'],['被测光纤',part('optic.sample'),'扰动影响局部回波。观察上方当前光强与参考光强，再看下方逐点差异。'],['差异曲线','[data-seven-plot-second]','这条线是同一时刻两条回波差值的绝对值。无记录时参考为无扰动；有记录时使用记录参数。']],
    das:[['被测光纤',part('optic.sample'),'被测段上的动态伸缩通过相位差表示。相位读数需要标定后才能换算为真实应变。'],['相位指针',part('phase.case')+','+part('phase.face')+','+part('phase.rim')+',[data-seven-needle]','指针显示此刻的相位差，右侧读数描述整个摆动范围。暂停后可与波形最右端对应起来看。'],['波形终点','[data-seven-plot-current],[data-seven-plot-dot]','实心点与仪表指针对应同一个时刻。幅度改变摆幅，不改变本模型的动画周期。']],
    fbg:[['光栅','[data-bench-fiber],[data-bench-grating]','规则条纹表示光栅。拉长会让条纹间距变疏，压短会变密；光纤直径和条纹间距已放大。'],['移动夹具',part('moving.'),'夹具带动光纤伸缩。正负参数分别表示拉长和压短，温度在本实验中保持固定。'],['反射峰','[data-plot-current],[data-plot-dot]','反射峰向长波或短波方向移动，峰高不随伸缩改变。这里使用归一化示意单位，不是nm或微应变。']],
    pressure:[['受压膜片',part('probe.membrane'),'压力增大，膜片向固定光纤端面靠近。膜片形变已放大，前侧为教学剖切。'],['光学腔',part('optic.end-face')+',[data-cavity-light]','光学腔是固定端面与膜片之间的间隙。膜片下凹时腔长缩短；本图不计算干涉光强。'],['形变读数','[data-plot-current],[data-plot-dot]','实心点和数值都用相对压力除以100表示归一化形变，不对应实际压力或尺寸标定。']],
    shape:[['柔性试件',part('bend.specimen'),'两端固定的柔性试件表示平面弯曲。形变被放大，正负参数使试件向相反方向弯曲。'],['两侧纤芯','[data-seven-core-a],[data-seven-core-b]','蓝色与紫色表示两侧纤芯。一侧伸长时另一侧压短；反向弯曲会交换应变符号。'],['应变曲线','[data-seven-plot-current],[data-seven-plot-other]','两条曲线来自同一弯曲模型，分别表示两侧纤芯的归一化应变，并非完整三维形状重建。']],
    fog:[['光纤环',part('coil.winding.'),'两束示意光沿同一光纤环反向传播。光点速度已放慢，不能当作真实光速。'],['转动标记',part('coil.hub-cap')+',[data-seven-turn]','中心标记演示相对角速度的方向。角速度不是转角；零转速时环内的光仍然传播。'],['相位差','[data-seven-plot-current],[data-seven-plot-other],[data-seven-plot-dot]','两路波形的相位关系随角速度改变。转动反向，相位差反号；静止时相位差为零。']],
    chemical:[['敏感尖端',part('probe.sensitive-tip')+',[data-seven-fluorescence]','探头尖端接触样品，绿色亮度表示理想探针的相对荧光响应。'],['样品',part('sample.'),'样品pH由滑块设定。当前模型以pKa=7为参考；不同材料可能有不同甚至相反的趋势。'],['荧光读数','[data-seven-plot-current],[data-seven-plot-dot]','响应呈S形：pH 7时为0.5，两端逐渐饱和。亮度和图中读数来自同一函数。']],
    current:[['电流导体',part('conductor.busbar')+',[data-seven-current]','导体穿过磁光传感光路。正负号表示相反的电流方向，箭头在零电流时隐藏。'],['磁光光路',part('sense.fiber.'),'这是专用磁光传感路径的教学示意。图中光路与导体直径被放大。'],['偏振方向',part('polarimeter.face')+','+part('polarimeter.rim')+',[data-seven-needle]','蓝线表示相对零电流参考的偏振旋转。输入反向，角度反号；比例只用于示意。']]
  };
  let active=null,selected=-1,initialized=false,compact=null;
  function updateSummary(o){
    const insight=compare(o.mode,o.position,o.strength,o.reference),box=byId('comparison-insight');
    if(byId('clear-comparison'))byId('clear-comparison').hidden=!o.reference;
    if(box){box.hidden=!insight;if(insight){byId('comparison-headline').textContent=insight.title;byId('comparison-explanation').textContent=insight.copy;}}
    if(byId('mobile-result-label')){byId('mobile-result-label').textContent=o.result[0];byId('mobile-result-value').textContent=o.result[1]+' '+o.result[2];}
  }
  function select(index,returnFocus=false){
    if(!active)return;
    const previous=selected;selected=index;const entries=inspections[active.mode];
    active.targets.forEach((els,i)=>els.forEach(el=>el.classList.toggle('is-inspected',i===index)));
    byId('inspect-buttons').querySelectorAll('button').forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===index));if(i===index)button.setAttribute('aria-describedby','inspect-copy');else button.removeAttribute('aria-describedby');});
    const panel=byId('inspect-explanation');panel.hidden=index<0;
    if(index>=0){byId('inspect-title').textContent=entries[index][0];byId('inspect-copy').textContent=entries[index][2];}
    if(returnFocus&&index<0)byId('inspect-buttons').querySelectorAll('button')[Math.max(0,previous)]?.focus({preventScroll:true});
  }
  function clearScene(){active=null;selected=-1;if(byId('apparatus-inspector'))byId('apparatus-inspector').hidden=true;}
  function syncScene(mode,host,plot){
    if(!byId('apparatus-inspector')||!inspections[mode])return;
    const token=host.children[0],plotToken=plot.getAttribute('viewBox');
    if(active?.token===token&&active.plotToken===plotToken&&active.mode===mode)return;
    const same=active?.mode===mode,previous=same?selected:-1;
    if(!same)byId('inspect-buttons').innerHTML=inspections[mode].map(([label],i)=>`<button type="button" data-inspect="${i}" aria-pressed="false" aria-controls="inspect-explanation">${label}</button>`).join('');
    const targets=inspections[mode].map(([,selector],i)=>{
      const els=[...host.querySelectorAll(selector),...plot.querySelectorAll(selector)];
      els.forEach(el=>el.setAttribute('data-learn-target',String(i)));return els;
    });
    active={mode,host,token,plotToken,targets};
    byId('apparatus-inspector').hidden=false;
    const notes=host.querySelector('[data-apparatus-notes]');if(notes)notes.open=!compact?.matches;
    select(previous);
  }
  function arrangeControls(){
    const inputs=byId('lab-parameter-inputs'),slot=byId('mobile-control-slot'),home=byId('parameter-home'),insight=byId('comparison-insight');
    if(!inputs||!slot||!home||typeof slot.appendChild!=='function')return;
    const actions=byId('lab-action-inputs'),animation=byId('animation-tools'),clear=byId('clear-comparison'),focused=document.activeElement,isInput=inputs.contains(focused),isInsight=insight?.contains(focused),isAction=actions?.contains(focused),isAnimation=animation?.contains(focused);
    if(compact.matches){slot.hidden=false;slot.insertBefore(inputs,slot.children[0]);byId('mobile-insight-slot').appendChild(insight);slot.insertBefore(actions,byId('mobile-insight-slot'));actions.appendChild(clear);slot.insertBefore(animation,slot.querySelector('.mobile-reading'));}
    else{home.appendChild(inputs);byId('lab-comparison').insertBefore(insight,byId('comparison-note'));byId('lab-results').insertBefore(actions,byId('lab-comparison'));byId('lab-comparison').querySelector('.comparison-heading').appendChild(clear);byId('static-note').parentElement.insertBefore(animation,byId('static-note'));slot.hidden=true;}
    if((isInput||isInsight||isAction||isAnimation)&&focused?.focus)focused.focus({preventScroll:true});
    const notes=byId('lab-apparatus').querySelector('[data-apparatus-notes]');if(notes)notes.open=!compact.matches;
  }
  function init(){
    if(initialized||!byId('apparatus-inspector'))return;initialized=true;
    compact=root.matchMedia('(max-width:720px)');compact.addEventListener('change',arrangeControls);arrangeControls();
    byId('inspect-buttons').addEventListener('click',event=>{const b=event.target.closest('[data-inspect]');if(b)select(Number(b.dataset.inspect)===selected?-1:Number(b.dataset.inspect));});
    byId('inspect-close').addEventListener('click',()=>select(-1,true));
    const pick=event=>{const target=event.target.closest('[data-learn-target]');if(target)select(Number(target.dataset.learnTarget));};
    byId('lab-apparatus').addEventListener('click',pick);byId('lab-svg').addEventListener('click',pick);
    byId('apparatus-inspector').addEventListener('keydown',event=>{if(event.key==='Escape'&&selected>=0){event.preventDefault();select(-1,true);}});
  }
  root.LabLearning=Object.freeze({compare,inspections,updateSummary,init,syncScene,clearScene,arrangeControls});
})(typeof window==='undefined'?globalThis:window);
