import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { pointerCoordinates, tiltAllowed, tiltPose } from './pointerTilt';
import { subscribePageScroll } from './pageScroll';
import type { PointerCoordinates, TiltKind } from './pointerTilt';
import './PointerTilt.css';

type Options={kind:TiltKind;enabled?:boolean;edge?:boolean;onPoint?:(p:PointerCoordinates)=>void;onReset?:()=>void};
export function usePointerTilt(sensorRef:RefObject<HTMLElement|null>,sceneRef:RefObject<HTMLElement|null>,options:Options) {
  const callbacks=useRef(options);
  useEffect(()=>{callbacks.current=options;});
  const {kind,enabled=true,edge=false}=options;
  useEffect(()=>{
    const sensor=sensorRef.current,scene=sceneRef.current;
    if(!sensor||!scene)return;
    const layers=Array.from(scene.querySelectorAll<HTMLElement>('[data-tilt-layer]'));
    const targets=[scene,...layers];
    const hover=matchMedia('(hover:hover)'),fine=matchMedia('(pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
    let canTilt=false,canEdge=false,blocked=false,visible=true,frame=0,active=false,returning=false;
    let point={x:0,y:0};
    let controls:{rx:ReturnType<typeof gsap.quickTo>;ry:ReturnType<typeof gsap.quickTo>;y:ReturnType<typeof gsap.quickTo>;layers:{x:ReturnType<typeof gsap.quickTo>;y:ReturnType<typeof gsap.quickTo>;z:ReturnType<typeof gsap.quickTo>}[]}|undefined;
    const reset=(immediate=false)=>{
      cancelAnimationFrame(frame);frame=0;callbacks.current.onReset?.();controls=undefined;
      sensor.dataset.pointerInside='false';
      if(!active&&!returning){sensor.dataset.tiltActive='false';return;}
      gsap.killTweensOf(targets);
      const clear=()=>{gsap.set(targets,{clearProps:'transform,willChange'});sensor.dataset.tiltActive='false';returning=false;};
      if(!active||immediate){clear();active=false;return;}
      active=false;returning=true;
      gsap.to(targets,{rotationX:0,rotationY:0,x:0,y:0,z:0,duration:.6,ease:'power3.out',overwrite:true,onComplete:clear});
    };
    const layoutReady=()=>![sensor,sensor.closest('.project'),sensor.closest('.strengths-grid')].some(el=>{
      const status=(el as HTMLElement|null)?.dataset.motionReveal;return status==='pending'||status==='running';
    });
    const update=()=>{
      canTilt=enabled&&tiltAllowed(innerWidth,hover.matches,fine.matches,reduce.matches);
      canEdge=edge&&innerWidth>760&&hover.matches&&fine.matches&&!reduce.matches;
      reset(true);
    };
    const sync=()=>{
      blocked=Boolean(document.querySelector('dialog[open]'))||Boolean(document.fullscreenElement)||document.hidden||document.querySelector('.portfolio-root')?.getAttribute('data-opening')==='playing';
      if(blocked)reset(true);
    };
    const paint=()=>{
      frame=0;
      if(blocked||!visible||(!canTilt&&!canEdge)||!layoutReady())return;
      const p=pointerCoordinates(sensor.getBoundingClientRect(),point.x,point.y);
      sensor.dataset.pointerInside='true';
      if(canEdge)callbacks.current.onPoint?.(p);
      if(!canTilt)return;
      active=true;returning=false;sensor.dataset.tiltActive='true';
      const pose=tiltPose(kind,p);
      if(!controls){
        gsap.killTweensOf(targets);
        gsap.set(targets,{willChange:'transform'});
        const quick=(node:HTMLElement,prop:string)=>gsap.quickTo(node,prop,{duration:.35,ease:'power3.out'});
        controls={rx:quick(scene,'rotationX'),ry:quick(scene,'rotationY'),y:quick(scene,'y'),
          layers:layers.map(node=>({x:quick(node,'x'),y:quick(node,'y'),z:quick(node,'z')}))};
      }
      controls.rx(pose.rx);controls.ry(pose.ry);controls.y(pose.lift);
      controls.layers.forEach((layer,i)=>{const value=pose.layers[i];if(value){layer.x(value.x);layer.y(value.y);layer.z(value.z);}});
    };
    const move=(event:PointerEvent)=>{
      if(event.pointerType==='touch'||blocked||!visible||(!canTilt&&!canEdge))return;
      point={x:event.clientX,y:event.clientY};
      if(!frame)frame=requestAnimationFrame(paint);
    };
    const leave=()=>reset();
    const immediate=()=>{if(active||returning||frame||sensor.dataset.pointerInside==='true')reset(true);};
    const resize=()=>update();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,attributes:true,childList:true,attributeFilter:['open','data-opening']});
    const intersection=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(!visible)reset(true);});
    intersection.observe(sensor);
    update();sync();
    sensor.addEventListener('pointermove',move,{passive:true});sensor.addEventListener('pointerleave',leave);sensor.addEventListener('pointercancel',immediate);
    const unsubscribeScroll=subscribePageScroll(immediate);
    window.addEventListener('blur',immediate);window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',sync);document.addEventListener('fullscreenchange',sync);
    [hover,fine,reduce].forEach(q=>q.addEventListener('change',update));
    return()=>{
      reset(true);observer.disconnect();intersection.disconnect();
      sensor.removeEventListener('pointermove',move);sensor.removeEventListener('pointerleave',leave);sensor.removeEventListener('pointercancel',immediate);
      unsubscribeScroll();
      window.removeEventListener('blur',immediate);window.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',sync);document.removeEventListener('fullscreenchange',sync);
      [hover,fine,reduce].forEach(q=>q.removeEventListener('change',update));
    };
  },[sensorRef,sceneRef,kind,enabled,edge]);
}
