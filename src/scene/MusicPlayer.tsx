import {useEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useAsset} from '../ui/useAsset.ts';
import {Icon} from '../ui/primitives.tsx';
export function MusicPlayer({ids,volume:initialVolume}:{ids:string[];volume:number}){
 const {t}=useTranslation(),[index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[volume,setVolume]=useState(initialVolume),audio=useRef<HTMLAudioElement>(null),track=useAsset(ids[index%Math.max(ids.length,1)]);
 useEffect(()=>setVolume(initialVolume),[initialVolume]);
 useEffect(()=>{const player=audio.current;if(!player)return;player.volume=volume},[volume,track.url]);
 useEffect(()=>{const player=audio.current;if(!player)return;if(playing)void player.play().catch(()=>setPlaying(false));else player.pause()},[playing,track.url]);
 if(!ids.length)return null;
 return <div className="music-player"><audio ref={audio} src={track.url} preload="metadata" loop={ids.length===1} onEnded={()=>setIndex(i=>(i+1)%ids.length)} onError={()=>setPlaying(false)}/><button type="button" onClick={()=>{const player=audio.current;if(!player)return;if(playing){player.pause();setPlaying(false)}else void player.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))}} aria-label={t(playing?'media.pause':'media.play')}><Icon name="music"/>{t(playing?'media.pause':'media.play')}</button><select aria-label={t('media.track')} value={index%ids.length} onChange={e=>setIndex(Number(e.target.value))}>{ids.map((id,i)=><TrackOption key={id} id={id} index={i}/>)}</select><button type="button" onClick={()=>setIndex(i=>(i+1)%ids.length)} aria-label={t('media.nextTrack')}>›</button><input type="range" min={0} max={1} step={0.05} value={volume} onChange={e=>setVolume(Number(e.target.value))} aria-label={t('creator.volume')}/></div>;
}
function TrackOption({id,index}:{id:string;index:number}){const asset=useAsset(id);return <option value={index}>{asset.name??String(index+1)}</option>}
