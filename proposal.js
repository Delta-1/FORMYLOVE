const $=s=>document.querySelector(s);
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initProposal(music,onAnswer){
  const scene=$('#proposal-scene'),card=$('#proposal'),answer=$('#proposal-answer');
  const choices=$('#proposal-buttons'),yes=$('#say-yes'),no=$('#say-no');
  let noCount=0,settled=false,ready=false,timers=[],stopShow=()=>{},soundContext=null,voices=[];
  music.prepareProposal();
  function later(fn,ms){timers.push(setTimeout(fn,ms));}
  function sound(){
    try{soundContext??=new (window.AudioContext||window.webkitAudioContext)();soundContext.resume().catch(()=>{});return soundContext;}catch{return null;}
  }
  function envelope(ctx,duration,level=1){
    const gain=ctx.createGain(),t=ctx.currentTime;
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(music.getVolume()*.35*level,t+.05);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);gain.connect(ctx.destination);return gain;
  }
  function creak(){
    if(music.getVolume()===0)return;
    const ctx=sound();if(!ctx)return;
    const t=ctx.currentTime,gain=envelope(ctx,1.8),osc=ctx.createOscillator(),filter=ctx.createBiquadFilter();
    osc.type='sawtooth';osc.frequency.setValueAtTime(92,t);osc.frequency.exponentialRampToValueAtTime(42,t+1.6);
    filter.type='lowpass';filter.frequency.value=430;filter.Q.value=5;osc.connect(filter).connect(gain);osc.start();osc.stop(t+1.8);voices.push(osc);
    const buffer=ctx.createBuffer(1,ctx.sampleRate*1.8,ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.25+.15*Math.sin(i/180));
    const scrape=ctx.createBufferSource(),wood=ctx.createBiquadFilter();scrape.buffer=buffer;
    wood.type='bandpass';wood.frequency.value=650;wood.Q.value=.7;scrape.connect(wood).connect(envelope(ctx,1.7,.6));scrape.start();voices.push(scrape);
  }
  function sigh(){
    if(music.getVolume()===0)return;
    if('speechSynthesis' in window&&speechSynthesis.getVoices().length){
      const utterance=new SpeechSynthesisUtterance('Ah…');utterance.lang='pt-BR';utterance.rate=.65;utterance.pitch=.6;utterance.volume=music.getVolume();
      const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase()==='pt-br');if(voice)utterance.voice=voice;utterance.onerror=synthesizedSigh;speechSynthesis.speak(utterance);return;
    }
    synthesizedSigh();
  }
  function synthesizedSigh(){
    const ctx=sound();if(!ctx)return;const t=ctx.currentTime,osc=ctx.createOscillator();
    osc.type='sawtooth';osc.frequency.setValueAtTime(145,t);osc.frequency.exponentialRampToValueAtTime(82,t+1.2);
    for(const hz of [730,1090]){const formant=ctx.createBiquadFilter();formant.type='bandpass';formant.frequency.value=hz;formant.Q.value=7;osc.connect(formant).connect(envelope(ctx,1.25,.3));}
    osc.start();osc.stop(t+1.3);voices.push(osc);
  }
  function cleanup(){
    timers.forEach(clearTimeout);timers=[];stopShow();stopShow=()=>{};
    voices.forEach(v=>{try{v.stop();}catch{}});voices=[];window.speechSynthesis?.cancel();
    ready=false;scene.classList.remove('revealed','celebrating');$('#proposal-question').classList.remove('question-fading');document.body.classList.remove('proposal-active');music.resumeBackground();
  }
  scene.addEventListener('close',cleanup);
  $('#close-proposal').onclick=()=>scene.close();
  $('#proposal-settings').onclick=()=>$('#sound-settings').showModal();
  yes.onclick=()=>{
    if(settled||!ready)return;settled=true;onAnswer('yes');choices.hidden=true;
    music.accept();
    $('#proposal-question').hidden=true;$('#proposal-sticker').hidden=true;$('#proposal-sub').hidden=true;
    $('#proposal-eyebrow').textContent='O NOSSO PRÓXIMO CAPÍTULO';
    answer.textContent='Então é oficial. Você e eu. ♡';scene.classList.add('celebrating');
    stopShow=fireworks($('#love-canvas'));
    later(()=>{$('#love-finale').hidden=false;$('#love-finale').focus({preventScroll:true});},reduced()?0:5700);
  };
  no.onclick=()=>{
    if(settled||!ready)return;
    if(++noCount===1){answer.textContent='Tem certeza? :(';choices.classList.add('no-moved');no.focus({preventScroll:true});return;}
    settled=true;onAnswer('no');sigh();choices.hidden=true;$('#proposal-sticker').hidden=true;
    const face=document.createElement('span');face.className='sad-face';face.textContent='😔';face.setAttribute('aria-label','Carinha triste');
    const message=document.createElement('p');message.textContent='Infelizmente não foi dessa vez, mas continuarei me empenhando!!';answer.replaceChildren(face,message);
  };
  function question(text){
    const heading=$('#proposal-question');heading.classList.remove('question-fading');heading.textContent=text;
  }
  function showFullQuestion(){
    const heading=$('#proposal-question');heading.replaceChildren(document.createTextNode('Welissiane, você aceita '));
    const emphasis=document.createElement('em');emphasis.textContent='namorar comigo?';heading.append(emphasis);heading.classList.remove('question-fading');
    for(const id of ['proposal-eyebrow','proposal-sticker','proposal-sub'])$('#'+id).hidden=false;
    later(()=>{ready=true;choices.hidden=false;choices.classList.add('choices-arrive');yes.focus({preventScroll:true});},reduced()?100:1200);
  }
  return {open(){
    if(scene.open)return;noCount=0;settled=false;ready=false;choices.hidden=true;choices.classList.remove('no-moved','choices-arrive');answer.replaceChildren();
    $('#proposal-question').hidden=false;question('Welissiane');
    for(const id of ['proposal-eyebrow','proposal-sticker','proposal-sub'])$('#'+id).hidden=true;
    $('#proposal-eyebrow').textContent='EU ESCOLHO VOCÊ.';$('#love-finale').hidden=true;$('#love-canvas').hidden=true;
    document.body.classList.add('proposal-active');scene.showModal();card.hidden=false;creak();music.proposal();
    const start=reduced()?100:1500,hold=reduced()?1800:2900,fade=reduced()?0:500;
    later(()=>{scene.classList.add('revealed');},start);
    later(()=>{$('#proposal-question').classList.add('question-fading');},start+hold);
    later(()=>{question('você');},start+hold+fade);
    later(()=>{$('#proposal-question').classList.add('question-fading');},start+hold*2+fade);
    later(showFullQuestion,start+hold*2+fade*2);
  }};
}

function fireworks(canvas){
  if(reduced())return ()=>{};
  canvas.hidden=false;const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
  let w=0,h=0,raf=0,particles=[],rockets=[],last=performance.now(),start=last,nextRocket=1900;
  const colors=['#f4bdd7','#df9dff','#edc87d','#85c7ff','#fff1e6'];
  function resize(){w=canvas.clientWidth;h=canvas.clientHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize();window.addEventListener('resize',resize);
  for(let i=0;i<110;i++)particles.push({x:w/2,y:h*.46,vx:(Math.random()-.5)*13,vy:-Math.random()*13-3,life:180,age:0,color:colors[i%5],confetti:true,size:3+Math.random()*4});
  function burst(r){for(let i=0;i<64;i++){const angle=Math.PI*2*i/64,speed=1.5+Math.random()*4;particles.push({x:r.x,y:r.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:70+Math.random()*30,age:0,color:r.color,size:1.2+Math.random()*1.6});}}
  function frame(now){
    const elapsed=now-start,dt=Math.min((now-last)/16.67,2);last=now;ctx.clearRect(0,0,w,h);
    if(elapsed>nextRocket&&elapsed<8500){rockets.push({x:w*(.15+Math.random()*.7),y:h,target:h*(.12+Math.random()*.3),vy:-(h/90),color:colors[Math.floor(Math.random()*5)]});nextRocket+=650;}
    rockets=rockets.filter(r=>{r.y+=r.vy*dt;ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r.x,r.y+30);ctx.lineTo(r.x,r.y);ctx.stroke();if(r.y<=r.target){burst(r);return false;}return true;});
    particles=particles.filter(p=>{p.age+=dt;if(p.age>=p.life)return false;p.vy+=(p.confetti?.075:.025)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.99;
      ctx.globalAlpha=Math.max(0,1-p.age/p.life);ctx.fillStyle=p.color;
      if(p.confetti){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.age*.06);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*1.7);ctx.restore();}
      else{ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}return true;});ctx.globalAlpha=1;
    if(elapsed<11500)raf=requestAnimationFrame(frame);else canvas.hidden=true;
  }
  raf=requestAnimationFrame(frame);
  return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);ctx.clearRect(0,0,w,h);canvas.hidden=true;};
}
