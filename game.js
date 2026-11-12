'use strict';
const $=s=>document.querySelector(s),canvas=$('#scene'),ctx=canvas.getContext('2d'),C=BEAN_CONTENT;
let saved={total:0,best:0,equipped:0,sound:true};try{Object.assign(saved,JSON.parse(localStorage.getItem('bean-there-v1'))||{});}catch(e){}
saved.total=Math.max(0,Number(saved.total)||0);saved.unlocked=Math.max(0,Math.min(4,Number.isInteger(saved.unlocked)?saved.unlocked:C.tools.reduce((n,t,i)=>t.cost<=saved.total?i:n,0)));saved.equipped=Math.max(0,Math.min(saved.unlocked,Math.floor(Number(saved.equipped)||0)));
let shift=new BeanShift(),mode='menu',last=0,visual=0,beltOffset=0,grabs=[],sparks=[],trash=[],animals=[],hand=0,down=false,pointer={x:0,y:0},lastPick=-99,banked=false,muted=!saved.sound,audio=null,keyboardIndex=0,keyboardActive=false,upgradeMilestone=0,shiftUnlocks=[],dragging=false,dragOrigin={x:0,y:0},queuedTap=null,pressureSeen=0,lowMissAlert=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const bg=new Image();bg.src='assets/factory.webp';
function persist(){try{localStorage.setItem('bean-there-v1',JSON.stringify(saved));}catch(e){}}
function tone(good=true){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=good?'sine':'triangle';o.frequency.setValueAtTime(good?500+Math.min(shift.streak,30)*17:170,audio.currentTime);o.frequency.exponentialRampToValueAtTime(good?850:95,audio.currentTime+.09);g.gain.setValueAtTime(.065,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.14);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.15);}catch(e){}}
function nextProgress(){const next=C.tools[saved.unlocked+1];return next?`<div class="progresslabel"><b>NEXT: ${next.name.toUpperCase()}</b><span>20s / upgrade</span></div><p class="fine">New arm every 20 seconds: 20, 40, 60 and 80. Auto-equipped immediately. Unlocks stay yours.</p>`:'<p class="badges">ALL GRIPPERS UNLOCKED · STILL EMPLOYED?</p>';}
function checkUpgrades(){if(shift.done&&!shift.won)return;const reached=Math.min(4,Math.floor(shift.time/20));while(upgradeMilestone<reached){upgradeMilestone++;if(saved.unlocked<C.tools.length-1){saved.unlocked++;saved.equipped=saved.unlocked;shiftUnlocks.push(C.tools[saved.unlocked]);persist();shift.say('ARM UNLOCKED! '+C.tools[saved.unlocked].name.toUpperCase());tone();}}}
function panel(html){$('#overlay').classList.remove('hidden');$('#panel').innerHTML=html;}
function menu(){mode='menu';panel(`<div class="eyebrow">Your shift starts here · v0.4</div><h1>BEAN<br>THERE.</h1><p class="sub">A very normal job.<br>An increasingly unusual delivery.</p><div class="rules"><div class="rule"><b>LET GOOD BEANS GO</b>Green, full-length, gently curved.</div><div class="rule bad"><b>PICK THE REJECTS</b>Yellow, curled, tiny, huge, broken, wormy… or clearly not a bean.</div></div><p><b>Tap one bean precisely. Drag to sweep a wider area.</b><br>Allow 10 misses; the 11th ends your shift. Every 10 seconds: more beans, more speed, +5 to your total miss allowance. Survive 90 seconds.</p>${nextProgress()}<button class="primary" id="start">CLOCK IN →</button><button class="secondary" id="garage">GRIPPER LOCKER · ${C.tools[saved.equipped].name}</button><p class="fine">Best shift: ${saved.best} · Progress saves on this browser.<br>No ads. No purchases. Just beans.<br>Keyboard: ← → select · Space pick · P pause.</p>`);$('#start').onclick=start;$('#garage').onclick=garage;}
function garage(){mode='garage';panel(`<div class="eyebrow">Equipment department</div><h2>Gripper locker</h2><p>New arm every 20 seconds each shift. Unlocks are permanent.</p>${C.tools.map((t,i)=>`<button class="tool ${i===saved.equipped?'selected':''}" data-tool="${i}" ${i>saved.unlocked?'disabled':''}><b>${i>saved.unlocked?'LOCKED · ':i===saved.equipped?'EQUIPPED · ':''}${t.name} ${i>saved.unlocked?' / survive 20s':''}</b><small>${t.desc}</small></button>`).join('')}<button class="primary" id="back">BACK TO WORK</button>`);document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{saved.equipped=+b.dataset.tool;persist();garage();});$('#back').onclick=menu;}
function start(){shift=new BeanShift();upgradeMilestone=0;shiftUnlocks=[];grabs=[];sparks=[];trash=[];animals=[];lastPick=-99;banked=false;down=false;dragging=false;queuedTap=null;pressureSeen=0;lowMissAlert=false;mode='playing';$('#overlay').classList.add('hidden');$('#quip').textContent='Good beans stay. Everything else goes.';tone();}
function pause(){if(mode!=='playing')return;mode='paused';down=false;dragging=false;queuedTap=null;panel('<div class="eyebrow">Authorized break</div><h2>Belt paused.</h2><p>Even robots deserve a moment.</p><button class="primary" id="resume">RESUME SHIFT</button>');$('#resume').onclick=()=>{mode='playing';$('#overlay').classList.add('hidden');};}
function finish(){if(banked)return;banked=true;mode='report';down=false;dragging=false;queuedTap=null;saved.total+=shift.score;saved.best=Math.max(saved.best,shift.score);persist();const unlocked=shiftUnlocks;panel(`<div class="eyebrow">${shift.won?'Shift completed':'Employment interrupted'}</div><h2>${shift.won?'Still on payroll.':'You had one job.'}</h2><p class="sub">${shift.won?(shift.goodSaved===0?'You have successfully sorted us out of business.':shift.goodWasted>shift.goodSaved?'You survived. The profit margin did not.':'Please return tomorrow. The frog already has.'):'Miss allowance exceeded. “Those were going to customers.”'}</p><div class="report"><div>SHIFT SCORE<strong>${shift.score}</strong></div><div>TIME WORKED<strong>${Math.floor(shift.time)}s</strong></div><div>REJECTS REMOVED<strong>${shift.picked}</strong></div><div>BEST CLEAN STREAK<strong>${shift.bestStreak}</strong></div><div>SELLABLE BEANS<strong>${shift.goodSaved}</strong></div><div>GOOD BEANS WASTED<strong>${shift.goodWasted}</strong></div><div>MISSED / ALLOWANCE<strong>${shift.missed} / ${shift.missLimit}</strong></div><div>GOOD BEAN YIELD<strong>${Math.round(100*shift.goodSaved/Math.max(1,shift.goodSaved+shift.goodWasted))}%</strong></div></div>${unlocked.length?`<p class="badges">UNLOCKED: ${unlocked.map(t=>t.name).join(', ')}! Equipped and saved.</p>`:''}${nextProgress()}<button class="primary" id="again">ONE MORE SHIFT →</button><button class="secondary" id="locker">GRIPPER LOCKER</button>`);$('#again').onclick=start;$('#locker').onclick=garage;}
function distance(o,p){
 const dx=p.x-o.x,dy=p.y-o.y,a=o.angle||0;
 const x=dx*Math.cos(a)+dy*Math.sin(a),y=-dx*Math.sin(a)+dy*Math.cos(a);
 if(['good','yellow','short','huge','tiny','worm','mud'].includes(o.type)){
  const t=Math.max(0,Math.min(1,(x+o.len/2)/o.len));
  const curve=24*t*(1-t)-2*t;
  return Math.hypot(Math.max(0,Math.abs(x)-o.len/2),y-curve);
 }
 return Math.hypot(x,y)-12;
}
function pick(p,sweep=false,targetId=null){
 if(mode!=='playing'||shift.done)return false;
 const tool=C.tools[saved.equipped];
 const available=[0,1].filter(side=>!grabs.some(g=>g.side===side&&g.age<g.duration));
 if(shift.time-lastPick<tool.cooldown||!available.length)return false;
 const side=available.includes(hand%2)?hand++%2:available[0];
 const radius=sweep?tool.radius:14;
 const candidates=shift.items.filter(o=>o.x>=0&&o.x<=480).map(o=>({o,d:distance(o,p)}));
 const found=targetId===null?candidates.filter(a=>a.d<radius).sort((a,b)=>a.d-b.d||b.o.id-a.o.id)[0]:candidates.find(a=>a.o.id===targetId);
 if(!found)return false;
 const o=shift.pick(found.o.id);if(!o)return false;
 lastPick=shift.time;
 const live=['frog','toad','mouse','snail'].includes(o.type);
 grabs.push({o:{...o},age:0,side,live,duration:tool.duration});
 sparks.push({x:o.x,y:o.y,text:o.type==='good'?'−18':'+20',age:0,good:o.type!=='good'});tone(o.type!=='good');return true;
}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*480,y:(e.clientY-r.top)/r.height*800};}
canvas.addEventListener('pointerdown',e=>{
 if(mode!=='playing'||down)return;
 keyboardActive=false;down=true;dragging=false;pointer=point(e);dragOrigin={...pointer};queuedTap=null;
 canvas.setPointerCapture(e.pointerId);
 if(!pick(pointer)){const target=shift.items.filter(o=>o.x>=0&&o.x<=480).map(o=>({o,d:distance(o,pointer)})).filter(a=>a.d<14).sort((a,b)=>a.d-b.d||b.o.id-a.o.id)[0];if(target)queuedTap={id:target.o.id,until:shift.time+.25};}
 e.preventDefault();
});
canvas.addEventListener('pointermove',e=>{pointer=point(e);if(down&&Math.hypot(pointer.x-dragOrigin.x,pointer.y-dragOrigin.y)>7){dragging=true;queuedTap=null;pick(pointer,true);}});
canvas.addEventListener('pointerup',()=>{down=false;dragging=false;});
canvas.addEventListener('pointercancel',()=>{down=false;dragging=false;queuedTap=null;});canvas.addEventListener('lostpointercapture',()=>{if(down)queuedTap=null;down=false;dragging=false;});
$('#pause').onclick=pause;$('#sound').onclick=()=>{muted=!muted;saved.sound=!muted;persist();$('#sound').textContent=muted?'♪̸':'♪';if(!muted)tone();};$('#sound').textContent=muted?'♪̸':'♪';document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>{down=false;dragging=false;queuedTap=null;});
window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key.toLowerCase()==='p'){if(mode==='playing')pause();else if(mode==='paused')$('#resume').click();return;}if(mode!=='playing')return;if(['ArrowRight','ArrowLeft',' '].includes(e.key)){keyboardActive=true;e.preventDefault();if(e.key===' ') {const o=shift.items[keyboardIndex%Math.max(1,shift.items.length)];if(o&&o.x>=0&&o.x<=480)pick(o);}else keyboardIndex=Math.max(0,keyboardIndex+(e.key==='ArrowRight'?1:-1));}});
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(points,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
function bean(o){const L=o.len||62;ctx.lineCap='round';ctx.beginPath();if(o.type==='curl'){ctx.moveTo(-22,7);ctx.bezierCurveTo(-42,-24,22,-31,23,-3);ctx.bezierCurveTo(26,25,-14,25,-10,5);ctx.bezierCurveTo(-7,-7,8,-7,7,5);}else{ctx.moveTo(-L/2,0);ctx.quadraticCurveTo(-L*.1,12,L/2,-2);}ctx.strokeStyle='#315323';ctx.lineWidth=o.type==='huge'?14:9;ctx.stroke();const g=ctx.createLinearGradient(0,-8,0,12);g.addColorStop(0,o.type==='yellow'?'#ead36d':'#b5d866');g.addColorStop(.45,o.type==='yellow'?'#c69d37':'#8eb646');g.addColorStop(1,'#4c742d');ctx.strokeStyle=g;ctx.lineWidth=o.type==='huge'?11:6;ctx.stroke();if(o.type!=='curl')line([[L/2,-2],[L/2+5,-5]],'#577632',2);
 if(o.type==='yellow'||o.type==='mud'||o.type==='worm'){for(let i=0;i<(o.type==='mud'?12:4);i++){const x=-L*.4+i*L/(o.type==='mud'?14:5);ellipse(x,Math.sin(i*2.4)*3,2+(i%3),2,o.type==='mud'?'#68462d':'#765e2a');}if(o.type==='worm'){line([[2,0],[3,-7],[9,-9],[13,-5]],'#fae2a0',4);ellipse(13,-5,1,1,'#473b28');}}
}
function object(o){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle||0);ctx.shadowColor='#102b3260';ctx.shadowBlur=4;ctx.shadowOffsetY=4;const t=o.type;
 if(['good','yellow','curl','short','huge','tiny','worm','mud'].includes(t))bean(o);
 else if(t==='frog'||t==='toad'){const c=t==='frog'?'#8dad3f':'#8d8751';ellipse(-15,11,9,5,c);ellipse(15,11,9,5,c);ellipse(0,3,16,13,c);ellipse(-9,-8,7,8,c);ellipse(9,-8,7,8,c);ctx.shadowBlur=0;ellipse(-9,-9,4,4,'#eee3b5');ellipse(9,-9,4,4,'#eee3b5');ellipse(-9,-9,2,3,'#242e1e');ellipse(9,-9,2,3,'#242e1e');line([[-6,7],[0,9],[7,7]],'#4a5b2e',1.5);if(t==='toad')for(let i=0;i<5;i++)ellipse(-10+i*5,3+(i%2)*3,2,2,'#5e653c');}
 else if(t==='snail'){ellipse(0,11,26,7,'#cbb88b');ellipse(-6,-2,18,18,'#9b693e');ctx.shadowBlur=0;ctx.strokeStyle='#d9ab74';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<70;i++){let a=i/7,r=i/5;let x=-6+Math.cos(a)*r,y=-2+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();line([[19,9],[22,-5],[28,-12]],'#bda77c',4);line([[22,-5],[20,-14]],'#bda77c',2);}
 else if(t==='mouse'){ellipse(0,0,21,12,'#b7a18b');ellipse(15,0,11,9,'#b7a18b');ellipse(10,-8,7,8,'#d6b3a5');ellipse(18,-1,2,2,'#24231f');ellipse(27,3,3,2,'#d69392');line([[-20,4],[-30,9],[-37,5]],'#c99891',2);}
 else if(t==='cactus'){ellipse(0,0,21,20,'#749752');for(let i=-2;i<=2;i++)line([[i*6,-15],[i*7,14]],'#bed081',1.5);for(let i=0;i<9;i++){let a=i*.7,x=Math.cos(a)*18,y=Math.sin(a)*18;line([[x,y],[x*1.35,y*1.35]],'#ebdba9',2);}}
 else if(t==='chips'){ctx.fillStyle='#d1a64d';ctx.beginPath();ctx.moveTo(-22,-25);ctx.lineTo(19,-22);ctx.lineTo(25,23);ctx.lineTo(-18,27);ctx.closePath();ctx.fill();line([[-20,-22],[19,-20]],'#e9d495',5);line([[-17,24],[23,21]],'#e9d495',5);ellipse(1,1,15,10,'#f3e5ae');ctx.fillStyle='#6e683f';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('CHIPS',1,4);ellipse(12,17,6,4,'#755336');}
 else if(t==='clod'){for(let i=0;i<9;i++)ellipse(Math.cos(i*2.4)*14,Math.sin(i*2.4)*12,10+(i%4),9,'#694b32');ellipse(-6,-8,11,5,'#8e6947');}
 ctx.restore();}
function arm(x,y,side,closed){const level=saved.equipped,t=C.tools[level],baseX=side?510:-30,baseY=795,elbowX=side?430:50,elbowY=655;ctx.save();const width=20+level*4;
line([[baseX,baseY],[elbowX,elbowY],[x,y+30]],'#34463f',width+8);line([[baseX,baseY],[elbowX,elbowY],[x,y+30]],t.color,width);
if(level>=2){line([[elbowX+(side?-12:12),elbowY-8],[x+(side?-12:12),y+35]],'#829c9c',7);line([[elbowX+(side?-12:12),elbowY-8],[x+(side?-12:12),y+35]],'#d9eee3',3);}
ellipse(elbowX,elbowY,15+level*2,15+level*2,'#76867a');ellipse(elbowX,elbowY,7+level,7+level,t.color);ellipse(x,y+25,12+level*3,14+level*2,'#64736a');
const d=closed?6+level*2:t.jaw,w=7+level*1.6;line([[x-7,y+21],[x-d-5,y+9],[x-d,y-5-level*2]],t.color,w);line([[x+7,y+21],[x+d+5,y+9],[x+d,y-5-level*2]],t.color,w);
if(level>=3){for(const sign of [-1,1]){line([[x+sign*(d+1),y+5],[x+sign*(d-6),y+5]],'#42574d',3);line([[x+sign*(d+1),y-3],[x+sign*(d-6),y-3]],'#42574d',3);}}
if(level===4){ellipse(x,y+23,6,6,'#c6ffff');ctx.strokeStyle='#f5d574';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y+5,closed?20:43,visual*3,visual*3+Math.PI*1.3);ctx.stroke();}
ctx.restore();}
function draw(dt){ctx.clearRect(0,0,480,800);if(bg.complete&&bg.naturalWidth)ctx.drawImage(bg,0,0,480,800);else{ctx.fillStyle='#92a58b';ctx.fillRect(0,0,480,800);ctx.fillStyle='#37786b';ctx.fillRect(0,280,480,300);}ctx.save();ctx.beginPath();ctx.rect(0,285,480,292);ctx.clip();ctx.strokeStyle='#bfe7c013';ctx.lineWidth=1;for(let i=-1;i<12;i++){let x=i*65+(beltOffset%65);ctx.beginPath();ctx.moveTo(x,285);ctx.lineTo(x,577);ctx.stroke();}ctx.setLineDash([8,9]);ctx.strokeStyle='#f4ca5460';ctx.beginPath();ctx.moveTo(469,285);ctx.lineTo(469,580);ctx.stroke();ctx.setLineDash([]);
 if(down&&dragging){ctx.strokeStyle='#fff0a080';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pointer.x,pointer.y,C.tools[saved.equipped].radius,0,Math.PI*2);ctx.stroke();}for(const o of shift.items){object({...o,y:o.y+(reduced?0:Math.sin(visual*19+o.phase)*1.2)});}if(keyboardActive&&mode==='playing'){const o=shift.items[keyboardIndex%Math.max(1,shift.items.length)];if(o){ctx.strokeStyle='#fff6a3';ctx.lineWidth=2;ctx.strokeRect(o.x-38,o.y-23,76,46);}}ctx.restore();
 for(const o of trash)object(o);for(const o of animals)object(o);
 for(let side=0;side<2;side++){const a=grabs.findLast(g=>g.side===side&&g.age<g.duration);if(a){const t=Math.min(1,a.age/a.duration);const ease=t*t*(3-2*t);const tx=a.live?64:399,ty=a.live?748:703;const x=a.o.x+(tx-a.o.x)*ease,y=a.o.y+(ty-a.o.y)*ease-Math.sin(t*Math.PI)*70;arm(x,y,side,true);object({...a.o,x,y});}else arm(side?443:37,639,side,false);}
 if(mode==='playing'||mode==='report'){for(const a of grabs)a.age+=dt;for(const a of grabs.filter(a=>a.age>=a.duration&&!a.deposited)){a.deposited=true;const index=a.live?animals.length:trash.length;if(a.live){if(index<5)animals.push({...a.o,x:42+index*10,y:750-index*3,angle:0});}else{trash.push({...a.o,x:369+(index*23%70),y:703-Math.min(shift.waste,65)*.85+(index%3)*5,angle:index*.8});if(trash.length>36)trash.shift();}}grabs=grabs.filter(a=>a.age<a.duration+.1);}
 for(const p of sparks){p.age+=dt;ctx.save();ctx.globalAlpha=Math.max(0,1-p.age);ctx.font='900 19px system-ui';ctx.textAlign='center';ctx.strokeStyle='#244031';ctx.lineWidth=3;ctx.strokeText(p.text,p.x,p.y-p.age*35);ctx.fillStyle=p.good?'#fff0a2':'#ffd0a5';ctx.fillText(p.text,p.x,p.y-p.age*35);ctx.restore();}sparks=sparks.filter(p=>p.age<1);
}
function frame(now){
 const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
 if(mode==='playing'){
  visual+=dt;beltOffset+=shift.speed*dt;shift.update(dt);
  if(shift.pressureEvent&&shift.pressureEvent.serial>pressureSeen){
   pressureSeen=shift.pressureEvent.serial;$('#quip').textContent=shift.pressureEvent.line;$('#quip').classList.remove('nag');void $('#quip').offsetWidth;$('#quip').classList.add('nag');tone();
  }
  checkUpgrades();
  if(queuedTap){if(shift.time>queuedTap.until||!shift.items.some(o=>o.id===queuedTap.id))queuedTap=null;else if(pick(pointer,false,queuedTap.id))queuedTap=null;}
  if(down&&dragging)pick(pointer,true);
  const low=shift.remaining<=3;
  if(low&&!lowMissAlert)tone(false);lowMissAlert=low;
  if(shift.done)finish();
 }
 draw(mode==='playing'||mode==='report'?dt:0);
 $('#score').textContent=shift.score.toLocaleString();
 const left=Math.max(0,Math.ceil(90-shift.time));$('#clock').textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
 $('#warnings').textContent=shift.missed+' / '+shift.missLimit;
 $('#missBox').classList.toggle('danger',mode==='playing'&&shift.remaining<=3);
 $('#streak').textContent='CLEAN STREAK · '+shift.streak;$('#toolLabel').textContent=C.tools[saved.equipped].name.toUpperCase();
 $('#belt').textContent='BELT '+(shift.speed/47.6).toFixed(1)+'× · NEXT PRESSURE '+(shift.level>=8?'MAX':Math.ceil((shift.level+1)*10-shift.time)+'s');
 $('#upgrade').textContent=saved.unlocked>=C.tools.length-1?'ALL ARMS UNLOCKED':mode==='playing'?'NEXT ARM IN '+Math.max(0,Math.ceil((upgradeMilestone+1)*20-shift.time))+'s':'NEW ARM EVERY 20s';
 $('#notice').textContent=shift.time<shift.noticeUntil?shift.notice:'';
 $('#pressureNotice').textContent=shift.pressureEvent&&shift.time-shift.pressureEvent.at<3?'MORE BEANS · SPEED ↑ · MISS LIMIT +5':'';
 requestAnimationFrame(frame);
}
menu();requestAnimationFrame(frame);
