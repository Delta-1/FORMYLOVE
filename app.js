import {loadConfig,elapsed,normalize,readProgress,writeProgress} from './core.js';
import {listMemories,saveMemory} from './memories.js';
import {initMusic} from './music.js?v=8';
import {initProposal} from './proposal.js?v=7';
import {initStory} from './story.js?v=1';
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function show(dialog){if(!dialog.open)dialog.showModal();}
$$('.close-modal').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
const config=await loadConfig().catch(e=>{toast(e.message);return null;});
if(config)start(config);
function start(config){
  $$('[data-recipient]').forEach(n=>n.textContent=config.recipient);$$('[data-signature]').forEach(n=>n.textContent=config.signature);
  $('.letter-frame h2').textContent=config.recipient.charAt(0).toUpperCase()+config.recipient.slice(1)+',';
  $('#letter-body').replaceChildren(...config.letter.map(p=>el('p',p)));
  $('#science-love').replaceChildren(...config.science.map(p=>{const n=el('p');n.append(el('span',p.subject),el('strong',p.line));return n;}));
  const dt=new Date(config.startDate);$('#start-label').textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(dt).replaceAll('/',' · ');$('#year').textContent=new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric'}).format(dt);
  function tick(){const time=elapsed(config.startDate);for(const [k,v] of Object.entries(time))$('#'+k).textContent=String(v).padStart(2,'0');}tick();setInterval(tick,1000);
  const music=initMusic(config,toast);initQuests(config,music);initAlbum(config);initStory(music);initIntro(config,music);
  const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){$$('.header nav a,.bottom-tabs a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}});},{rootMargin:'-15% 0px -65% 0px'});$$('.chapter').forEach(s=>observer.observe(s));
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');reveal.unobserve(e.target);}}),{threshold:.09});$$('.letter-frame,.section-top,.memory-card,.quest-card,.music-layout').forEach(n=>{n.classList.add('reveal');reveal.observe(n);});}
}
function initQuests(config,music){
  const progress=readProgress(),names={color:['❀','A rosa'],about:['✦','A estrela'],anime:['⚿','A chave']};
  const proposal=initProposal(music,type=>{progress.answer=type;writeProgress(progress);});
  function update(){
    $('#inventory').replaceChildren(...Object.entries(names).map(([id,[icon,name]])=>{const n=el('div',undefined,'inventory-item'+(progress.items.includes(id)?' found':''));n.append(el('strong',icon),el('span',progress.items.includes(id)?name:'? ? ?'));return n;}));
    $$('.quest-card').forEach(n=>{const done=progress.items.includes(n.dataset.quest);n.classList.toggle('completed',done);n.querySelector('.quest-state').textContent=done?'✓ Item encontrado':'Descobrir';});
    const count=progress.items.length;$('#door-count').textContent=count+' DE 3 ITENS ENCONTRADOS';$('#open-door').disabled=count!==3;$('#open-door').textContent=count===3?'Abrir a nossa porta ♡':'Encontrar os três itens';
  }update();
  function award(id){if(!progress.items.includes(id)){progress.items.push(id);writeProgress(progress);}update();const c=$('#quest-content');c.replaceChildren(el('p','VOCÊ ENCONTROU UM PRESENTE','eyebrow'),el('div',names[id][0],'reward-symbol'),el('h2',names[id][1]),el('p','Guarde com carinho. A nossa porta está mais perto de se abrir.'));const b=el('button','Guardar o presente','button primary');b.onclick=()=>{$('#quest-dialog').close();if(progress.items.length===3)toast('Os três presentes são seus. A porta está esperando por você.');};c.append(b);}
  function open(id){if(progress.items.includes(id)){award(id);show($('#quest-dialog'));return;}
    const c=$('#quest-content');c.replaceChildren(el('p','UM SEGREDO ENTRE NÓS','eyebrow'));const result=el('p','','quest-result');
    if(id==='color'){
      c.append(el('h2','Qual é a minha cor favorita?'),el('p','Uma cor que também tem um cantinho nesta história.'));
      const options=el('div',undefined,'quest-options');[...new Set(['Roxo','Vermelho','Azul','Preto',config.favoriteColor])].forEach(color=>{const b=el('button',color,'quest-option');b.onclick=()=>normalize(color)===normalize(config.favoriteColor)?award(id):result.textContent='Ainda não… tenta outra cor. ♡';options.append(b);});c.append(options,result);
    }else if(id==='about'){
      c.append(el('h2','Você conhece o meu começo?'));
      const form=el('form');let profession=null,origin=null;
      function group(label,choices,onSelect){form.append(el('p',label));const options=el('div',undefined,'quest-options');[...new Set(choices)].forEach(value=>{const b=el('button',value,'quest-option');b.type='button';b.onclick=()=>{[...options.children].forEach(n=>n.classList.remove('selected'));b.classList.add('selected');onSelect(value);};options.append(b);});form.append(options);}
      group('Qual é a minha profissão?',['Programador','Professor','Fotógrafo','Arquiteto',config.profession],v=>profession=v);group('De onde eu sou natural?',['São Paulo','Acre','Paraná','Minas Gerais',config.hometown],v=>origin=v);
      const submit=el('button','Descobrir a estrela','button primary');submit.type='submit';form.append(submit,result);form.onsubmit=e=>{e.preventDefault();if(!profession||!origin){result.textContent='Escolha uma resposta para cada pergunta.';return;}if(normalize(profession)===normalize(config.profession)&&normalize(origin)===normalize(config.hometown))award(id);else result.textContent='Uma das peças ainda não encaixou. Vamos tentar de novo?';};c.append(form);
    }else{
      c.append(el('h2','Qual história ocupa o primeiro lugar?'),el('p','Coloque os animes na ordem dos meus favoritos. Arraste ou use os botões.'));
      let order=[...config.animeOrder].reverse(),dragged=null;const list=el('ol',undefined,'rank-list');
      function render(){list.replaceChildren(...order.map((name,i)=>{const li=el('li',undefined,'rank-item');li.draggable=true;li.dataset.name=name;
        li.append(el('span','☷','rank-grip'),el('span',String(i+1).padStart(2,'0'),'rank-number'),el('strong',name,'rank-name'));
        const actions=el('div',undefined,'rank-actions');for(const [delta,label] of [[-1,'↑'],[1,'↓']]){const b=el('button',label);b.type='button';b.setAttribute('aria-label',(delta===-1?'Subir ':'Descer ')+name);b.disabled=i+delta<0||i+delta>=order.length;b.onclick=()=>{[order[i],order[i+delta]]=[order[i+delta],order[i]];render();};actions.append(b);}li.append(actions);
        li.ondragstart=e=>{dragged=name;e.dataTransfer.setData('text/plain',name);e.dataTransfer.effectAllowed='move';li.classList.add('dragging');};li.ondragend=()=>{dragged=null;li.classList.remove('dragging');};li.ondragover=e=>e.preventDefault();li.ondrop=e=>{e.preventDefault();if(!dragged||!order.includes(dragged))return;const from=order.indexOf(dragged);order.splice(from,1);order.splice(i,0,dragged);dragged=null;render();};return li;}));}render();
      const submit=el('button','Descobrir a chave','button primary');submit.onclick=()=>{if(order.every((name,i)=>normalize(name)===normalize(config.animeOrder[i])))award(id);else result.textContent='A chave ainda não girou. Troque a ordem e tente novamente. ♡';};c.append(list,submit,result);
    }show($('#quest-dialog'));
  }
  $$('.quest-card').forEach(b=>b.onclick=()=>open(b.dataset.quest));
  $('#open-door').onclick=()=>{if(progress.items.length!==3)return;$('#door').classList.add('open');$('#door-heading').innerHTML='A nossa porta <em>aberta.</em>';$('#door-copy').textContent='O próximo capítulo começa com uma pergunta.';$('#open-door').textContent='Reabrir o nosso momento ♡';proposal.open();
  };
}
function initAlbum(config){
  let photos=[...config.photos],filter='all',photoData=null,camera=null,facing='environment';
  function render(){
    const list=filter==='all'?photos:photos.filter(p=>p.category===filter);$('#album-grid').replaceChildren();
    if(!list.length){['O seu sorriso.','O meu olhar.','O nosso momento.'].forEach((text,i)=>{const n=el('div',undefined,'empty-memory');n.append(el('span',['♡','✦','∞'][i],'empty-symbol'),el('p',text),el('small','Uma memória à espera de ser guardada.'));$('#album-grid').append(n);});return;}
    list.forEach(p=>{const b=el('button',undefined,'memory-card');b.append(photoViewport(p,.8),el('span',p.feeling||'Um instante nosso.'),el('small',p.date?formatDate(p.date):(p.category==='ela'?'O SEU UNIVERSO':'O MEU UNIVERSO')));b.onclick=()=>view(p);$('#album-grid').append(b);});
  }
  function view(p){const content=$('#photo-detail');content.replaceChildren(photoViewport(p),el('h3',p.feeling||'Um instante que mereceu ficar.'));if(p.date)content.append(el('p',formatDate(p.date),'small'));const link=el('a','Baixar esta lembrança','button');link.href=p.url;link.download='nossa-memoria.jpg';content.append(link);show($('#photo-dialog'));}

  async function refresh(){try{photos=[...config.photos,...await listMemories()];photos.sort((a,b)=>String(b.date).localeCompare(String(a.date)));$('#album-status').textContent='As fotos feitas aqui ficam somente neste navegador. Baixe as lembranças para guardar uma cópia.';}catch{$('#album-status').textContent='Não foi possível acessar as memórias deste aparelho.';}render();}
  $('#refresh-album').onclick=refresh;
  $$('.chip').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$('.chip').forEach(n=>n.classList.toggle('active',n===b));render();});
  function openMemory(){const d=new Date();$('#memory-date').value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');$('#upload-status').textContent='Salva neste aparelho, com carinho.';show($('#memory-dialog'));}
  $('#add-memory').onclick=openMemory;$('#camera-tab').onclick=()=>{openMemory();startCamera();};
  function stopCamera(){camera?.getTracks().forEach(t=>t.stop());camera=null;$('#camera-area').hidden=true;$('#camera-video').srcObject=null;}
  $('#memory-dialog').addEventListener('close',()=>{stopCamera();photoData=null;$('#photo-preview').hidden=true;$('#photo-preview').removeAttribute('src');$('#save-memory').disabled=true;$('#photo-input').value='';$('#memory-feeling').value='';});
  async function setPhoto(source){
    try{const canvas=document.createElement('canvas');const image=source instanceof HTMLVideoElement?source:await createImageBitmap(source);const w=image.videoWidth||image.width,h=image.videoHeight||image.height;
      if(!w||!h)throw new Error('A câmera ainda está preparando a imagem.');const scale=Math.min(1,1600/Math.max(w,h));canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);let quality=.85,data=canvas.toDataURL('image/jpeg',quality);while(data.length>1800000&&quality>.35){quality-=.1;data=canvas.toDataURL('image/jpeg',quality);}if(data.length>2200000)throw new Error('Escolha uma imagem menor.');image.close?.();photoData=data;$('#photo-preview').src=data;$('#photo-preview').hidden=false;$('#save-memory').disabled=false;$('#upload-status').textContent='Foto pronta. Conte o que você sentiu.';stopCamera();
    }catch(e){$('#upload-status').textContent=e.message||'Não consegui preparar essa imagem.';}
  }
  $('#photo-input').onchange=e=>{const file=e.target.files[0];if(!file)return;if(file.size>20*1024*1024){$('#upload-status').textContent='Escolha uma foto de até 20 MB.';return;}setPhoto(file);};
  async function startCamera(){stopCamera();try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('Use “Escolher foto” para fotografar pelo celular.');camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1600}},audio:false});if(!$('#memory-dialog').open){stopCamera();return;}$('#camera-video').srcObject=camera;$('#camera-area').hidden=false;$('#photo-preview').hidden=true;await $('#camera-video').play();}catch(e){$('#upload-status').textContent='Não consegui abrir a câmera. Autorize o acesso ou use “Escolher foto”.';}}
  $('#camera-start').onclick=startCamera;$('#camera-switch').onclick=()=>{facing=facing==='environment'?'user':'environment';startCamera();};$('#camera-shutter').onclick=()=>setPhoto($('#camera-video'));
  $('#memory-form').onsubmit=async e=>{e.preventDefault();if(!photoData)return;$('#save-memory').disabled=true;try{await saveMemory({id:crypto.randomUUID(),url:photoData,feeling:$('#memory-feeling').value.trim(),category:$('#memory-category').value,date:$('#memory-date').value});$('#memory-dialog').close();toast('Sua lembrança foi salva neste aparelho. ♡');await refresh();}catch{$('#upload-status').textContent='Não foi possível salvar. O armazenamento do aparelho pode estar cheio.';$('#save-memory').disabled=false;}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();});refresh();
}
function initIntro(config,music){
  const intro=$('#intro');for(const [key,id] of [['him','portrait-him'],['her','portrait-her']]){const url=config.intro?.[key];if(url){const photo=config.intro.portraits?.[key]||{url};const frame=photoViewport(photo,1);frame.querySelector('img').alt=key==='him'?'O meu universo':'O seu universo';frame.querySelector('img').loading='eager';$('#'+id).replaceChildren(frame);}}

  let finished=false,enterTimer;function enter(){if(finished)return;finished=true;clearTimeout(enterTimer);music.begin();intro.classList.add('departing');intro.setAttribute('aria-hidden','true');setTimeout(()=>{intro.hidden=true;if(!document.body.classList.contains('mobile-story'))$('#sound-toggle').focus({preventScroll:true});document.dispatchEvent(new Event('intro-finished'));},600);}
  let animated=false;function animate(){if(animated||finished)return;animated=true;intro.classList.remove('waiting');$('#enter-site').textContent='Entrar na nossa história ♡';const duration=parseFloat(getComputedStyle(intro).getPropertyValue('--intro-duration'))||14;enterTimer=setTimeout(enter,matchMedia('(prefers-reduced-motion: reduce)').matches?1800:duration*1000+600);}
  $('#enter-site').onclick=()=>{if(intro.classList.contains('sound-blocked')){music.intro().then(allowed=>{if(allowed){intro.classList.remove('sound-blocked');$('#enter-site').textContent='Entrar na nossa história ♡';}});}else enter();};$('#skip-intro').onclick=enter;
  // The visual opening does not depend on an audio download or autoplay permission.
  animate();music.intro().then(allowed=>{if(!allowed&&!finished){intro.classList.add('sound-blocked');$('#enter-site').textContent='Ativar música ♫';}}).catch(()=>{if(!finished){intro.classList.add('sound-blocked');$('#enter-site').textContent='Ativar música ♫';}});
}

function formatDate(value){const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00-03:00':value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'long',year:'numeric'}).format(date):'Um momento nosso';}

function photoViewport(photo,ratio){
  const frame=el('div',undefined,'photo-window'),crop=el('div',undefined,'photo-crop'),img=el('img');
  img.alt=photo.feeling||'Uma memória nossa';img.src=photo.url;img.loading='lazy';img.decoding='async';if(!photo.width)img.onload=()=>frame.replaceWith(photoViewport({...photo,width:img.naturalWidth,height:img.naturalHeight},ratio));
  const width=photo.width||1,height=photo.height||1,c=photo.crop||{x:0,y:0,width,height},rotation=photo.rotation===-90?-90:0;
  const pictureRatio=rotation?c.height/c.width:c.width/c.height,windowRatio=ratio||pictureRatio;
  frame.style.aspectRatio=String(windowRatio);frame.style.setProperty('--photo-ratio',String(windowRatio));
  const displayWidth=pictureRatio>windowRatio?pictureRatio/windowRatio*100:100,displayHeight=pictureRatio>windowRatio?100:windowRatio/pictureRatio*100;
  crop.style.width=(rotation?displayHeight/windowRatio:displayWidth)+'%';crop.style.height=(rotation?displayWidth*windowRatio:displayHeight)+'%';crop.style.transform='translate(-50%,-50%) rotate('+rotation+'deg)';
  img.style.width=width/c.width*100+'%';img.style.height=height/c.height*100+'%';img.style.left=-c.x/c.width*100+'%';img.style.top=-c.y/c.height*100+'%';crop.append(img);frame.append(crop);return frame;
}
