export function initMusic(config, toast) {
  const $=s=>document.querySelector(s), tracks=config.playlists;let index=0,current=tracks[0],player=null,ready=false,playing=false,loading=false,request=0,requestedPlay=false,apiPromise=null,special=false,background=null;
  let volume=35;try{volume=Math.max(0,Math.min(100,Number(localStorage.getItem('formylove.volume')??35)));}catch{}
  $('#volume').value=volume;$('#volume-value').value=volume+'%';
  if(!Number.isFinite(volume))volume=35;const audio=$('#audio');audio.volume=volume/100;const audioSources=new Map();
  function source(song){if(!song.parts?.length)return Promise.resolve(song.url);if(!audioSources.has(song.url))audioSources.set(song.url,Promise.all(song.parts.map(async path=>{const r=await fetch(path);if(!r.ok)throw new Error('Não consegui carregar a música.');return r.arrayBuffer();})).then(parts=>URL.createObjectURL(new Blob(parts,{type:'audio/mpeg'}))).catch(e=>{audioSources.delete(song.url);throw e;}));return audioSources.get(song.url);}
  const sameSong=(a,b)=>a?.type===b?.type&&(a?.type==='audio'?a.url===b.url:a?.videoId===b?.videoId);
  function prepareNext(){if(special||!tracks.length)return;const nextTrack=tracks[(index+1)%tracks.length];if(nextTrack?.type==='audio')source(nextTrack).catch(()=>{});}
  function update() {
    if(!current)return;
    $('#now-title').textContent=current.title;$('#now-artist').textContent=current.artist;$('#mini-title').textContent=current.title;
    $('#play-track').disabled=loading;$('#play-track').textContent=loading?'…':playing?'Ⅱ':'▶';$('#mini-play').textContent=loading?'…':playing?'Ⅱ':'▶';$('#mini-play').disabled=loading;
    $('#play-track').setAttribute('aria-label',playing?'Pausar a música':'Tocar a música');$('#mini-play').setAttribute('aria-label',playing?'Pausar a música':'Tocar a música');
    $('.vinyl').classList.toggle('playing',playing);
    document.querySelectorAll('.track-row').forEach((r,i)=>{const selected=sameSong(current,tracks[i]);r.classList.toggle('selected',selected);r.setAttribute('aria-pressed',String(selected));r.lastElementChild.textContent=selected?(loading?'…':playing?'Ⅱ':'▷'):'▷';});
    $('#music-note').textContent=loading?'Carregando '+current.title+'…':special?'A música deste momento é só nossa.':'As faixas mudam sozinhas em ordem aleatória. Os botões seguem a ordem da playlist.';
    $('#settings-status').textContent=(loading?'Carregando: ':playing?'Tocando: ':'Pausada: ')+current.title;
    $('#settings-play').textContent=loading?'Carregando…':playing?'Pausar':'Tocar';$('#settings-play').disabled=loading;
    for(const id of ['prev-track','next-track','mini-prev','mini-next','settings-next'])$('#'+id).disabled=special;
    $('#youtube-link').hidden=current.type!=='youtube';
    if(current.type==='youtube')$('#youtube-link').href='https://www.youtube.com/watch?v='+current.videoId;
  }
  function loadApi() {
    if(window.YT?.Player)return Promise.resolve();
    if(apiPromise)return apiPromise;
    apiPromise=new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{apiPromise=null;reject(new Error('O YouTube não respondeu. Use “Abrir no YouTube” ou tente novamente.'));},18000);
      window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);resolve();};
      const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.id='youtube-api';
      script.onerror=()=>{clearTimeout(timeout);script.remove();apiPromise=null;reject(new Error('Não consegui carregar o YouTube. Confira a conexão.'));};
      $('#youtube-api')?.remove();document.head.append(script);
    });return apiPromise;
  }
  async function play(song=current,restart=false) {
    if(!song){toast('A nossa playlist ainda está vazia.');return;}
    const ticket=++request;requestedPlay=true;current=song;playing=false;loading=true;audio.pause();const selected=tracks.findIndex(s=>sameSong(s,song));if(selected>=0)index=selected;
    $('#mini-player').hidden=song.type==='audio';$('#player-status').textContent='Preparando a nossa trilha…';update();
    if(song.type==='audio') {
      player?.pauseVideo?.();$('#youtube-player').hidden=true;audio.hidden=true;
      try {const src=await source(song);if(ticket!==request)return;if(audio.getAttribute('src')!==src){audio.addEventListener('loadedmetadata',()=>{if(ticket===request&&song.startAt)audio.currentTime=Math.min(song.startAt,Math.max(0,audio.duration-.1));},{once:true});audio.src=src;try{audio.currentTime=song.startAt||0;}catch{}}else if(restart)audio.currentTime=song.startAt||0;await audio.play();if(ticket!==request)return;playing=true;loading=false;$('#player-status').textContent='';prepareNext();}catch(e){if(ticket!==request)return;playing=false;loading=false;const message=e.name==='NotAllowedError'?'Toque em Tocar nos ajustes para ouvir.':'Não consegui carregar esta faixa. Toque em Tocar para tentar novamente.';$('#player-status').textContent=message;toast(message);}
      update();return;
    }
    audio.pause();audio.hidden=true;$('#youtube-player').hidden=false;
    try {
      await loadApi();
      if(ticket!==request)return;loading=false;update();
      if(player){if(ready){player.setVolume(volume);if(player.getVideoData?.().video_id!==song.videoId)player.loadVideoById(song.videoId);else player.playVideo();}return;}
      player=new window.YT.Player('youtube-player',{width:320,height:200,host:'https://www.youtube-nocookie.com',videoId:current.videoId,playerVars:{playsinline:1,origin:location.origin,controls:1},events:{
        onReady:e=>{ready=true;e.target.setVolume(volume);if(!requestedPlay)return;if(e.target.getVideoData?.().video_id!==current.videoId)e.target.loadVideoById(current.videoId);else e.target.playVideo();},
        onStateChange:e=>{playing=e.data===1;update();if(e.data===1)$('#player-status').textContent='';if(e.data===0){if(!special)next(1);else if(current===config.proposalSong){player.seekTo(0);player.playVideo();}else if(current===config.intro?.song){special=false;play(tracks[index]);}}},
        onError:e=>{$('#player-status').textContent='Este vídeo não pôde ser tocado aqui. Abra no YouTube ou escolha outra faixa.';playing=false;update();},
        onAutoplayBlocked:()=>{$('#player-status').textContent='Toque em ▶ para começar a ouvir.';}
      }});
    }catch(e){if(ticket!==request)return;requestedPlay=false;playing=false;loading=false;$('#player-status').textContent=e.message;update();}
  }
  function pause(){request++;requestedPlay=false;loading=false;audio.pause();if(ready)player.pauseVideo();playing=false;update();}
  function toggle(){playing?pause():play();}
  function next(delta){if(!tracks.length||special)return;index=(index+delta+tracks.length)%tracks.length;play(tracks[index],true);}
  $('#track-list').replaceChildren();
  tracks.forEach((s,i)=>{
    const row=document.createElement('button');row.className='track-row';const num=document.createElement('span');num.textContent=String(i+1).padStart(2,'0');
    const copy=document.createElement('div');const title=document.createElement('strong');title.textContent=s.title;const artist=document.createElement('small');artist.textContent=s.artist;copy.append(title,artist);
    const symbol=document.createElement('span');symbol.textContent='▷';row.append(num,copy,symbol);row.onclick=()=>{if(special)return;index=i;play(s,true);};$('#track-list').append(row);
  });
  if(!tracks.length)$('#track-list').textContent='As nossas músicas chegam aqui em breve.';
  else{$('#music-note').textContent='Escolha uma música. O som acompanha a nossa história.';update();}
  $('#play-track').onclick=toggle;$('#mini-play').onclick=toggle;$('#prev-track').onclick=()=>next(-1);$('#next-track').onclick=()=>next(1);$('#mini-prev').onclick=()=>next(-1);$('#mini-next').onclick=()=>next(1);
  $('#mini-close').onclick=()=>{pause();$('#mini-player').hidden=true;};
  const settings=$('#sound-settings');$('#sound-toggle').onclick=$('#settings-tab').onclick=()=>settings.showModal();$('#settings-play').onclick=toggle;$('#settings-next').onclick=()=>next(1);$('#see-playlist').onclick=()=>settings.close();
  $('#volume').oninput=e=>{volume=Number(e.target.value);$('#volume-value').value=volume+'%';audio.volume=volume/100;if(ready)player.setVolume(volume);try{localStorage.setItem('formylove.volume',String(volume));}catch{}};
  audio.onended=()=>{if(special&&(current===config.proposalSong||current===config.acceptSong)){audio.currentTime=current.startAt||0;audio.play().catch(()=>toast('Toque em Tocar nos ajustes para continuar.'));return;}special=false;const native=tracks.filter(s=>s.type==='audio');if(native.length){const choices=native.filter(s=>s.url!==current?.url);play((choices.length?choices:native)[Math.floor(Math.random()*(choices.length||native.length))]);}};audio.onpause=()=>{if(current?.type==='audio'){playing=false;update();}};audio.onplay=()=>{playing=true;update();};
  return {
    prepareProposal:()=>{for(const song of [config.proposalSong,config.acceptSong])if(song?.type==='audio')source(song).catch(()=>{});},
    getVolume:()=>volume/100,
    proposal:()=>{background=current;pause();special=true;audio.loop=false;return config.proposalSong?play(config.proposalSong):Promise.resolve();},
    accept:()=>{pause();special=true;audio.loop=false;return config.acceptSong?play(config.acceptSong):Promise.resolve();},
    resumeBackground:()=>{pause();special=false;audio.loop=false;if(background)play(background);background=null;},
    intro:async()=>{if(config.intro?.song?.type==='audio'){special=true;await play(config.intro.song);return playing;}return true;},
    begin:()=>{if(current===config.intro?.song&&playing){special=false;audio.loop=false;update();prepareNext();return;}pause();special=false;audio.loop=false;index=Math.floor(Math.random()*tracks.length);if(tracks[index]?.type==='audio')play(tracks[index]);else{toast('Toque em uma música da playlist para começar a ouvir. ♫');}},pause
  };
}
