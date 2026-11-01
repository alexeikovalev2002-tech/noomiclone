(() => {
'use strict';
const canvas=document.getElementById('view'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s);
const scoreEl=$('#score'),stateEl=$('#state'),grabBtn=$('#grab');
let W=0,H=0,dpr=1,scale=1,ox=0,oy=0,last=0,score=0,held=true,pose='straight',keys={},touch={left:false,right:false};
const world={bar:{x:0,y:0,w:0},floor:0};
let p={},links=[],handAnchors=null,dead=false;
const names=['head','neck','chest','hip','lhand','lelbow','rhand','relbow','lknee','lfoot','rknee','rfoot'];
function point(x,y){return{x,y,oldX:x,oldY:y}}
function d(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function makeLink(a,b,len,stiff=1){links.push({a,b,len,stiff})}
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(W/960,H/540);ox=(W-960*scale)/2;oy=(H-540*scale)/2;world.bar={x:ox+340*scale,y:oy+175*scale,w:280*scale};world.floor=oy+465*scale;draw()}
function worldPoint(x,y){return{x:ox+x*scale,y:oy+y*scale}}
function reset(){score=0;scoreEl.textContent='0';dead=false;pose='straight';const bx=world.bar.x+world.bar.w/2,by=world.bar.y;
 p={head:point(bx,by+74*scale),neck:point(bx,by+103*scale),chest:point(bx,by+139*scale),hip:point(bx,by+204*scale),lhand:point(bx-18*scale,by+4*scale),lelbow:point(bx-26*scale,by+56*scale),rhand:point(bx+18*scale,by+4*scale),relbow:point(bx+26*scale,by+56*scale),lknee:point(bx-22*scale,by+257*scale),lfoot:point(bx-26*scale,by+309*scale),rknee:point(bx+22*scale,by+257*scale),rfoot:point(bx+26*scale,by+309*scale)};
 links=[];[['head','neck'],['neck','chest'],['chest','hip'],['lhand','lelbow'],['lelbow','chest'],['rhand','relbow'],['relbow','chest'],['hip','lknee'],['lknee','lfoot'],['hip','rknee'],['rknee','rfoot']].forEach(([a,b])=>makeLink(a,b,d(p[a],p[b]),.95));
 held=true;handAnchors={lx:bx-18*scale,rx:bx+18*scale,y:by};updateHud();}
function updateHud(){stateEl.textContent=held?'ДЕРЖИТСЯ':dead?'ФИНИШ':'В ПОЛЁТЕ';stateEl.style.color=held?'#299b62':dead?'#d54b4b':'#d18a20';grabBtn.textContent=held?'ОТПУСТИТЬ':'СХВАТИТЬ';}
function toggleGrab(){if(held){held=false;handAnchors=null;updateHud();return;}const bar=world.bar,nearL=Math.hypot(p.lhand.x-(bar.x+bar.w*.42),p.lhand.y-bar.y),nearR=Math.hypot(p.rhand.x-(bar.x+bar.w*.58),p.rhand.y-bar.y);if(Math.min(nearL,nearR)<70*scale){held=true;handAnchors={lx:bar.x+bar.w*.42,rx:bar.x+bar.w*.58,y:bar.y};score++;scoreEl.textContent=score;updateHud();}}
function setPose(v){pose=v;document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b.dataset.pose===v));}
function constrain(){for(let k=0;k<12;k++){for(const l of links){const a=p[l.a],b=p[l.b],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,err=(len-l.len)/len*.5*l.stiff;const wa=(l.a==='head'||l.a==='lhand'||l.a==='rhand')?0.9:1,wb=(l.b==='head'||l.b==='lhand'||l.b==='rhand')?0.9:1;a.x+=dx*err*wa;a.y+=dy*err*wa;b.x-=dx*err*wb;b.y-=dy*err*wb;}}
 if(held&&handAnchors){for(const [n,x] of [['lhand',handAnchors.lx],['rhand',handAnchors.rx]]){p[n].x=x;p[n].y=handAnchors.y;p[n].oldX=x;p[n].oldY=handAnchors.y;}}
}
function applyPose(){const base={straight:[0,0],arch:[-12,-13],tuck:[26,18]}[pose];if(pose==='arch'){p.chest.y+=base[0]*scale*.015;p.head.y+=base[1]*scale*.015;p.hip.y+=3*scale*.01;}else if(pose==='tuck'){p.hip.y-=base[1]*scale*.015;p.lknee.x+=(p.lknee.x<p.hip.x?1:-1)*.15;p.rknee.x+=(p.rknee.x<p.hip.x?1:-1)*.15;}}
function step(dt){if(dead)return;const dir=(keys.ArrowLeft||keys.KeyA||touch.left?-1:0)+(keys.ArrowRight||keys.KeyD||touch.right?1:0);const impulse=dir*1700*scale;
 for(const n of names){const q=p[n];let vx=(q.x-q.oldX)*.992,vy=(q.y-q.oldY)*.992;q.oldX=q.x;q.oldY=q.y;q.x+=vx;q.y+=vy+1250*scale*dt*dt;}
 if(held&&handAnchors&&dir){for(const n of ['chest','hip','lknee','rknee'])p[n].x+=impulse*dt*dt*.45;}
 applyPose();constrain();
 // soft floor collision with a little bounce
 for(const n of names){const q=p[n],r=(n==='head'?10:5)*scale;if(q.y>world.floor-r){q.y=world.floor-r;const vy=q.y-q.oldY;if(vy>0)q.oldY=q.y+vy*.18;}}
 if(p.head.y>world.floor-12*scale&&p.chest.y>world.floor-12*scale){dead=true;held=false;handAnchors=null;updateHud();}
}
function line(a,b,width=6){ctx.lineWidth=width*scale;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#83d5f4';ctx.fillRect(0,0,W,H);
 // soft clouds
 ctx.fillStyle='#ffffff55';for(const [x,y,r] of [[115,95,28],[165,90,20],[775,82,24],[820,90,17]]){const q=worldPoint(x,y);ctx.beginPath();ctx.arc(q.x,q.y,r*scale,0,Math.PI*2);ctx.fill();}
 // ground and back platform
 ctx.fillStyle='#f2f3ef';ctx.fillRect(0,world.floor,W,H-world.floor);ctx.fillStyle='#e65b5b';ctx.beginPath();ctx.moveTo(0,oy+400*scale);ctx.lineTo(W,oy+400*scale);ctx.lineTo(W,world.floor);ctx.lineTo(0,world.floor);ctx.closePath();ctx.fill();
 const b=world.bar;ctx.fillStyle='#9b9b95';ctx.beginPath();ctx.moveTo(b.x-155*scale,oy+142*scale);ctx.lineTo(b.x-126*scale,oy+136*scale);ctx.lineTo(b.x-110*scale,world.floor);ctx.lineTo(b.x-145*scale,world.floor);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(b.x+b.w+126*scale,oy+136*scale);ctx.lineTo(b.x+b.w+155*scale,oy+142*scale);ctx.lineTo(b.x+b.w+145*scale,world.floor);ctx.lineTo(b.x+b.w+110*scale,world.floor);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#60686a';ctx.lineWidth=8*scale;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-130*scale,b.y);ctx.lineTo(b.x+b.w+130*scale,b.y);ctx.stroke();ctx.strokeStyle='#aab0ae';ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(b.x-130*scale,b.y-5*scale);ctx.lineTo(b.x+b.w+130*scale,b.y-5*scale);ctx.stroke();
 // lower safety bar
 ctx.strokeStyle='#8e9694';ctx.lineWidth=5*scale;ctx.beginPath();ctx.moveTo(b.x-130*scale,oy+265*scale);ctx.lineTo(b.x+b.w+130*scale,oy+265*scale);ctx.stroke();
 if(!p.head)return;
 // ragdoll limbs
 ctx.strokeStyle='#15191b';line(p.head,p.neck,7);line(p.neck,p.chest,8);line(p.chest,p.hip,9);line(p.chest,p.lelbow,7);line(p.lelbow,p.lhand,7);line(p.chest,p.relbow,7);line(p.relbow,p.rhand,7);line(p.hip,p.lknee,8);line(p.lknee,p.lfoot,7);line(p.hip,p.rknee,8);line(p.rknee,p.rfoot,7);
 ctx.fillStyle='#111619';ctx.beginPath();ctx.arc(p.head.x,p.head.y,10*scale,0,Math.PI*2);ctx.fill();
 if(held){ctx.strokeStyle='#252b2d';ctx.lineWidth=2*scale;ctx.beginPath();ctx.arc(p.lhand.x,p.lhand.y,6*scale,Math.PI,Math.PI*2);ctx.arc(p.rhand.x,p.rhand.y,6*scale,Math.PI,Math.PI*2);ctx.stroke();}
 if(dead){ctx.fillStyle='#111b';ctx.fillRect(0,0,W,H);ctx.fillStyle='white';ctx.font=`bold ${30*scale}px Arial`;ctx.textAlign='center';ctx.fillText('ПОПЫТКА ОКОНЧЕНА',W/2,H/2);ctx.font=`${15*scale}px Arial`;ctx.fillText('Нажми R или СБРОС',W/2,H/2+30*scale);}
}
function loop(t){const dt=Math.min((t-last)/1000||0,.025);last=t;const sub=2,sd=dt/sub;for(let i=0;i<sub;i++)step(sd);draw();requestAnimationFrame(loop)}
$('#grab').addEventListener('click',toggleGrab);$('#restart').addEventListener('click',reset);document.querySelectorAll('[data-pose]').forEach(b=>b.addEventListener('click',()=>setPose(b.dataset.pose)));
function bindHold(id,key){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();touch[key]=true;el.setPointerCapture?.(e.pointerId)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,()=>touch[key]=false));}
bindHold('#left','left');bindHold('#right','right');window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space'&&!e.repeat)toggleGrab();if(e.code==='KeyR')reset();if(e.code==='Digit1')setPose('arch');if(e.code==='Digit2')setPose('tuck');if(e.code==='Digit3')setPose('straight');});window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{keys={};touch={left:false,right:false};});window.addEventListener('resize',()=>{resize();reset();});resize();reset();requestAnimationFrame(loop);
})();
