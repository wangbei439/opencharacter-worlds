import type {Particle} from '../domain/types.ts';
export class ParticleRenderer {
 canvas:HTMLCanvasElement;kind:Particle;quality:string;raf=0;last=0;slow=0;particles:{x:number;y:number;size:number;speed:number;phase:number}[]=[];resize:ResizeObserver;
 constructor(canvas:HTMLCanvasElement,kind:Particle,quality:string){this.canvas=canvas;this.kind=kind;this.quality=quality;this.resize=new ResizeObserver(()=>this.size());this.resize.observe(canvas);this.size();const count=quality==='low'?16:quality==='high'?70:38;this.particles=Array.from({length:count},()=>({x:Math.random(),y:Math.random(),size:1+Math.random()*2.5,speed:0.015+Math.random()*0.05,phase:Math.random()*Math.PI*2}));this.raf=requestAnimationFrame(t=>this.frame(t))}
 size(){const r=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(1,Math.round(r.width));this.canvas.height=Math.max(1,Math.round(r.height))}
 frame(time:number){const dt=Math.min(0.05,(time-(this.last||time))/1000);if(dt>0.03)this.slow++;this.last=time;if(this.slow>90&&this.particles.length>16){this.particles=this.particles.slice(0,Math.ceil(this.particles.length*0.65));this.slow=0}const ctx=this.canvas.getContext('2d');if(!ctx)return;const w=this.canvas.width,h=this.canvas.height;ctx.clearRect(0,0,w,h);
 for(const p of this.particles){p.y=(p.y+dt*p.speed*(this.kind==='rain'?7:1))%1;p.x=(p.x+dt*(this.kind==='leaves'?0.015:0.002)+1)%1;const x=p.x*w+Math.sin(time/2000+p.phase)*8,y=p.y*h;ctx.save();ctx.translate(x,y);
 if(this.kind==='rain'){ctx.strokeStyle='rgba(191,215,227,.4)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-3,14);ctx.stroke()}
 else if(this.kind==='fog'){const g=ctx.createRadialGradient(0,0,0,0,0,100);g.addColorStop(0,'rgba(206,219,220,.035)');g.addColorStop(1,'rgba(206,219,220,0)');ctx.fillStyle=g;ctx.fillRect(-100,-100,200,200)}
 else if(this.kind==='leaves'){ctx.rotate(p.phase+time/3500);ctx.fillStyle='rgba(169,121,62,.7)';ctx.beginPath();ctx.ellipse(0,0,p.size*2,p.size,0,0,Math.PI*2);ctx.fill()}
 else{const alpha=this.kind==='firefly'?.3+.4*Math.sin(time/800+p.phase)**2:.45;ctx.fillStyle=this.kind==='snow'?`rgba(242,245,246,${alpha})`:`rgba(235,202,139,${alpha})`;if(this.kind==='firefly'||this.kind==='light'){ctx.shadowBlur=8;ctx.shadowColor='#e4c883'}ctx.beginPath();ctx.arc(0,0,this.kind==='dust'?p.size*.45:p.size,0,Math.PI*2);ctx.fill()}
 ctx.restore()}
 this.raf=requestAnimationFrame(t=>this.frame(t))}
 dispose(){cancelAnimationFrame(this.raf);this.resize.disconnect()}
}
