'use strict';
// A same-document history entry for each detail; preserve unrelated query/filter state.
function createFiberDetailNavigation({readScroll, restore, dismiss}) {
 const keys={function:'functionDetail',method:'methodDetail',term:'term'};
 const history=window.history, supported=typeof history?.go==='function';
 let replaying=false;
 const read=()=>history.state?.fiberDetail?.chain||[];
 const urlFor=item=>{const url=new URL(window.location.href);Object.values(keys).forEach(key=>url.searchParams.delete(key));if(item)url.searchParams.set(keys[item.type],item.id);return url;};
 const write=(chain,replace=false)=>history[replace?'replaceState':'pushState']({...history.state,fiberDetail:{chain}},'',urlFor(chain.at(-1)).href);
 return {
  get depth(){return supported?read().length:0;},
  record(type,id){
   if(!supported||replaying)return;
   const chain=read().map(item=>({...item})),last=chain.at(-1);
   if(last?.type===type&&last.id===id)return;
   if(last){last.scroll=readScroll();write(chain,true);}
   else write([],true); // Direct links also get a list entry to return to.
   write([...chain,{type,id,scroll:0}]);
  },
  back(){if(!supported||read().length<2)return false;history.back();return true;},
  close(){if(supported&&!replaying&&read().length)history.go(-read().length);},
  start(){
   if(!supported)return;
   window.addEventListener('popstate',()=>{
    const chain=read(),url=new URL(window.location.href);
    const type=Object.keys(keys).find(type=>url.searchParams.has(keys[type]));
    replaying=true;
    try{if(type)restore(type,url.searchParams.get(keys[type]),chain);else dismiss();}finally{replaying=false;}
   });
  }
 };
}
