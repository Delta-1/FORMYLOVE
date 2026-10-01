import {validEndpoint} from './core.js';
// HtmlService + google.script.run avoids fragile CORS redirects and JSONP for private data.
export class DriveAlbum {
  constructor(endpoint) { this.endpoint=endpoint;this.pending=new Map();this.token=null;this.frame=null;this.source=null;this.ready=null; }
  connect() {
    if (this.ready) return this.ready;
    if (!validEndpoint(this.endpoint)) return Promise.reject(new Error('A conexão com o álbum ainda não foi ativada.'));
    this.ready=new Promise((resolve,reject)=>{
      this.channel=crypto.randomUUID();
      const timeout=setTimeout(()=>{this.disconnect();reject(new Error('O álbum não respondeu. Confira a publicação do Apps Script e a origem autorizada.'));},25000);
      this.listener=e=>{
        if (!/^https:\/\/([a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(e.origin) && e.origin!=='https://script.google.com') return;
        const m=e.data;if (!m||m.channel!==this.channel||m.type!=='formylove') return;
        if (m.ready && !this.source) {this.source=e.source;this.origin=e.origin;clearTimeout(timeout);resolve();return;}
        if (e.source!==this.source) return;
        const call=this.pending.get(m.id);if(!call)return;
        clearTimeout(call.timeout);this.pending.delete(m.id);
        m.error?call.reject(new Error(m.error)):call.resolve(m.result);
      };
      window.addEventListener('message',this.listener);
      this.frame=document.createElement('iframe');this.frame.hidden=true;this.frame.title='Conexão privada com o álbum';this.frame.referrerPolicy='no-referrer';
      this.frame.src=this.endpoint+'?bridge=1&channel='+encodeURIComponent(this.channel)+'&origin='+encodeURIComponent(location.origin);
      document.body.append(this.frame);
    });
    return this.ready;
  }
  async call(action,payload={}) {
    await this.connect();
    return new Promise((resolve,reject)=>{
      const id=crypto.randomUUID();const timeout=setTimeout(()=>{this.pending.delete(id);reject(new Error('A operação demorou. Confira o álbum antes de reenviar a foto.'));},90000);
      this.pending.set(id,{resolve,reject,timeout});
      this.source.postMessage({type:'formylove',channel:this.channel,id,action,payload:{...payload,token:this.token}},this.origin);
    });
  }
  async login(password) { const r=await this.call('login',{password});this.token=r.token;return r; }
  list(cursor=null) {return this.call('list',{cursor});}
  image(id) {return this.call('image',{id});}
  upload(data) {return this.call('upload',data);}
  disconnect(){ if(this.listener)window.removeEventListener('message',this.listener);this.frame?.remove();this.source=null;this.ready=null;this.token=null;for(const p of this.pending.values()){clearTimeout(p.timeout);p.reject(new Error('Conexão encerrada.'));}this.pending.clear(); }
}
