/** FORMYLOVE: private Drive album. Never put the album password in config.json. */
const ALBUM_FOLDER = PropertiesService.getScriptProperties().getProperty('ALBUM_FOLDER_ID');
const IMAGE_MIMES = ['image/jpeg','image/png','image/webp'];
const MAX_UPLOAD_BYTES = 1700000;
const SESSION_MS = 8 * 60 * 60 * 1000;

/** Run once from the editor AFTER setting ALBUM_PASSWORD and ALLOWED_ORIGINS in Script Properties. */
function setupAlbum_() {
  const p=PropertiesService.getScriptProperties();
  const password=p.getProperty('ALBUM_PASSWORD');
  if(!password||password.length<12)throw new Error('Defina ALBUM_PASSWORD com pelo menos 12 caracteres nas propriedades do script.');
  if(!p.getProperty('ALLOWED_ORIGINS'))throw new Error('Defina ALLOWED_ORIGINS com a origem do site, por exemplo https://delta-1.github.io.');
  if(!ALBUM_FOLDER)throw new Error('Defina ALBUM_FOLDER_ID nas propriedades do script com o ID da pasta privada.');
  DriveApp.getFolderById(ALBUM_FOLDER).getName();
  const salt=Utilities.getUuid()+Utilities.getUuid();
  p.setProperties({PASSWORD_SALT:salt,PASSWORD_HASH:hash_(salt+password),SESSION_SECRET:Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid()});
  p.deleteProperty('ALBUM_PASSWORD');
  console.log('Álbum configurado. A senha foi removida das propriedades e guardada como hash.');
}

function doGet(e) {
  const q=(e&&e.parameter)||{};
  if(q.bridge!=='1')return HtmlService.createHtmlOutput('<h2>FORMYLOVE — Álbum conectado</h2><p>Abra o álbum pelo seu site.</p>');
  const allowed=allowedOrigins_();
  if(!allowed.includes(q.origin)||!(/^[a-f0-9-]{36}$/i.test(q.channel||'')))return HtmlService.createHtmlOutput('Origem não autorizada.');
  const template=HtmlService.createTemplateFromFile('Bridge');template.origin=q.origin;template.channel=q.channel;
  return template.evaluate().setTitle('FORMYLOVE · Nosso álbum').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** The only RPC entry point. Every photo operation requires a signed, short-lived token. */
function albumRpc(request) {
  if(!request||typeof request!=='object')throw new Error('Solicitação inválida.');
  const data=request.payload||{};
  if(request.action==='login')return login_(data.password);
  verifyToken_(data.token);
  switch(request.action){case 'list':return listPhotos_(data.cursor);case 'image':return readImage_(data.id);case 'upload':return uploadPhoto_(data);default:throw new Error('Operação inválida.');}
}
function allowedOrigins_(){return (PropertiesService.getScriptProperties().getProperty('ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean);}
function hash_(s){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s));}
function sign_(s){const secret=PropertiesService.getScriptProperties().getProperty('SESSION_SECRET');if(!secret)throw new Error('O álbum ainda não foi configurado.');return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s,secret));}
function same_(a,b){a=String(a||'');b=String(b||'');let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
function login_(password){
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const cache=CacheService.getScriptCache(),failures=Number(cache.get('login_failures')||0);
    if(failures>=12)throw new Error('Muitas tentativas. Aguarde 10 minutos antes de tentar novamente.');
    const p=PropertiesService.getScriptProperties(),salt=p.getProperty('PASSWORD_SALT'),expected=p.getProperty('PASSWORD_HASH');
    if(!salt||!expected)throw new Error('O álbum ainda não foi configurado.');
    if(typeof password!=='string'||password.length>256||!same_(hash_(salt+password),expected)){cache.put('login_failures',String(failures+1),600);throw new Error('Essa palavra ainda não abre o álbum.');}
    cache.remove('login_failures');const expires=Date.now()+SESSION_MS,payload=expires+':'+Utilities.getUuid();
    return {token:payload+'.'+sign_(payload),expires};
  }finally{lock.releaseLock();}
}
function verifyToken_(token){
  if(typeof token!=='string'||token.length>250)throw new Error('Entre para acessar o álbum.');
  const parts=token.split('.'),expires=Number(parts[0].split(':')[0]);
  if(parts.length!==2||!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+SESSION_MS+60000||!same_(sign_(parts[0]),parts[1]))throw new Error('Sessão encerrada. Entre novamente no álbum.');
}
function listPhotos_(cursor){
  // Continuation tokens are signed and bound to this folder. Arbitrary Drive iterator tokens are rejected.
  let iterator;
  if(cursor){
    if(typeof cursor!=='string'||cursor.length>12000)throw new Error('Página inválida.');
    const parts=cursor.split('.');if(parts.length!==2||!same_(sign_('cursor:'+parts[0]),parts[1]))throw new Error('Página inválida.');
    iterator=DriveApp.continueFileIterator(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  }else iterator=DriveApp.getFolderById(ALBUM_FOLDER).getFiles();
  const photos=[];let scanned=0;
  while(iterator.hasNext()&&photos.length<18&&scanned<300){const f=iterator.next();scanned++;if(IMAGE_MIMES.includes(f.getMimeType()))photos.push(photoMeta_(f));}
  let next=null;if(iterator.hasNext()){const raw=Utilities.base64EncodeWebSafe(iterator.getContinuationToken());next=raw+'.'+sign_('cursor:'+raw);}
  return {photos,cursor:next};
}
function photoMeta_(file){
  let m={};try{const parsed=JSON.parse(file.getDescription()||'{}');if(parsed.v===1)m=parsed;}catch{}
  return {id:file.getId(),name:file.getName(),feeling:typeof m.feeling==='string'?m.feeling.slice(0,1000):(file.getDescription()||'').slice(0,1000),category:['ela','ele','nos'].includes(m.category)?m.category:'nos',date:/^\d{4}-\d{2}-\d{2}$/.test(m.date||'')?m.date:Utilities.formatDate(file.getDateCreated(),'America/Sao_Paulo','yyyy-MM-dd')};
}
function albumFile_(id){
  if(typeof id!=='string'||!/^[\w-]{10,150}$/.test(id))throw new Error('Foto inválida.');
  const f=DriveApp.getFileById(id),parents=f.getParents();let inside=false;
  while(parents.hasNext())if(parents.next().getId()===ALBUM_FOLDER)inside=true;
  if(!inside||!IMAGE_MIMES.includes(f.getMimeType())||f.isTrashed())throw new Error('Foto fora do nosso álbum.');
  return f;
}
function readImage_(id){const f=albumFile_(id);let blob=f.getThumbnail();if(!blob){if(f.getSize()>8*1024*1024)throw new Error('Adicione uma versão menor dessa foto ao Drive.');blob=f.getBlob();}return {mime:blob.getContentType(),data:Utilities.base64Encode(blob.getBytes())};}
function uploadPhoto_(d){
  if(!d||typeof d.data!=='string'||d.data.length>Math.ceil(MAX_UPLOAD_BYTES*4/3)+8||!IMAGE_MIMES.includes(d.mime))throw new Error('Envie uma foto JPEG, PNG ou WEBP menor.');
  if(!/^[a-f0-9-]{36}$/i.test(d.requestId||''))throw new Error('Identificador de envio inválido.');
  if(typeof d.feeling!=='string'||d.feeling.length>1000||!['ela','ele','nos'].includes(d.category)||!/^\d{4}-\d{2}-\d{2}$/.test(d.date||''))throw new Error('Confira a legenda, a data e quem está na foto.');
  const bytes=Utilities.base64Decode(d.data),u=bytes.map(b=>(b+256)%256);
  if(bytes.length>MAX_UPLOAD_BYTES||bytes.length<12)throw new Error('Foto inválida ou muito grande.');
  const valid=d.mime==='image/jpeg'?u[0]===255&&u[1]===216&&u[2]===255:d.mime==='image/png'?u.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':u.slice(0,4).join(',')==='82,73,70,70'&&u.slice(8,12).join(',')==='87,69,66,80';
  if(!valid)throw new Error('O conteúdo não corresponde a uma imagem válida.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{const folder=DriveApp.getFolderById(ALBUM_FOLDER),ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[d.mime],name='memoria-'+d.requestId+'.'+ext;
    const existing=folder.getFilesByName(name);if(existing.hasNext())return {photo:photoMeta_(existing.next()),duplicate:true};
    const f=folder.createFile(Utilities.newBlob(bytes,d.mime,name));
    f.setDescription(JSON.stringify({v:1,feeling:d.feeling,category:d.category,date:d.date}));
    return {photo:photoMeta_(f)};
  }finally{lock.releaseLock();}
}
