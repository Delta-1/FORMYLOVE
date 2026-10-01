export function initMusic(config, toast) {
  const $=s=>document.querySelector(s), tracks=config.playlists;let index=0,current=tracks[0],player=null,ready=false,playing=false,requestedPlay=false,apiPromise=null,special=false;
  let volume=35;try{volume=Math.max(0,Math.min(100,Number(localStorage.getItem('formylove.volume')??35)));}catch{}
  $('#volume').value=volume;$('#volume-value').value=volume+'%';
  if(!Number.isFinite(volume))volume=35;const audio=$('#audio');audio.volume=volume/100;const audioSources=new Map();
  function source(song){if(!song.parts?.length)return Promise.resolve(song.url);if(!audioSources.has(song.url))audioSources.set(song.url,Promise.all(song.parts.map(async path=>{const r=await fetch(path);if(!r.ok)throw new Error('Não consegui carregar a música.');return r.arrayBuffer();})).then(parts=>URL.createObjectURL(new Blob(parts,{type:'audio/mpeg'}))).catch(e=>{audioSources.delete(song.url);throw e;}));return audioSources.get(song.url);}
  function update() {
    if(!current)return;
    $('#now-title').textContent=current.title;$('#now-artist').textContent=current.artist;$('#mini-title').textContent=current.title;
    $('#play-track').disabled=false;$('#play-track').textContent=playing?'Ⅱ':'▶';$('#mini-play').textContent=playing?'Ⅱ':'▶';
    $('#play-track').setAttribute('aria-label',playing?'Pausar a música':'Tocar a música');$('#mini-play').setAttribute('aria-label',playing?'Pausar a música':'Tocar a música');
    $('.vinyl').classList.toggle('playing',playing);
    document.querySelectorAll('.track-row').forEach((r,i)=>r.classList.toggle('selected',current===tracks[i]));
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
  async function play(song=current) {
    if(!song){toast('A nossa playlist ainda está vazia.');return;}
    requestedPlay=true;current=song;$('#mini-player').hidden=song.type==='audio';$('#player-status').textContent='Preparando a nossa trilha…';update();
    if(song.type==='audio') {
      player?.pauseVideo?.();$('#youtube-player').hidden=true;audio.hidden=true;
      try {const src=await source(song);if(current!==song)return;if(audio.getAttribute('src')!==src)audio.src=src;await audio.play();playing=true;$('#player-status').textContent='';}catch{playing=false;$('#player-status').textContent='Toque em Tocar nos ajustes para ouvir.';toast('Toque em ⚙ e depois em Tocar para começar a ouvir. ♫');}
      update();return;
    }
    audio.pause();audio.hidden=true;$('#youtube-player').hidden=false;
    try {
      await loadApi();
      if(player){if(ready){player.setVolume(volume);if(player.getVideoData?.().video_id!==song.videoId)player.loadVideoById(song.videoId);else player.playVideo();}return;}
      player=new window.YT.Player('youtube-player',{width:320,height:200,host:'https://www.youtube-nocookie.com',videoId:current.videoId,playerVars:{playsinline:1,origin:location.origin,controls:1},events:{
        onReady:e=>{ready=true;e.target.setVolume(volume);if(!requestedPlay)return;if(e.target.getVideoData?.().video_id!==current.videoId)e.target.loadVideoById(current.videoId);else e.target.playVideo();},
        onStateChange:e=>{playing=e.data===1;update();if(e.data===1)$('#player-status').textContent='';if(e.data===0){if(!special)next(1);else if(current===config.proposalSong){player.seekTo(0);player.playVideo();}else if(current===config.intro?.song){special=false;play(tracks[index]);}}},
        onError:e=>{$('#player-status').textContent='Este vídeo não pôde ser tocado aqui. Abra no YouTube ou escolha outra faixa.';playing=false;update();},
        onAutoplayBlocked:()=>{$('#player-status').textContent='Toque em ▶ para começar a ouvir.';}
      }});
    }catch(e){requestedPlay=false;playing=false;$('#player-status').textContent=e.message;update();}
  }
  function pause(){requestedPlay=false;audio.pause();if(ready)player.pauseVideo();playing=false;update();}
  function toggle(){playing?pause():play();}
  function next(delta){if(!tracks.length||special)return;const native=tracks.filter(s=>s.type==='audio');if(current?.type==='audio'&&native.length){const choices=native.filter(s=>s.url!==current.url);play((choices.length?choices:native)[Math.floor(Math.random()*(choices.length||native.length))]);return;}index=delta<0?(index+tracks.length-1)%tracks.length:(tracks.length===1?0:(index+1+Math.floor(Math.random()*(tracks.length-1)))%tracks.length);play(tracks[index]);}
  $('#track-list').replaceChildren();
  tracks.forEach((s,i)=>{
    const row=document.createElement('button');row.className='track-row';const num=document.createElement('span');num.textContent=String(i+1).padStart(2,'0');
    const copy=document.createElement('div');const title=document.createElement('strong');title.textContent=s.title;const artist=document.createElement('small');artist.textContent=s.artist;copy.append(title,artist);
    const symbol=document.createElement('span');symbol.textContent='▷';row.append(num,copy,symbol);row.onclick=()=>{if(special)return;index=i;play(s);};$('#track-list').append(row);
  });
  if(!tracks.length)$('#track-list').textContent='As nossas músicas chegam aqui em breve.';
  else{$('#music-note').textContent='Escolha uma música. O som acompanha a nossa história.';update();}
  $('#play-track').onclick=toggle;$('#mini-play').onclick=toggle;$('#prev-track').onclick=()=>next(-1);$('#next-track').onclick=()=>next(1);$('#mini-prev').onclick=()=>next(-1);$('#mini-next').onclick=()=>next(1);
  $('#mini-close').onclick=()=>{pause();$('#mini-player').hidden=true;};
  const settings=$('#sound-settings');$('#sound-toggle').onclick=$('#settings-tab').onclick=()=>settings.showModal();$('#settings-play').onclick=toggle;$('#settings-next').onclick=()=>next(1);$('#see-playlist').onclick=()=>settings.close();
  $('#volume').oninput=e=>{volume=Number(e.target.value);$('#volume-value').value=volume+'%';audio.volume=volume/100;if(ready)player.setVolume(volume);try{localStorage.setItem('formylove.volume',String(volume));}catch{}};
  audio.onended=()=>{if(special&&current===config.proposalSong)return;special=false;const native=tracks.filter(s=>s.type==='audio');if(native.length){const choices=native.filter(s=>s.url!==current?.url);play((choices.length?choices:native)[Math.floor(Math.random()*(choices.length||native.length))]);}};audio.onpause=()=>{if(current?.type==='audio'){playing=false;update();}};audio.onplay=()=>{playing=true;update();};
  return {proposal:()=>{pause();special=true;audio.loop=true;return config.proposalSong?play(config.proposalSong):Promise.resolve();},intro:async()=>{if(config.intro?.song?.type==='audio'){special=true;await play(config.intro.song);return playing;}return true;},begin:()=>{if(current===config.intro?.song&&playing){special=false;audio.loop=false;return;}pause();special=false;audio.loop=false;index=Math.floor(Math.random()*tracks.length);if(tracks[index]?.type==='audio')play(tracks[index]);else{toast('Toque em uma música da playlist para começar a ouvir. ♫');}},pause};
}
