"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { fingerprint, mergeRanges, readAnnotations, storageKey, subtractRange, type Annotations, type Interval } from "./ranges";
const excluded="input,textarea,select,option,button,a,header,footer,nav,script,style,svg,[contenteditable],[role=separator],[data-no-highlight],[inert]";
type Entry={node:Text;id:string};
type Segment={id:string;text:string;range:Interval};
type Popup={x:number;y:number;segments:Segment[];removable:boolean};
function eligible(node: Node) {return !!node.parentElement && !node.parentElement.closest(excluded) && !!node.textContent?.trim();}
function plainText(block: Element) {
  const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);let node:Node|null,result="";
  while((node=walker.nextNode()))if(eligible(node))result+=node.textContent;
  return result;
}
// Content anchors survive React replacing nodes; exact text is checked before painting.
function entries(root: HTMLElement): Entry[] {
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),seen=new Map<string,number>(),cache=new Map<Element,string>();
  const result:Entry[]=[];let node:Node|null;
  while((node=walker.nextNode())) {
    if(!eligible(node))continue;
    const parent=node.parentElement!,block=parent.closest("p,li,td,th,label,h1,h2,h3,h4,h5,blockquote") || parent;
    let content=cache.get(block);if(content===undefined){content=plainText(block);cache.set(block,content);}
    const article=parent.closest("article"),section=parent.closest("section"),question=parent.closest('[id^="question-"]');
    const context=[article?.querySelector("h1,h2,h3")?.textContent || "",section?.getAttribute("aria-label") || section?.querySelector("h2,h3,h4")?.textContent || "",question?.id || "",block.tagName,content,node.textContent].join("\u001f");
    const base=fingerprint(context),count=seen.get(base)||0;seen.set(base,count+1);
    result.push({node:node as Text,id:`${base}:${count}`});
  }
  return result;
}
export default function TestHighlighter({candidateId,children}:{candidateId:string;children:ReactNode}) {
  const root=useRef<HTMLDivElement>(null),menu=useRef<HTMLDivElement>(null);
  const [popup,setPopup]=useState<Popup|null>(null);
  const pathname=usePathname(),params=useSearchParams(),test=params.get("test")||"1";
  const section=pathname.startsWith("/listening")?"listening":pathname.startsWith("/test/writing")?"writing":"reading";
  useEffect(()=>{
    const container=root.current,registry=window.CSS?.highlights,HighlightClass=window.Highlight;
    if(!container || !registry || !HighlightClass || pathname.includes("/result"))return;
    let annotations:Annotations={},activeKey="",frame=0,alive=true;
    let current:Entry[]=[];
    const identity=()=>{
      if(sessionStorage.getItem("ieltsStudent")!==candidateId)return "";
      const attempt=sessionStorage.getItem(`ieltsAttempt:${test}`);
      return attempt?storageKey(candidateId,attempt,test,section):"";
    };
    const syncIdentity=()=>{
      const key=identity();if(key===activeKey)return;
      activeKey=key;annotations={};setPopup(null);registry.delete("ielts-marker");
      if(key)try{annotations=readAnnotations(sessionStorage.getItem(key));}catch{}
    };
    const paint=()=>{
      syncIdentity();current=entries(container);
      const ranges:Range[]=[];
      if(activeKey)for(const {node,id} of current){const saved=annotations[id];if(saved?.text!==node.data)continue;
        for(const [start,end] of saved.ranges){if(end>node.length)continue;const range=document.createRange();range.setStart(node,start);range.setEnd(node,end);ranges.push(range);}}
      registry.set("ielts-marker",new HighlightClass(...ranges));
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(alive)paint();});};
    const store=()=>{if(activeKey)try{sessionStorage.setItem(activeKey,JSON.stringify(annotations));}catch{/* Keep working in memory if storage is full. */}};
    const selectionSegments=(range:Range):Segment[]=>{
      current=entries(container);const result:Segment[]=[];
      for(const {node,id} of current){if(!range.intersectsNode(node))continue;
        const start=range.startContainer===node?range.startOffset:0,end=range.endContainer===node?range.endOffset:node.length;
        if(end>start&&node.data.slice(start,end).trim())result.push({id,text:node.data,range:[start,end]});}
      return result;
    };
    const position=(rect:DOMRect,segments:Segment[])=>{
      if(!segments.length || !activeKey){setPopup(null);return;}
      const removable=segments.some(s=>annotations[s.id]?.ranges.some(([a,b])=>a<s.range[1]&&b>s.range[0]));
      const width=Math.min(220,window.innerWidth-16),x=Math.max(8,Math.min(window.innerWidth-width-8,rect.left));
      const below=rect.bottom+8,y=Math.max(8,Math.min(window.innerHeight-48,below+42<window.innerHeight?below:rect.top-48));
      setPopup({x,y,segments,removable});
    };
    const showSelection=()=>{
      syncIdentity();const selection=window.getSelection();
      if(!selection||selection.isCollapsed||!selection.rangeCount||!selection.toString().trim()){setPopup(null);return;}
      const range=selection.getRangeAt(0);
      if(!container.contains(range.startContainer)||!container.contains(range.endContainer)||range.startContainer.parentElement?.closest(excluded)||range.endContainer.parentElement?.closest(excluded)){setPopup(null);return;}
      const rects=range.getClientRects(),rect=rects[rects.length-1]||range.getBoundingClientRect();
      position(rect,selectionSegments(range));
    };
    const pointerUp=(event:PointerEvent)=>{
      if(menu.current?.contains(event.target as Node))return;
      if((event.target as Element).closest?.(excluded)){setPopup(null);return;}
      if(window.getSelection()?.toString().trim()){showSelection();return;}
      syncIdentity();current=entries(container);
      for(const {node,id} of current){const saved=annotations[id];if(saved?.text!==node.data)continue;
        for(const interval of saved.ranges){const range=document.createRange();range.setStart(node,interval[0]);range.setEnd(node,interval[1]);
          for(const rect of range.getClientRects())if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom){position(rect,[{id,text:node.data,range:interval}]);return;}}}
      setPopup(null);
    };
    const outside=(event:PointerEvent)=>{if(!menu.current?.contains(event.target as Node))setPopup(null);};
    const keyUp=(event:KeyboardEvent)=>{if(event.key==="Escape"){setPopup(null);window.getSelection()?.removeAllRanges();}else if(event.shiftKey)showSelection();};
    const dismiss=()=>setPopup(null);
    // Double-click word selection can finish after pointerup's default action.
    const doubleClick=()=>{requestAnimationFrame(()=>{if(alive)showSelection();});};
    const action=(event:Event)=>{
      const detail=(event as CustomEvent<{popup:Popup;remove:boolean}>).detail;
      const oldKey=activeKey;syncIdentity();if(!activeKey||activeKey!==oldKey)return;
      current=entries(container);
      for(const segment of detail.popup.segments){const found=current.find(e=>e.id===segment.id&&e.node.data===segment.text);if(!found)continue;
        const previous=annotations[segment.id]?.ranges||[];
        const ranges=detail.remove?subtractRange(previous,segment.range):mergeRanges([...previous,segment.range]);
        if(ranges.length)annotations[segment.id]={text:segment.text,ranges};else delete annotations[segment.id];}
      store();paint();window.getSelection()?.removeAllRanges();setPopup(null);
    };
    const observer=new MutationObserver(schedule);observer.observe(container,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["inert"]});
    container.addEventListener("pointerup",pointerUp);container.addEventListener("dblclick",doubleClick);document.addEventListener("pointerdown",outside);document.addEventListener("keyup",keyUp);
    document.addEventListener("scroll",dismiss,true);window.addEventListener("resize",dismiss);container.addEventListener("ielts-highlight-action",action);
    const check=window.setInterval(()=>{if(identity()!==activeKey)paint();},400);
    paint();
    return()=>{alive=false;cancelAnimationFrame(frame);clearInterval(check);observer.disconnect();registry.delete("ielts-marker");container.removeEventListener("pointerup",pointerUp);container.removeEventListener("dblclick",doubleClick);document.removeEventListener("pointerdown",outside);document.removeEventListener("keyup",keyUp);document.removeEventListener("scroll",dismiss,true);window.removeEventListener("resize",dismiss);container.removeEventListener("ielts-highlight-action",action);setPopup(null);};
  },[candidateId,test,section,pathname]);
  const act=(remove:boolean)=>{if(popup)root.current?.dispatchEvent(new CustomEvent("ielts-highlight-action",{detail:{popup,remove}}));};
  return <><div ref={root} style={{display:"contents"}}>{children}</div>{popup&&createPortal(<div ref={menu} role="group" aria-label="Text highlighting" className="ielts-highlight-menu" style={{left:popup.x,top:popup.y}} onPointerDown={e=>e.preventDefault()}><button type="button" onClick={()=>act(false)}>Highlight</button><button type="button" disabled={!popup.removable} onClick={()=>act(true)}>Unhighlight</button></div>,document.body)}</>;
}
