const $=s=>document.querySelector(s);
const order=['envelope','letter','clock','album','trilha','enigmas','porta'];
const labels=['Uma carta para você','O que eu queria te dizer','O nosso tempo','Nossas memórias','A nossa trilha','Três pequenos segredos','O próximo capítulo'];
export function initStory(music){
  const screen=matchMedia('(max-width: 767px)'),classic=new URLSearchParams(location.search).get('experience')==='classic';
  let current=0,opened=false,opening=false,timer,completed=false;
  const visited=new Set(),tabs=document.querySelector('.bottom-tabs');
  const pages=order.map(id=>$('#'+id));
  pages.forEach((page,i)=>{
    page.classList.add('story-page');page.setAttribute('tabindex','-1');
    if(i>0&&i<order.length-1){const next=document.createElement('button');next.className='button primary story-continue';next.textContent=i===5?'Ir até a porta ♡':'Continuar →';next.onclick=()=>go(i+1);page.append(next);}
  });
  function enabled(){return !classic;}
  function go(i,focus=true){
    if(!enabled())return;i=Math.max(0,Math.min(i,order.length-1));if(i===1&&!opened)i=0;
    visited.add(i);if(i===order.length-1&&visited.size===order.length)completed=true;
    document.body.classList.toggle('story-completed',completed);tabs.hidden=!completed;tabs.inert=!completed;
    current=i;pages.forEach((page,j)=>{page.classList.toggle('story-active',j===i);page.inert=j!==i;});
    $('#carta').inert=true;
    $('#story-count').textContent=String(i+1).padStart(2,'0')+' / 07';$('#story-title').textContent=labels[i];$('#story-back').disabled=i===0;
    $('#story-progress').replaceChildren(...order.map((id,j)=>{const dot=document.createElement('span');dot.className=j<=i?'filled':'';return dot;}));
    document.querySelectorAll('.bottom-tabs a').forEach(a=>a.classList.toggle('active',a.hash==='#'+order[i]||(i<3&&a.hash==='#carta')));
    pages[i].scrollTop=0;if(focus)pages[i].focus({preventScroll:true});
  }
  function sync(){
    document.body.classList.toggle('mobile-story',enabled());
    if(enabled())go(current,false);else{pages.forEach(page=>{page.inert=false;});$('#carta').inert=false;tabs.hidden=false;tabs.inert=false;}
  }
  $('#story-back').onclick=()=>go(current-1);
  $('#story-sound').onclick=()=>$('#sound-settings').showModal();
  $('#open-envelope').onclick=()=>{
    if(opening)return;if(opened){go(1);return;}opening=true;$('#open-envelope').disabled=true;
    $('#envelope').classList.add('opening');
    // A gesture can release blocked sound without interrupting an already playing track.
    const audio=document.querySelector('audio');if(audio?.paused)music.begin();
    timer=setTimeout(()=>{opened=true;opening=false;$('#open-envelope').disabled=false;$('#envelope').classList.remove('opening');go(1);},matchMedia('(prefers-reduced-motion: reduce)').matches?100:1700);
  };
  document.addEventListener('click',e=>{
    if(!enabled())return;const anchor=e.target.closest('a[href^="#"]');if(!anchor)return;
    const id=anchor.hash.slice(1);if(!['carta','main',...order].includes(id))return;
    e.preventDefault();const target=['carta','main'].includes(id)?0:order.indexOf(id);
    if(!completed&&!visited.has(target))return;
    go(target);
  });
  document.addEventListener('intro-finished',()=>{if(enabled())go(current);});
  screen.addEventListener('change',sync);sync();
}
