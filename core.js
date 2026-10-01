export const PROFILE_KEY = 'formylove.profile.v1';
export const PROGRESS_KEY = 'formylove.progress.v1';
export function elapsed(startDate, now = Date.now()) {
  const ms = Date.parse(startDate);
  if (!Number.isFinite(ms)) throw new Error('Data inicial inválida.');
  const total = Math.max(0, Math.floor((now - ms) / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60 };
}
export function normalize(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
export function validEndpoint(url) { return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url); }
export function safeMediaUrl(value) {
  if (typeof value !== 'string' || !value || value.startsWith('//')) return false;
  if (/^(https:\/\/|\.\/|assets\/)/.test(value)) return !value.includes('\\');
  return false;
}
export function validateConfig(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('Configuração inválida.');
  for (const key of ['recipient','signature','favoriteColor','profession','hometown']) if (typeof c[key] !== 'string' || c[key].length > 200) throw new Error('Confira o campo '+key+'.');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(c.startDate) || !Number.isFinite(Date.parse(c.startDate))) throw new Error('Use uma data com fuso horário.');
  if (!Array.isArray(c.letter) || c.letter.some(p=>typeof p !== 'string') || c.letter.join('').length>20000) throw new Error('Carta inválida.');
  if (!Array.isArray(c.animeOrder) || c.animeOrder.length<2 || c.animeOrder.length>10 || c.animeOrder.some(x=>typeof x!=='string'||x.length>100) || new Set(c.animeOrder).size!==c.animeOrder.length) throw new Error('Informe de 2 a 10 animes diferentes.');
  if (!Array.isArray(c.science)||c.science.some(p=>typeof p.subject!=='string'||typeof p.line!=='string')) throw new Error('Frases inválidas.');
  if (!Array.isArray(c.playlists)||c.playlists.length>100) throw new Error('Playlist inválida.');
  for (const song of [...c.playlists,...(c.proposalSong?[c.proposalSong]:[]),...(c.intro?.song?[c.intro.song]:[])]) {
    if (typeof song.title!=='string'||typeof song.artist!=='string') throw new Error('Confira o título e artista das músicas.');
    if (song.type==='youtube' && !/^[\w-]{11}$/.test(song.videoId)) throw new Error('ID de vídeo inválido.');
    if (song.type==='audio' && !safeMediaUrl(song.url)) throw new Error('Endereço de áudio inválido.');
    if (!['youtube','audio'].includes(song.type)) throw new Error('Tipo de música inválido.');
  }
  if (!Array.isArray(c.photos) || c.photos.some(p=>!safeMediaUrl(p.url)||typeof p.feeling!=='string')) throw new Error('Fotos inválidas.');
  for(const key of ['him','her']) if(c.intro?.[key]&&!safeMediaUrl(c.intro[key])) throw new Error('Foto da abertura inválida.');
  return c;
}
export async function loadConfig() {
  const res=await fetch('config.json',{cache:'no-cache'});
  if (!res.ok) throw new Error('Não consegui carregar a carta.');
  const defaults=validateConfig(await res.json());
  try { const local=localStorage.getItem(PROFILE_KEY); if (local) return validateConfig(JSON.parse(local)); } catch { /* Ignore invalid personal overrides. */ }
  return defaults;
}
export function readProgress() {
  try { const p=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}'); return {items:['color','about','anime'].filter(k=>p.items?.includes(k)),answer:['yes','no'].includes(p.answer)?p.answer:null}; }
  catch {return {items:[],answer:null};}
}
export function writeProgress(p) { try {localStorage.setItem(PROGRESS_KEY,JSON.stringify(p));} catch { /* The page remains usable without storage. */ } }
