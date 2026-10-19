'use strict';
// One request per visited apparatus; cache geometry, never parameters or live DOM.
(function(root){
 const entries=new Map(),listeners=new Set();
 const scenes=root.LabAnatomyScenes||(root.LabAnatomyScenes={});
 const files=root.LabAnatomySceneFiles||{};
 const script=root.document.currentScript;
 const base=script?.src?new URL('.',script.src):new URL('anatomy/',root.location.href);
 function status(mode){return scenes[mode]?'ready':entries.get(mode)?.status||'idle';}
 function notify(mode){for(const listener of listeners)listener(mode);}
 function load(mode,{retry=false}={}){
  if(!Object.hasOwn(files,mode))return Promise.resolve(null);
  if(scenes[mode])return Promise.resolve(scenes[mode]);
  const previous=entries.get(mode);
  if(previous?.status==='loading')return previous.promise;
  if(previous?.status==='error'&&!retry)return previous.promise;
  const entry={status:'loading',promise:null};entries.set(mode,entry);
  entry.promise=new Promise(resolve=>{
   const tag=root.document.createElement('script');let settled=false;
   const finish=ok=>{
    if(settled)return;settled=true;clearTimeout(timer);
    tag.onload=tag.onerror=null;tag.remove();
    const scene=scenes[mode];
    const valid=ok&&scene&&typeof scene.svg==='string'&&scene.P&&scene.parts>0;
    if(!valid)delete scenes[mode];
    entry.status=valid?'ready':'error';resolve(valid?scene:null);notify(mode);
   };
   tag.src=new URL(files[mode],base).href;tag.async=true;
   tag.onload=()=>finish(true);tag.onerror=()=>finish(false);
   const timer=setTimeout(()=>finish(false),20000);
   root.document.head.appendChild(tag);
  });
  return entry.promise;
 }
 root.LabSceneLoader=Object.freeze({status,load,subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}});
})(window);
