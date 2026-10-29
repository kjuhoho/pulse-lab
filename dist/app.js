'use strict';
const $=id=>document.getElementById(id);
let I18N=null, LANG='en';
function T(key,vars){let s=(I18N.strings[LANG]&&I18N.strings[LANG][key])||I18N.strings.en[key]||key;if(vars)for(const k in vars)s=s.split('{'+k+'}').join(vars[k]);return s;}
async function loadI18n(){
  I18N=await fetch('i18n.json').then(r=>r.json());
  const params=new URLSearchParams(location.search);
  let l=null;try{l=params.get('lang')||localStorage.getItem('lang');}catch{}
  LANG=(I18N.languages&&I18N.languages[l])?l:'en';
  document.documentElement.lang=LANG;
  document.title=T('page.title');
}
function applyI18nDom(){
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=T(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(el=>el.innerHTML=T(el.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',T(el.dataset.i18nAria)));
  const sel=$('langSelect');
  if(sel){
    sel.innerHTML=Object.entries(I18N.languages).map(([k,n])=>`<option value="${k}">${n}</option>`).join('');
    sel.value=LANG;
    sel.onchange=e=>{const v=e.target.value;try{localStorage.setItem('lang',v);}catch{}const p=new URLSearchParams(location.search);p.set('lang',v);location.search=p.toString();};
  }
}

(async()=>{
await loadI18n();
applyI18nDom();

const THEMES={
  signal:{label:'SIGNAL',shape:'bar',lane:['#ff2f8f','#36e5d6','#36e5d6','#ff2f8f'],perfect:'#d6ff4d',great:'#ff2f8f',good:'#36e5d6',miss:'#ff5468',glow:'#ff2f8f',waveOn:'#36e5d6',waveOff:'#272c38',heroOn:'#ff2f8f',heroOff:'#36e5d6'},
  arcade:{label:'ARCADE',shape:'diamond',lane:['#b347ff','#ffd93d','#ffd93d','#b347ff'],perfect:'#39ff6a',great:'#b347ff',good:'#ffd93d',miss:'#ff4d6a',glow:'#b347ff',waveOn:'#ffd93d',waveOff:'#2a2038',heroOn:'#b347ff',heroOff:'#ffd93d'},
  mono:{label:'MONO',shape:'line',lane:['#ffffff','#aaaaaa','#aaaaaa','#ffffff'],perfect:'#ffffff',great:'#cccccc',good:'#999999',miss:'#ff5a5a',glow:'#ffffff',waveOn:'#cccccc',waveOff:'#2a2a2a',heroOn:'#ffffff',heroOff:'#777777'},
  sunset:{label:'SUNSET',shape:'circle',lane:['#ff6b4a','#ffb84d','#ffb84d','#ff6b4a'],perfect:'#ffe14d',great:'#ff6b4a',good:'#ffb84d',miss:'#ff3b3b',glow:'#ff6b4a',waveOn:'#ffb84d',waveOff:'#331c18',heroOn:'#ff6b4a',heroOff:'#ffb84d'}
};
let themeKey='signal',unlocked=['signal'],playedTitles=[];
try{themeKey=localStorage.getItem('pulseLabTheme')||'signal';unlocked=JSON.parse(localStorage.getItem('pulseLabUnlocks')||'["signal"]');playedTitles=JSON.parse(localStorage.getItem('pulseLabPlayed')||'[]');}catch{}
if(!unlocked.includes(themeKey))themeKey='signal';
function theme(){return THEMES[themeKey];}
function unlockTheme(key){if(unlocked.includes(key))return;unlocked.push(key);try{localStorage.setItem('pulseLabUnlocks',JSON.stringify(unlocked));}catch{}renderThemeButtons();status(T('theme.unlockedToast',{name:THEMES[key].label}),false);}
function setTheme(key){if(!unlocked.includes(key))return;themeKey=key;try{localStorage.setItem('pulseLabTheme',key);}catch{}renderThemeButtons();$('themeHint').textContent='';}
function renderThemeButtons(){document.querySelectorAll('[data-theme]').forEach(b=>{const k=b.dataset.theme,locked=!unlocked.includes(k);b.classList.toggle('selected',k===themeKey&&!locked);b.classList.toggle('locked',locked);b.setAttribute('aria-pressed',k===themeKey&&!locked);});}
let particles=[],ripples=[];
function spawnHitEffect(lane,type){const w=canvas.clientWidth,h=canvas.clientHeight,pad=26,laneW=(w-2*pad)/4,line=h-30,cx=pad+lane*laneW+laneW/2,col=theme()[type]||theme().glow;const count=type==='perfect'?16:type==='great'?10:type==='good'?6:4;for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=1.2+Math.random()*(type==='perfect'?4:2.3);particles.push({x:cx,y:line,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,life:1,color:col,size:2+Math.random()*(type==='perfect'?3.2:2)});}if(type==='perfect')ripples.push({x:cx,y:line,r:4,life:1,color:col});}
function updateEffects(dt){particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=0.012*dt;p.life-=dt/420;});particles=particles.filter(p=>p.life>0);ripples.forEach(r=>{r.r+=dt*.22;r.life-=dt/380;});ripples=ripples.filter(r=>r.life>0);}
function drawEffects(){particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;ripples.forEach(r=>{ctx.globalAlpha=Math.max(0,r.life*.6);ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r*7,0,Math.PI*2);ctx.stroke();});ctx.globalAlpha=1;}
function popJudgment(el){try{el.animate([{transform:'scale(.55)',opacity:0},{transform:'scale(1.18)',opacity:1,offset:.55},{transform:'scale(1)',opacity:1}],{duration:260,easing:'cubic-bezier(.2,1.5,.4,1)'});}catch{}}
function checkTrackDiversityUnlock(title){if(!playedTitles.includes(title)){playedTitles.push(title);try{localStorage.setItem('pulseLabPlayed',JSON.stringify(playedTitles));}catch{}if(playedTitles.length>=2)unlockTheme('sunset');}}
let bgKey='void';try{bgKey=localStorage.getItem('pulseLabBg')||'void';}catch{}
function setBg(key){bgKey=key;try{localStorage.setItem('pulseLabBg',key);}catch{}renderBgButtons();}
function renderBgButtons(){document.querySelectorAll('[data-bg]').forEach(b=>{const on=b.dataset.bg===bgKey;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});}
let bgParticles=[];for(let i=0;i<26;i++)bgParticles.push({x:Math.random(),y:Math.random(),vy:.04+Math.random()*.08,size:1+Math.random()*2.4,drift:(Math.random()-.5)*.02});
function drawBackground(w,h){
  if(bgKey==='cover'){
    const img=$('recordCover');
    if(img&&img.complete&&img.naturalWidth){
      const ir=img.naturalWidth/img.naturalHeight,cr=w/h;let dw,dh,dx,dy;
      if(ir>cr){dh=h;dw=h*ir;dx=(w-dw)/2;dy=0;}else{dw=w;dh=w/ir;dx=0;dy=(h-dh)/2;}
      ctx.save();ctx.filter='blur(22px) brightness(.4) saturate(1.3)';ctx.drawImage(img,dx,dy,dw,dh);ctx.restore();
      ctx.fillStyle='#07080b55';ctx.fillRect(0,0,w,h);
      return;
    }
  }
  if(bgKey==='cover'||bgKey==='glow'){
    const th=theme(),grad=ctx.createRadialGradient(w*.5,h*.38,0,w*.5,h*.5,Math.max(w,h)*.75);
    grad.addColorStop(0,th.glow+'22');grad.addColorStop(1,'#00000000');
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  }
  if(bgKey==='glow'){
    const th=theme();
    bgParticles.forEach(p=>{p.y-=p.vy*.01;p.x+=p.drift*.01;if(p.y<-.05)p.y=1.05;if(p.x<-.05)p.x=1.05;if(p.x>1.05)p.x=-.05;ctx.globalAlpha=.35;ctx.fillStyle=th.glow;ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.size,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1;
  }
}
let scorePops=[];
function spawnScorePop(lane,points){const w=canvas.clientWidth,pad=26,laneW=(w-2*pad)/4,line=canvas.clientHeight-30;scorePops.push({x:pad+lane*laneW+laneW/2,y:line-14,text:'+'+points,life:1,color:theme().perfect});}
function updateScorePops(dt){scorePops.forEach(p=>{p.y-=dt*.045;p.life-=dt/650;});scorePops=scorePops.filter(p=>p.life>0);}
function drawScorePops(){scorePops.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.font='700 13px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.fillText(p.text,p.x,p.y);});ctx.globalAlpha=1;ctx.textAlign='left';}
let shakeUntil=0;
let perfectFlashUntil=0;
function comboMilestoneBurst(lane){const th=theme(),w=canvas.clientWidth,pad=26,laneW=(w-2*pad)/4,line=canvas.clientHeight-30,cx=pad+lane*laneW+laneW/2;for(let i=0;i<26;i++){const angle=Math.random()*Math.PI*2,speed=2+Math.random()*5;particles.push({x:cx,y:line,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1.4,life:1,color:i%2?th.perfect:th.glow,size:2+Math.random()*3.4});}ripples.push({x:cx,y:line,r:4,life:1,color:th.perfect});}
let audio, gain, buffer, source, worker, analysis, chart=[], notes=[], state='empty', difficulty='normal', controlScheme='arrows', startAt=0, pausedTime=0, generation=0, loading=false, lastFrameTime=0;
let score=0,combo=0,maxCombo=0,earned=0,judged=0,cursor=0,counts={perfect:0,great:0,good:0,miss:0},flash=[0,0,0,0],feedbackUntil=0,trackTitle='';
const canvas=$('gameCanvas'), ctx=canvas.getContext('2d'), wave=$('waveform'), wctx=wave.getContext('2d'), hero=$('heroScope'), hctx=hero.getContext('2d');
const fmt=t=>`${Math.floor(Math.max(0,t)/60)}:${String(Math.floor(Math.max(0,t)%60)).padStart(2,'0')}`;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function ensureContext(){if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();gain=audio.createGain();gain.gain.value=+$('volume').value/100;gain.connect(audio.destination);}return audio;}
async function audioReady(){ensureContext();await audio.resume();}
function stopSource(){if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}}
function songTime(){return state==='playing'?audio.currentTime-startAt:pausedTime;}
function lockSettings(lock){document.querySelectorAll('[data-difficulty],[data-control],#speed,#offset').forEach(el=>el.disabled=lock);}
function applyControlScheme(){const scheme=RhythmControls.schemes[controlScheme],dirKeys=['dir.left','dir.up','dir.down','dir.right'],schemeName=controlScheme==='wasd'?'WASD':T('control.arrows');document.querySelectorAll('[data-lane]').forEach((b,i)=>{b.querySelector('kbd').textContent=scheme.labels[i];b.querySelector('span').textContent=T(dirKeys[i]);});$('shortcutLabel').textContent=`${scheme.labels.join(' ')} · ${T('touch.support')}`;$('gameCanvas').setAttribute('aria-label',T('canvas.aria',{scheme:schemeName}));const guideKeys=$('guideKeysLabel');if(guideKeys)guideKeys.textContent=scheme.labels.join(' · ');}
function updateButtons(){const running=state==='playing';$('pauseButton').disabled=!['playing','paused'].includes(state);$('pauseButton').textContent=running?'Ⅱ':'▶';$('pauseButton').setAttribute('aria-label',running?T('pause.ariaPause'):T('pause.ariaResume'));$('restartButton').disabled=!buffer||loading||!chart.length;$('startButton').disabled=!buffer||loading||!chart.length||running;$('startButton').textContent=state==='paused'?T('start.resume'):state==='ended'?T('start.replay'):T('start.play');$('stageState').textContent=({empty:T('state.ready'),loading:T('state.loading'),ready:T('state.trackReady'),playing:T('state.playing'),paused:T('state.paused'),ended:T('state.ended')})[state];document.body.classList.toggle('playing',running);lockSettings(running||loading);}
function resetScore(){score=combo=maxCombo=earned=judged=cursor=0;counts={perfect:0,great:0,good:0,miss:0};flash.fill(0);$('feedback').textContent='';feedbackUntil=0;updateScore();}
function updateScore(){$('score').textContent=String(score).padStart(6,'0');$('accuracy').innerHTML=`${judged?(earned/judged*100).toFixed(1):'—'}<i>%</i>`;$('maxCombo').textContent=maxCombo;}
function setOverlay(title,description,buttonText,action){const el=$('overlay');el.replaceChildren();const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='PULSE LAB / 4 KEY';const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=description;el.append(eyebrow,h,p);if(buttonText){const b=document.createElement('button');b.className='outline';b.textContent=buttonText;b.onclick=action;el.append(b);}el.hidden=false;}
function rebuild(){if(!analysis)return;chart=RhythmEngine.makeChart(analysis,difficulty);notes=chart.map(n=>({...n,hit:false}));pausedTime=0;state='ready';resetScore();$('noteCount').textContent=chart.length;$('progress').style.width='0%';$('elapsed').textContent='0:00';const keysLabel=RhythmControls.schemes[controlScheme].labels.join(' ');setOverlay(chart.length?T('overlay.ready.titleOk'):T('overlay.ready.titleEmpty'),chart.length?T('overlay.ready.subOk',{n:chart.length,diff:difficulty.toUpperCase(),keys:keysLabel}):T('overlay.ready.subEmpty'),chart.length?T('overlay.ready.cta'):null,()=>start());updateButtons();}
function startAnalysis(decoded,title,isDemo=false){buffer=decoded;trackTitle=title;loading=true;state='loading';updateButtons();status(T('status.analyzing'));setOverlay(T('overlay.loading.title'),T('overlay.loading.sub'));const job=generation;const mono=new Float32Array(buffer.length);for(let ch=0;ch<buffer.numberOfChannels;ch++){const channel=buffer.getChannelData(ch);for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/buffer.numberOfChannels;}
  worker=new Worker('analysis-worker.js');worker.onmessage=({data})=>{if(job!==generation)return;worker.terminate();worker=null;if(data.error){fail(T('status.analysisFail'));return;}analysis=data.result;loading=false;$('trackName').textContent=title;$('trackType').textContent=isDemo?T('track.demoType'):T('track.localType');$('trackSub').textContent=isDemo?T('track.demoSub'):T('track.localSub');if(!isDemo)checkTrackDiversityUnlock(title);$('bpm').textContent=analysis.bpm||'—';$('duration').textContent=fmt(buffer.duration);$('totalTime').textContent=fmt(buffer.duration);rebuild();status(chart.length?T('status.doneWithNotes',{n:analysis.peaks.length}):T('status.doneNoNotes'),!chart.length);drawWave();};worker.onerror=()=>fail(T('status.analysisEngineFail'));worker.postMessage({samples:mono,sampleRate:buffer.sampleRate},[mono.buffer]);}
function beginLoad(){generation++;stopSource();if(worker){worker.terminate();worker=null;}loading=true;state='loading';analysis=null;buffer=null;chart=[];notes=[];pausedTime=0;resetScore();updateButtons();$('progress').style.width='0%';$('trackName').textContent=T('track.readingFile');$('trackSub').textContent='';['bpm','duration','noteCount'].forEach(id=>$(id).textContent='—');$('elapsed').textContent=$('totalTime').textContent='0:00';drawWave();return generation;}
function fail(message){if(worker){worker.terminate();worker=null;}loading=false;state='empty';buffer=null;analysis=null;chart=[];notes=[];$('trackName').textContent=T('track.selectAgain');status(message,true);setOverlay(T('overlay.fail.title'),message,T('overlay.fail.cta'),()=>demo());updateButtons();}
async function loadFile(file){if(!file)return;if(file.size>50*1024*1024){status(T('status.fileTooLarge'),true);return;}const job=beginLoad();setOverlay(T('overlay.uploading.title'),T('overlay.uploading.sub'));status(T('status.decoding'));try{await audioReady();const bytes=await file.arrayBuffer();if(job!==generation)return;const decoded=await audio.decodeAudioData(bytes);if(job!==generation)return;if(decoded.duration>600){fail(T('status.durationTooLong'));return;}if(decoded.duration<2){fail(T('status.durationTooShort'));return;}startAnalysis(decoded,file.name.replace(/\.[^.]+$/,''));}catch(e){if(job===generation)fail(T('status.fileFail'));}}
async function loadFromUrl(url,title){const job=beginLoad();setOverlay(T('overlay.remote.title'),T('overlay.remote.sub'));status(T('status.downloading'));try{ensureContext();const res=await fetch(url);if(!res.ok)throw new Error('fetch failed');const bytes=await res.arrayBuffer();if(job!==generation)return;const decoded=await audio.decodeAudioData(bytes);if(job!==generation)return;if(decoded.duration>600){fail(T('status.durationTooLong'));return;}if(decoded.duration<2){fail(T('status.durationTooShort'));return;}startAnalysis(decoded,title||'Track');}catch(e){if(job===generation)fail(T('status.remoteFail'));}}
async function demo(autoStart=false){beginLoad();try{await audioReady();const sr=audio.sampleRate,b=audio.createBuffer(1,sr*32,sr),d=b.getChannelData(0);let seed=7351;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296*2-1;};for(let beat=0;beat<60;beat++){const t=1+beat*.5;const bass=[130.81,130.81,155.56,116.54][Math.floor(beat/8)%4];for(let j=0;j<sr*.24&&Math.floor(t*sr)+j<d.length;j++){const s=j/sr;d[Math.floor(t*sr)+j]+=.52*Math.sin(2*Math.PI*(46*s+70*.024*(1-Math.exp(-s/.024))))*Math.exp(-s*24);if(beat%2)d[Math.floor(t*sr)+j]+=.17*rand()*Math.exp(-s*27);d[Math.floor(t*sr)+j]+=.14*Math.sin(2*Math.PI*bass*s)*Math.exp(-s*12);}for(let sub=0;sub<2;sub++){const start=Math.floor((t+sub*.25)*sr);for(let j=0;j<sr*.055&&start+j<d.length;j++)d[start+j]+=.08*rand()*Math.exp(-j/sr*80);}if(beat%2===0){const start=Math.floor((t+.25)*sr),freq=bass*[2,3,2.5,4][beat%4];for(let j=0;j<sr*.18&&start+j<d.length;j++)d[start+j]+=.09*Math.sin(2*Math.PI*freq*j/sr)*Math.exp(-j/sr*16);}}
startAnalysis(b,'Midnight Circuit',true);if(autoStart){const job=generation;const timer=setInterval(()=>{if(job!==generation||!loading){clearInterval(timer);if(job===generation&&state==='ready')start();}},80);}}catch{fail(T('status.audioPermissionFail'));}}
async function start(restart=false){if(!buffer||!chart.length||loading)return;try{await audioReady();}catch{status(T('status.audioStartFail'),true);return;}if(state==='playing'&&!restart)return;const resume=state==='paused'&&!restart;stopSource();if(!resume){notes=chart.map(n=>({...n,hit:false}));resetScore();pausedTime=-2.5;}source=audio.createBufferSource();source.buffer=buffer;source.connect(gain);const t=pausedTime;startAt=audio.currentTime-t;source.start(audio.currentTime+Math.max(0,-t),Math.max(0,t));state='playing';$('overlay').hidden=true;updateButtons();}
function pause(){if(state!=='playing')return;pausedTime=songTime();stopSource();state='paused';setOverlay(T('overlay.paused.title'),T('overlay.paused.sub'),T('overlay.paused.cta'),()=>start());document.querySelectorAll('[data-lane]').forEach(b=>b.classList.remove('active'));updateButtons();}
function result(){stopSource();state='ended';pausedTime=buffer.duration;unlockTheme('arcade');const accuracy=notes.length?earned/notes.length*100:0;const rank=accuracy>=98?'S':accuracy>=90?'A':accuracy>=80?'B':accuracy>=65?'C':'D';setOverlay(T('overlay.result.title',{rank}),T('overlay.result.sub',{title:trackTitle,acc:accuracy.toFixed(1),combo:maxCombo}),T('overlay.result.cta'),()=>start(true));const grid=document.createElement('div');grid.className='result-grid';for(const [k,v] of Object.entries(counts)){const cell=document.createElement('div'),b=document.createElement('b');b.textContent=v;cell.append(b,document.createTextNode(k.toUpperCase()));grid.append(cell);}$('overlay').insertBefore(grid,$('overlay').lastChild);updateButtons();}
function register(note,type){note.hit=true;judged++;counts[type]++;const weight={perfect:1,great:.75,good:.4,miss:0}[type];earned+=weight;const now=performance.now();if(type==='miss'){combo=0;shakeUntil=now+180;}else{combo++;maxCombo=Math.max(maxCombo,combo);const pts=Math.round(weight*1000);score+=pts;spawnScorePop(note.lane,pts);if(maxCombo>=30)unlockTheme('mono');if(type==='perfect')perfectFlashUntil=now+220;if(combo>0&&combo%10===0)comboMilestoneBurst(note.lane);}updateScore();$('feedback').innerHTML=`${type.toUpperCase()}<small>${combo?combo+' COMBO':T('combo.next')}</small>`;$('feedback').style.color=theme()[type];popJudgment($('feedback'));feedbackUntil=now+550;spawnHitEffect(note.lane,type);}
function hit(lane){flash[lane]=performance.now();if(state!=='playing')return;const t=songTime()-+$('offset').value/1000;let candidate=null,delta=Infinity;for(let i=cursor;i<notes.length;i++){const n=notes[i];if(n.time>t+.16)break;if(!n.hit&&n.lane===lane&&Math.abs(n.time-t)<delta){candidate=n;delta=Math.abs(n.time-t);}}if(candidate){const judgment=RhythmEngine.judge(delta);if(judgment)register(candidate,judgment);}}
function drawWave(){const r=wave.getBoundingClientRect(),dpr=devicePixelRatio||1;wave.width=Math.round(r.width*dpr);wave.height=Math.round(52*dpr);wctx.setTransform(dpr,0,0,dpr,0,0);const values=analysis?.wave||Array.from({length:80},(_,i)=>.12+Math.sin(i*1.7)**2*.2),step=r.width/values.length;values.forEach((v,i)=>{wctx.fillStyle=analysis?theme().waveOn:theme().waveOff;const h=Math.max(2,v*46);wctx.fillRect(i*step,26-h/2,Math.max(1,step-1),h);});}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);drawWave();}new ResizeObserver(resize).observe($('gameArea'));
function sizeHero(){const r=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);hero.width=Math.round(r.width*dpr);hero.height=Math.round(Math.max(1,r.height)*dpr);hctx.setTransform(dpr,0,0,dpr,0,0);}new ResizeObserver(sizeHero).observe(hero.parentElement);sizeHero();
function drawHero(now){const w=hero.clientWidth,h=hero.clientHeight;if(!w||!h)return;hctx.clearRect(0,0,w,h);const mid=h/2,th=theme();
  if(analysis&&analysis.wave&&analysis.wave.length){
    const values=analysis.wave,step=w/values.length,progress=buffer?Math.min(1,Math.max(0,songTime()/buffer.duration)):0;
    values.forEach((v,i)=>{const x=i*step,barH=Math.max(2,v*h*.86),played=state==='playing'&&i/values.length<=progress;hctx.fillStyle=played?th.heroOn:th.heroOff+'4a';hctx.fillRect(x,mid-barH/2,Math.max(1,step-1),barH);});
    if(state==='playing'){const x=progress*w;hctx.fillStyle=th.perfect;hctx.shadowBlur=10;hctx.shadowColor=th.perfect;hctx.fillRect(x-1,0,2,h);hctx.shadowBlur=0;}
  }else{
    hctx.strokeStyle=th.heroOn+'66';hctx.lineWidth=2;hctx.beginPath();
    for(let x=0;x<=w;x+=4){const y=mid+Math.sin(x*.015+now*.0016)*h*.22*Math.sin(now*.0004+x*.002)+Math.sin(x*.05+now*.003)*h*.05;x===0?hctx.moveTo(x,y):hctx.lineTo(x,y);}
    hctx.stroke();
    hctx.strokeStyle=th.heroOff+'55';hctx.lineWidth=1.5;hctx.beginPath();
    for(let x=0;x<=w;x+=4){const y=mid+Math.sin(x*.02+now*.0021+2)*h*.13;x===0?hctx.moveTo(x,y):hctx.lineTo(x,y);}
    hctx.stroke();
  }
}
function drawNote(cx,cy,lw,color,shape){ctx.fillStyle=color;ctx.shadowColor=color+'77';
  if(shape==='diamond'){const s=lw*.4;ctx.shadowBlur=10;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.PI/4);ctx.fillRect(-s/2,-s/2,s,s);ctx.restore();ctx.shadowBlur=0;ctx.fillStyle='#ffffffa0';ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.PI/4);ctx.fillRect(-s/2,-s/2,s,2);ctx.restore();}
  else if(shape==='circle'){ctx.shadowBlur=10;ctx.beginPath();ctx.arc(cx,cy,lw*.24,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffffffa0';ctx.beginPath();ctx.arc(cx,cy-lw*.08,lw*.08,0,Math.PI*2);ctx.fill();}
  else if(shape==='line'){ctx.shadowBlur=16;ctx.fillRect(cx-lw*.42,cy-2,lw*.84,4);ctx.shadowBlur=0;}
  else{ctx.shadowBlur=10;ctx.fillRect(cx-lw*.42,cy-6,lw*.84,12);ctx.shadowBlur=0;ctx.fillStyle='#ffffff80';ctx.fillRect(cx-lw*.42,cy-6,lw*.84,2);}
}
function frame(now){const dt=lastFrameTime?Math.min(50,now-lastFrameTime):16;lastFrameTime=now;drawHero(now);const th=theme(),w=canvas.clientWidth,h=canvas.clientHeight,pad=26,laneW=(w-2*pad)/4,line=h-30;
  ctx.clearRect(0,0,w,h);
  drawBackground(w,h);
  const shaking=now<shakeUntil;
  ctx.save();
  if(shaking){const k=(shakeUntil-now)/180;ctx.translate((Math.random()-.5)*8*k,(Math.random()-.5)*6*k);}
  const laneAlpha=bgKey==='void'?1:.62;
  for(let i=0;i<4;i++){ctx.globalAlpha=laneAlpha;ctx.fillStyle=i%2?'#0d0f16':'#12151e';ctx.fillRect(pad+i*laneW,0,laneW-1,h);ctx.globalAlpha=1;ctx.strokeStyle='#242836';ctx.beginPath();ctx.moveTo(pad+i*laneW,0);ctx.lineTo(pad+i*laneW,h);ctx.stroke();if(now-flash[i]<140){const gradient=ctx.createLinearGradient(0,line-100,0,line);gradient.addColorStop(0,th.lane[i]+'00');gradient.addColorStop(1,th.lane[i]+'60');ctx.fillStyle=gradient;ctx.fillRect(pad+i*laneW,line-100,laneW,100);}}
  const t=songTime(),offset=+$('offset').value/1000,travel=2.1/+$('speed').value,visualTime=t-offset;
  ctx.strokeStyle='#1c202c';ctx.lineWidth=1;for(let i=0;i<7;i++){const y=((i*h/6+(state==='playing'?t*line/travel:0))%h+h)%h;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();}
  ctx.shadowBlur=12;ctx.shadowColor=th.glow;ctx.fillStyle='#ffffff';ctx.fillRect(pad,line,w-2*pad,2);ctx.shadowBlur=0;
  if(state==='playing'){for(let i=cursor;i<notes.length;i++){const n=notes[i];if(n.time>visualTime+travel)break;if(n.hit)continue;if(visualTime-n.time>.16){register(n,'miss');continue;}const y=line-(n.time-visualTime)/travel*line,cx=pad+n.lane*laneW+laneW/2;
      ctx.globalAlpha=.16;drawNote(cx,y+16,laneW,th.lane[n.lane],th.shape);ctx.globalAlpha=.3;drawNote(cx,y+8,laneW,th.lane[n.lane],th.shape);ctx.globalAlpha=1;
      drawNote(cx,y,laneW,th.lane[n.lane],th.shape);}while(cursor<notes.length&&notes[cursor].hit)cursor++;
    $('elapsed').textContent=fmt(Math.min(t,buffer.duration));$('progress').style.width=`${Math.min(100,Math.max(0,t/buffer.duration*100))}%`;
    if(t<0){$('feedback').textContent=Math.ceil(-t);feedbackUntil=now+50;}else if(t<.18){$('feedback').textContent='GO!';feedbackUntil=now+150;}
    if(t>=buffer.duration+Math.max(0,offset)+.18)result();
  }
  updateEffects(dt);drawEffects();updateScorePops(dt);drawScorePops();
  if(now<perfectFlashUntil){const k=(perfectFlashUntil-now)/220,grad=ctx.createRadialGradient(w/2,h*.6,0,w/2,h*.6,Math.max(w,h)*.7);grad.addColorStop(0,th.perfect+Math.round(k*60).toString(16).padStart(2,'0'));grad.addColorStop(1,'#00000000');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);}
  ctx.restore();
  if(now>feedbackUntil)$('feedback').textContent='';requestAnimationFrame(frame);
}
$('fileInput').addEventListener('change',e=>{loadFile(e.target.files[0]);e.target.value='';});const zone=$('dropZone');['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('dragging');}));['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('dragging');}));zone.addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
$('demoButton').onclick=()=>demo();$('overlayDemo').onclick=()=>demo(true);$('startButton').onclick=()=>start();$('restartButton').onclick=()=>start(true);$('pauseButton').onclick=()=>state==='playing'?pause():start();
document.querySelectorAll('[data-difficulty]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.difficulty===difficulty);b.onclick=()=>{if(loading||state==='playing')return;difficulty=b.dataset.difficulty;document.querySelectorAll('[data-difficulty]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});rebuild();};});
document.querySelectorAll('[data-control]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.control===controlScheme);b.onclick=()=>{if(loading||state==='playing')return;controlScheme=b.dataset.control;document.querySelectorAll('[data-control]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});applyControlScheme();};});
applyControlScheme();
document.querySelectorAll('[data-theme]').forEach(b=>{b.onclick=()=>{const k=b.dataset.theme;if(!unlocked.includes(k)){$('themeHint').textContent=T('theme.unlock.'+k);return;}setTheme(k);};});
renderThemeButtons();
document.querySelectorAll('[data-bg]').forEach(b=>{b.onclick=()=>setBg(b.dataset.bg);});
renderBgButtons();
$('speed').oninput=()=>{$('speedValue').textContent=(+$('speed').value).toFixed(1)+'×';};$('offset').oninput=()=>{$('offsetValue').textContent=(+$('offset').value>0?'+':'')+$('offset').value+' ms';};$('volume').oninput=()=>{$('volumeValue').textContent=$('volume').value+'%';if(gain)gain.gain.setTargetAtTime(+$('volume').value/100,audio.currentTime,.02);};
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const editing=['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName);const lane=RhythmControls.laneForKey(e.code,controlScheme);if(lane>=0&&!editing){e.preventDefault();if(e.repeat)return;document.querySelector(`[data-lane="${lane}"]`).classList.add('active');hit(lane);}if((e.code==='Space'&&!editing)||e.code==='Escape'){e.preventDefault();if(e.repeat)return;if(state==='playing')pause();else if(state==='paused')start();}});window.addEventListener('keyup',e=>{const lane=RhythmControls.laneForKey(e.code,controlScheme);if(lane>=0)document.querySelector(`[data-lane="${lane}"]`).classList.remove('active');});
document.querySelectorAll('[data-lane]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('active');hit(+b.dataset.lane);});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>b.classList.remove('active')));b.addEventListener('click',e=>{if(e.detail===0)hit(+b.dataset.lane);});});
window.addEventListener('blur',()=>{pause();document.querySelectorAll('[data-lane]').forEach(b=>b.classList.remove('active'));});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});if(audio)audio.onstatechange=()=>{if(audio.state==='suspended')pause();};
for(const kind of ['guide','ideas']){$(kind+'Button').onclick=()=>{pause();$(kind+'Dialog').showModal();};$(kind+'Dialog').querySelector('.close').onclick=()=>$(kind+'Dialog').close();}
resize();requestAnimationFrame(frame);
(()=>{const params=new URLSearchParams(location.search),src=params.get('src'),title=params.get('title'),back=params.get('back'),cover=params.get('cover');if(back){const link=$('backLink');if(link){link.href=back;link.hidden=false;}}if(cover){const img=$('recordCover');if(img){img.src=cover;img.hidden=false;const label=document.querySelector('.record-label');if(label)label.style.display='none';}}if(src)loadFromUrl(src,title);})();

})();
