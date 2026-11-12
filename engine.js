(function(root){
'use strict';
const BAD=['yellow','curl','short','huge','tiny','worm'];
const ANIMALS=['frog','toad','mouse','snail'];
class Shift {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){
  Object.assign(this,{time:0,score:0,missed:0,streak:0,bestStreak:0,picked:0,waste:0,rescued:0,goodSaved:0,goodWasted:0,items:[],batches:{},id:0,nextSpawn:.75,nextMud:16,nextOdd:7,done:false,won:false,notice:'',noticeUntil:0,pressureEvent:null,pressureLevel:0,intervalMissed:0,intervalWasted:0});
  // Start with a populated working area and three plainly visible rejects.
  for(let column=0;column<4;column++)for(let row=0;row<6;row++){
   const type=(column===0&&row===1)?'yellow':(column===1&&row===4)?'curl':(column===2&&row===2)?'short':'good';
   this.add(type,null,45+column*104+(this.random()-.5)*30,310+row*45+(this.random()-.5)*16);
  }
 }
 get level(){return Math.min(8,Math.floor((this.time+1e-8)/10));}
 get missLimit(){return 10+5*this.level;}
 get remaining(){return this.missLimit-this.missed;}
 get speed(){return 47.6+this.level*3;}
 get spawnInterval(){return .95-this.level*.055;}
 get waveSize(){return 4+(this.level>=2?1:0)+(this.level>=5?1:0);}
 say(s){this.notice=s;this.noticeUntil=this.time+2.8;}
 add(type='good',batch=null,x=-60,y){
  const r=this.random;
  const item={id:++this.id,type,batch,x,y:y??310+Math.floor(r()*6)*45+(r()-.5)*8,angle:(r()-.5)*.7,phase:r()*6.28,len:type==='huge'?83:type==='short'?21:type==='tiny'?27:48+r()*12};
  const baseY=item.y;
  for(const offset of [0,16,-16,24,-24,32,-32]){
   const candidate=Math.max(303,Math.min(550,baseY+offset));
   if(!this.items.some(o=>Math.abs(o.x-item.x)<30&&Math.abs(o.y-candidate)<14)){item.y=candidate;break;}
  }
  this.items.push(item);return item;
 }
 progress(points){this.streak++;this.bestStreak=Math.max(this.streak,this.bestStreak);this.score+=points;if(this.streak%20===0){this.score+=30;this.say('CLEAN STREAK ×'+this.streak+'  +30');}}
 pick(id){
  if(this.done)return null;
  const i=this.items.findIndex(x=>x.id===id);if(i<0)return null;
  const o=this.items.splice(i,1)[0];
  if(o.type==='good'){
   this.score=Math.max(0,this.score-18);this.goodWasted++;this.intervalWasted++;this.streak=0;
  }else{
   this.progress(20);this.picked++;
   if(ANIMALS.includes(o.type))this.rescued++;
   if(o.batch){const b=this.batches[o.batch];b.left--;if(b.left===0&&!b.missed){this.score+=100;this.say('BATCH SAVED! +100');}}
  }
  if(!ANIMALS.includes(o.type))this.waste++;
  return o;
 }
 miss(o){
  if(this.done)return;
  if(o.type==='good'){this.goodSaved++;this.progress(2);return;}
  this.streak=0;
  // Every dirty bean is a miss. Batch membership controls only the clear bonus.
  if(o.batch){const b=this.batches[o.batch];b.left--;b.missed=true;}
  this.missed++;this.intervalMissed++;
  if(this.missed>this.missLimit){this.done=true;this.won=false;}
 }
 wave(){
  const rows=[0,1,2,3,4,5];
  for(let i=5;i>0;i--){const j=Math.floor(this.random()*(i+1));[rows[i],rows[j]]=[rows[j],rows[i]];}
  for(let i=0;i<this.waveSize;i++){
   const type=this.random()<.30+this.level*.016?BAD[Math.floor(this.random()*BAD.length)]:'good';
   this.add(type,null,-48-this.random()*12,310+rows[i]*45+(this.random()-.5)*10);
  }
 }
 muddyBatch(){
  const key='mud'+this.id;this.batches[key]={left:9,missed:false};
  const row=Math.floor(this.random()*4);
  for(let i=0;i<9;i++)this.add(i===0?'clod':'mud',key,-55-Math.floor(i/3)*45,310+(row+i%3)*45);
 }
 pressure(){
  const level=this.level;
  const idle=['Faster. We’re behind.','Be more selective.','You have TWO hands. Use them.','Keep moving. The belt does.'];
  let line;
  if(this.intervalWasted>=3)line='We sell beans. Please leave some.';
  else if(this.intervalMissed>=3)line='Those are going to customers.';
  else if(this.intervalMissed===0&&this.intervalWasted===0)line='Good. You can handle a faster belt.';
  else line=idle[(level-1)%idle.length];
  this.pressureEvent={serial:level,line,at:this.time,limit:this.missLimit};
  this.pressureLevel=level;this.intervalMissed=0;this.intervalWasted=0;
 }
 step(dt){
  this.time=Math.min(90,this.time+dt);if(90-this.time<1e-8)this.time=90;
  if(this.level>this.pressureLevel)this.pressure();
  while(this.time>=this.nextSpawn){this.wave();this.nextSpawn+=this.spawnInterval;}
  if(this.time>=this.nextOdd){this.nextOdd+=7+this.random()*3;const kinds=['frog','snail','mouse','toad','cactus','chips'];this.add(kinds[Math.floor(this.random()*kinds.length)]);}
  if(this.time>=this.nextMud){this.nextMud+=16;this.muddyBatch();this.say('MUDDY BATCH INCOMING');}
  const survivors=[];
  for(const o of this.items){o.x+=this.speed*dt;if(o.x>530){this.miss(o);}else survivors.push(o);if(this.done)break;}
  if(!this.done)this.items=survivors;
  if(this.time>=90&&!this.done){this.done=true;this.won=true;this.say('SHIFT COMPLETE');}
 }
 update(dt){
  if(this.done||!Number.isFinite(dt)||dt<=0)return;
  let left=Math.min(dt,90-this.time);
  while(left>1e-8&&!this.done){const step=Math.min(.05,left);this.step(step);left-=step;}
 }
}
if(typeof module!=='undefined')module.exports=Shift;else root.BeanShift=Shift;
})(typeof window!=='undefined'?window:globalThis);
