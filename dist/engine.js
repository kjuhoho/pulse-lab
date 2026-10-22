(function(root){
  'use strict';
  function analyze(samples, sampleRate) {
    const hop=Math.max(1,Math.round(sampleRate*.01)), frames=Math.ceil(samples.length/hop);
    const energy=new Float32Array(frames), high=new Float32Array(frames), flux=new Float32Array(frames);
    let maxEnergy=0;
    for(let f=0;f<frames;f++){let e=0,h=0;const end=Math.min(samples.length,(f+1)*hop);for(let i=f*hop;i<end;i++){const s=samples[i];e+=s*s;const d=s-(i?samples[i-1]:0);h+=d*d;}energy[f]=Math.sqrt(e/(end-f*hop));high[f]=Math.sqrt(h/(end-f*hop));maxEnergy=Math.max(maxEnergy,energy[f]);}
    for(let i=1;i<frames;i++)flux[i]=Math.max(0,energy[i]-energy[i-1])+.5*Math.max(0,high[i]-high[i-1]);
    const peaks=[];let previous=-100;
    for(let i=2;i<frames-2;i++){let avg=0;const lo=Math.max(0,i-20),hi=Math.min(frames,i+21);for(let j=lo;j<hi;j++)avg+=flux[j];avg/=(hi-lo);
      if(flux[i]>Math.max(.0005,avg*1.5,maxEnergy*.018)&&flux[i]>=flux[i-1]&&flux[i]>flux[i+1]&&energy[i]>maxEnergy*.025){const p={time:i*hop/sampleRate,strength:flux[i],tone:high[i]/(energy[i]+.00001)};if(i-previous>=9){peaks.push(p);previous=i;}else if(peaks.length&&p.strength>peaks[peaks.length-1].strength){peaks[peaks.length-1]=p;previous=i;}}
    }
    let best=0,bestLag=0;
    // Autocorrelation estimates a single reference tempo; chart timing uses actual onsets.
    for(let lag=33;lag<=100;lag++){let sum=0,normA=0,normB=0;for(let i=lag;i<frames;i++){sum+=flux[i]*flux[i-lag];normA+=flux[i]*flux[i];normB+=flux[i-lag]*flux[i-lag];}const corr=sum/Math.sqrt(normA*normB||1);if(corr>best){best=corr;bestLag=lag;}}
    const wave=[];for(let b=0;b<120;b++){let peak=0;const start=Math.floor(b*frames/120),end=Math.max(start+1,Math.floor((b+1)*frames/120));for(let i=start;i<Math.min(end,frames);i++)peak=Math.max(peak,energy[i]);wave.push(maxEnergy?peak/maxEnergy:0);}
    return {peaks,bpm:best>.08&&peaks.length>=5?Math.round(60/(bestLag*hop/sampleRate)):null,confidence:best,wave,duration:samples.length/sampleRate};
  }
  function makeChart(analysis,difficulty='normal'){
    const gap={easy:.42,normal:.24,hard:.14}[difficulty]||.24;
    const sorted=analysis.peaks.map(p=>p.strength).sort((a,b)=>a-b), floor=sorted[Math.floor(sorted.length*({easy:.42,normal:.18,hard:0}[difficulty]||0))]||0;
    const picked=[];for(const p of analysis.peaks){if(p.strength<floor)continue;const last=picked[picked.length-1];if(!last||p.time-last.time>=gap)picked.push(p);else if(p.strength>last.strength)picked[picked.length-1]=p;}
    let lastLane=-1;return picked.map((p,i)=>{let lane=(Math.round(p.tone*19)+i*3)%4;if(lane===lastLane)lane=(lane+1+i%3)%4;lastLane=lane;return {time:p.time,lane};});
  }
  function judge(delta){const d=Math.abs(delta);return d<=.055?'perfect':d<=.110?'great':d<=.160?'good':null;}
  const api={analyze,makeChart,judge};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RhythmEngine=api;
})(globalThis);