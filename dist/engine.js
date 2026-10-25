(function(root){
  'use strict';
  function lowpassAlpha(sampleRate,cutoffHz){const rc=1/(2*Math.PI*cutoffHz),dt=1/sampleRate;return dt/(rc+dt);}
  function highpassAlpha(sampleRate,cutoffHz){const rc=1/(2*Math.PI*cutoffHz),dt=1/sampleRate;return rc/(rc+dt);}
  function analyze(samples, sampleRate) {
    const hop=Math.max(1,Math.round(sampleRate*.01)), frames=Math.ceil(samples.length/hop);
    const energy=new Float32Array(frames), lowE=new Float32Array(frames), highE=new Float32Array(frames), flux=new Float32Array(frames);
    let maxEnergy=0;
    // Two one-pole filters split the signal into a bass band (kick/bassline) and a treble band
    // (hats/snare/vocal transients), run as a single streaming pass so lane assignment can later
    // reflect which instrument actually triggered the hit, not just overall loudness.
    const lpA=lowpassAlpha(sampleRate,150), hpA=highpassAlpha(sampleRate,2000);
    let lpPrev=0, hpPrevIn=0, hpPrevOut=0;
    for(let f=0;f<frames;f++){let e=0,lo=0,hi=0;const end=Math.min(samples.length,(f+1)*hop);for(let i=f*hop;i<end;i++){const x=samples[i];e+=x*x;lpPrev=lpPrev+lpA*(x-lpPrev);lo+=lpPrev*lpPrev;const hpOut=hpA*(hpPrevOut+x-hpPrevIn);hpPrevIn=x;hpPrevOut=hpOut;hi+=hpOut*hpOut;}const n=end-f*hop;energy[f]=Math.sqrt(e/n);lowE[f]=Math.sqrt(lo/n);highE[f]=Math.sqrt(hi/n);maxEnergy=Math.max(maxEnergy,energy[f]);}
    for(let i=1;i<frames;i++)flux[i]=Math.max(0,energy[i]-energy[i-1])+.5*Math.max(0,highE[i]-highE[i-1]);
    const peaks=[];let previous=-100;
    for(let i=2;i<frames-2;i++){let avg=0;const lo=Math.max(0,i-20),hi=Math.min(frames,i+21);for(let j=lo;j<hi;j++)avg+=flux[j];avg/=(hi-lo);
      if(flux[i]>Math.max(.0005,avg*1.5,maxEnergy*.018)&&flux[i]>=flux[i-1]&&flux[i]>flux[i+1]&&energy[i]>maxEnergy*.025){const tone=highE[i]/(lowE[i]+highE[i]+.00001);const p={time:i*hop/sampleRate,strength:flux[i],tone};if(i-previous>=9){peaks.push(p);previous=i;}else if(peaks.length&&p.strength>peaks[peaks.length-1].strength){peaks[peaks.length-1]=p;previous=i;}}
    }
    let best=0,bestLag=0;
    // Autocorrelation finds a reference tempo; a beat-phase histogram (below) then finds where the "1" falls.
    for(let lag=33;lag<=100;lag++){let sum=0,normA=0,normB=0;for(let i=lag;i<frames;i++){sum+=flux[i]*flux[i-lag];normA+=flux[i]*flux[i];normB+=flux[i-lag]*flux[i-lag];}const corr=sum/Math.sqrt(normA*normB||1);if(corr>best){best=corr;bestLag=lag;}}
    const confident=best>.08&&peaks.length>=5;
    const beatPeriod=confident?bestLag*hop/sampleRate:null;
    let phase=0;
    if(confident){
      const bins=24,hist=new Float32Array(bins);
      for(const p of peaks){const frac=((p.time%beatPeriod)+beatPeriod)%beatPeriod/beatPeriod;hist[Math.min(bins-1,Math.floor(frac*bins))]+=p.strength;}
      let bi=0;for(let b=1;b<bins;b++)if(hist[b]>hist[bi])bi=b;
      phase=(bi+.5)/bins*beatPeriod;
    }
    const wave=[];for(let b=0;b<120;b++){let peak=0;const start=Math.floor(b*frames/120),end=Math.max(start+1,Math.floor((b+1)*frames/120));for(let i=start;i<Math.min(end,frames);i++)peak=Math.max(peak,energy[i]);wave.push(maxEnergy?peak/maxEnergy:0);}
    return {peaks,bpm:confident?Math.round(60/beatPeriod):null,confidence:best,beatPeriod,phase,wave,duration:samples.length/sampleRate};
  }
  function makeChart(analysis,difficulty='normal'){
    const gap={easy:.42,normal:.24,hard:.14}[difficulty]||.24;
    const sorted=analysis.peaks.map(p=>p.strength).sort((a,b)=>a-b), floor=sorted[Math.floor(sorted.length*({easy:.42,normal:.18,hard:0}[difficulty]||0))]||0;
    const picked=[];for(const p of analysis.peaks){if(p.strength<floor)continue;const last=picked[picked.length-1];if(!last||p.time-last.time>=gap)picked.push(p);else if(p.strength>last.strength)picked[picked.length-1]=p;}
    // When tempo is confident, snap each kept hit onto the detected beat grid (osu!/DDR-style chart
    // authoring) instead of leaving raw, slightly jittery onset timestamps — this is what makes the
    // chart feel deliberately laid out rather than just "wherever a transient happened to land".
    let notes=picked;
    if(analysis.beatPeriod){
      const division={easy:1,normal:.5,hard:.25}[difficulty]||.5;
      const grid=analysis.beatPeriod*division;
      const snapped=picked.map(p=>({...p,time:Math.max(0,analysis.phase+Math.round((p.time-analysis.phase)/grid)*grid)}));
      notes=[];for(const n of snapped){const last=notes[notes.length-1];if(last&&Math.abs(n.time-last.time)<grid*.5){if(n.strength>last.strength)notes[notes.length-1]=n;}else notes.push(n);}
    }
    // Bass-heavy hits (tone<.5) land on the outer lanes, treble-heavy hits on the inner lanes, each
    // alternating independently — so the chart's left/right pattern tracks which instrument is playing
    // instead of a tone-blind round-robin.
    let loToggle=0,hiToggle=1;
    return notes.map(p=>{if(p.tone<.5){const lane=loToggle?3:0;loToggle=1-loToggle;return {time:p.time,lane};}const lane=hiToggle?2:1;hiToggle=1-hiToggle;return {time:p.time,lane};});
  }
  function judge(delta){const d=Math.abs(delta);return d<=.055?'perfect':d<=.110?'great':d<=.160?'good':null;}
  const api={analyze,makeChart,judge};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RhythmEngine=api;
})(globalThis);