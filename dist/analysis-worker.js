importScripts('engine.js');
self.onmessage=({data})=>{try{self.postMessage({result:RhythmEngine.analyze(data.samples,data.sampleRate)});}catch(e){self.postMessage({error:e.message});}};
