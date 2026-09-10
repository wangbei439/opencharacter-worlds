import {MusicPlayer} from './MusicPlayer.tsx';
import {useEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {Character,WorldState,Settings,Expression} from '../domain/types.ts';
import {useAsset} from '../ui/useAsset.ts';
import {ParticleRenderer} from './particles.ts';
export function displayName(name:string,language:string){const parts=name.split(' · ');return parts.length===2?(language==='zh-CN'?parts[0]:parts[1]):name}
export function SceneRenderer({character,world,settings,expression}:{character:Character;world:WorldState;settings:Settings;expression:Expression}){
 const {t}=useTranslation(),canvas=useRef<HTMLCanvasElement>(null),video=useRef<HTMLVideoElement>(null),scene=useRef<HTMLDivElement>(null);const location=world.entities[world.location];
 const [backgroundIndex,setBackgroundIndex]=useState(0),playlist=character.design?.backgroundIds??[];const selected=playlist.length?playlist[backgroundIndex%playlist.length]:undefined;const fixed=location?.backgroundId&&!playlist.includes(location.backgroundId)?location.backgroundId:undefined;
 const background=useAsset(fixed??selected??location?.backgroundId,character.builtin?'/archive.png':undefined);const portrait=useAsset(character.expressions[expression]??character.portraitId,character.builtin?'/eileen.png':undefined);
 const reduce=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const effect=settings.particles==='none'?'none':character.design?.particles??world.weather;
 useEffect(()=>setBackgroundIndex(0),[character.id,world.location]);
 useEffect(()=>{if(!character.design?.rotate||playlist.length<2||fixed||reduce||!settings.motion||settings.performance==='low')return;const timer=setInterval(()=>{if(!document.hidden)setBackgroundIndex(i=>(i+1)%playlist.length)},Math.max(5,character.design.rotationSeconds)*1000);return()=>clearInterval(timer)},[character.design?.rotate,character.design?.rotationSeconds,playlist.length,fixed,reduce,settings.motion,settings.performance]);
 useEffect(()=>{if(!canvas.current||effect==='none'||reduce||!settings.motion)return;const renderer=new ParticleRenderer(canvas.current,effect,settings.performance);return()=>renderer.dispose()},[effect,settings.performance,settings.motion,reduce]);
 useEffect(()=>{const media=video.current;if(!media)return;if(settings.dynamicBackground&&settings.motion&&!reduce&&settings.performance!=='low')void media.play().catch(()=>{});else media.pause()},[background.url,settings.dynamicBackground,settings.motion,settings.performance,reduce]);
 return <section className={`scene ${world.minutes>=1080||world.minutes<360?'night':''} ${settings.motion&&!reduce?'scene-motion':''}`} ref={scene} onPointerMove={e=>{if(!settings.parallax||!settings.motion||settings.performance==='low'||reduce)return;const r=e.currentTarget.getBoundingClientRect();scene.current?.style.setProperty('--shift',`${(e.clientX-r.left-r.width/2)/r.width*8}px`)}} onPointerLeave={()=>scene.current?.style.setProperty('--shift','0px')}>
  <div key={background.url} className="scene-backdrop">{background.url?(background.mime.startsWith('video/')?<video ref={video} src={background.url} autoPlay={settings.dynamicBackground&&settings.motion&&!reduce&&settings.performance!=='low'} muted playsInline loop preload="metadata"/>:<img src={background.url} alt=""/>):<div className="abstract-scene"><i/><i/><i/></div>}</div>
  <div className="scene-tint"/><div className="scene-custom-shade" style={{opacity:character.design?.overlayOpacity??0}}/>{portrait.url&&world.participants.includes(character.id)&&<img key={portrait.url} className={`scene-portrait expression-${expression}`} src={portrait.url} alt={character.name} style={{scale:character.design?.portraitScale??1,transformOrigin:'bottom center'}}/>}
  <canvas ref={canvas} className="particles" aria-hidden="true"/>
  <div className="scene-top"><span>◇ {displayName(location?.name??'',settings.language)}</span><span>{t('world.day',{day:world.day})} <b>·</b> {String(Math.floor(world.minutes/60)).padStart(2,'0')}:{String(world.minutes%60).padStart(2,'0')}</span></div>
  <div className="scene-controls">{playlist.length>1&&!fixed&&<div className="background-controls"><button onClick={()=>setBackgroundIndex(i=>(i-1+playlist.length)%playlist.length)} aria-label={t('media.previousBackground')}>‹</button><span>{backgroundIndex%playlist.length+1} / {playlist.length}</span><button onClick={()=>setBackgroundIndex(i=>(i+1)%playlist.length)} aria-label={t('media.nextBackground')}>›</button></div>}<MusicPlayer key={character.id} ids={character.design?.musicIds??[]} volume={character.design?.musicVolume??0.35}/></div>
  <div className="scene-caption"><span className="eyebrow">{t('character.title')}</span><h2>{displayName(character.name,settings.language)}</h2><span className="scene-status"><i/>{t('visual.'+expression)}</span></div>
 </section>;
}
