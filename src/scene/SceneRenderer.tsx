import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';
import type {Character,WorldState,Settings,Expression} from '../domain/types.ts';
import {useAsset} from '../ui/useAsset.ts';
import {ParticleRenderer} from './particles.ts';
export function displayName(name:string,language:string){const parts=name.split(' · ');return parts.length===2?(language==='zh-CN'?parts[0]:parts[1]):name}
export function SceneRenderer({character,world,settings,expression}:{character:Character;world:WorldState;settings:Settings;expression:Expression}){
 const {t}=useTranslation(),canvas=useRef<HTMLCanvasElement>(null),video=useRef<HTMLVideoElement>(null),scene=useRef<HTMLDivElement>(null);const location=world.entities[world.location];
 const background=useAsset(location?.backgroundId,character.builtin?'/archive.png':undefined);const portrait=useAsset(character.expressions[expression]??character.portraitId,character.builtin?'/eileen.png':undefined);
 const reduce=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const effect=settings.particles==='none'?'none':world.weather==='none'?settings.particles:world.weather;
 useEffect(()=>{if(!canvas.current||effect==='none'||reduce||!settings.motion)return;const renderer=new ParticleRenderer(canvas.current,effect,settings.performance);return()=>renderer.dispose()},[effect,settings.performance,settings.motion,reduce]);
 useEffect(()=>{const media=video.current;if(!media)return;if(settings.dynamicBackground&&settings.motion&&!reduce&&settings.performance!=='low')void media.play().catch(()=>{});else media.pause()},[background.url,settings.dynamicBackground,settings.motion,settings.performance,reduce]);
 return <section className={`scene ${world.minutes>=1080||world.minutes<360?'night':''} ${settings.motion&&!reduce?'scene-motion':''}`} ref={scene} onPointerMove={e=>{if(!settings.parallax||!settings.motion||settings.performance==='low'||reduce)return;const r=e.currentTarget.getBoundingClientRect();scene.current?.style.setProperty('--shift',`${(e.clientX-r.left-r.width/2)/r.width*8}px`)}} onPointerLeave={()=>scene.current?.style.setProperty('--shift','0px')}>
  <div className="scene-backdrop">{background.url?(background.mime.startsWith('video/')?<video ref={video} src={background.url} autoPlay={settings.dynamicBackground&&settings.motion&&!reduce&&settings.performance!=='low'} muted playsInline loop preload="metadata"/>:<img src={background.url} alt=""/>):<div className="abstract-scene"><i/><i/><i/></div>}</div>
  <div className="scene-tint"/>{portrait.url&&world.participants.includes(character.id)&&<img key={portrait.url} className={`scene-portrait expression-${expression}`} src={portrait.url} alt={character.name}/>}
  <canvas ref={canvas} className="particles" aria-hidden="true"/>
  <div className="scene-top"><span>◇ {displayName(location?.name??'',settings.language)}</span><span>{t('world.day',{day:world.day})} <b>·</b> {String(Math.floor(world.minutes/60)).padStart(2,'0')}:{String(world.minutes%60).padStart(2,'0')}</span></div>
  <div className="scene-caption"><span className="eyebrow">{t('character.title')}</span><h2>{displayName(character.name,settings.language)}</h2><span className="scene-status"><i/>{t('visual.'+expression)}</span></div>
 </section>;
}
