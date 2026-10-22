(function(root){
  'use strict';
  const directions=['←','↑','↓','→'];
  const names=['왼쪽','위','아래','오른쪽'];
  const schemes={
    arrows:{name:'방향키',codes:['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'],labels:directions},
    wasd:{name:'WASD',codes:['KeyA','KeyW','KeyS','KeyD'],labels:['A','W','S','D']}
  };
  function laneForKey(code,scheme='arrows'){return (schemes[scheme]||schemes.arrows).codes.indexOf(code);}
  const api={directions,names,schemes,laneForKey};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RhythmControls=api;
})(globalThis);