// Cloudflare Pages Function + D1 — akun & save game Kota Mungil
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const rnd=n=>hex(crypto.getRandomValues(new Uint8Array(n)));
const UREG=/^[A-Za-z0-9_]{3,16}$/;
async function hp(pw,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},k,256))}
let ready=null;
const init=db=>ready||(ready=db.batch([
db.prepare('CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY COLLATE NOCASE, salt TEXT NOT NULL, hash TEXT NOT NULL, created INTEGER NOT NULL)'),
db.prepare('CREATE TABLE IF NOT EXISTS saves(username TEXT PRIMARY KEY COLLATE NOCASE, data TEXT NOT NULL, updated INTEGER NOT NULL)'),
db.prepare('CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, username TEXT NOT NULL, expires INTEGER NOT NULL)')]));
async function who(db,token){if(!token||typeof token!='string')return null;
const r=await db.prepare('SELECT username FROM sessions WHERE token=?1 AND expires>?2').bind(token,Date.now()).first();return r?r.username:null}
async function newSession(db,u){const t=rnd(24);await db.prepare('INSERT INTO sessions(token,username,expires) VALUES(?1,?2,?3)').bind(t,u,Date.now()+30*864e5).run();return t}
export async function onRequest({request,env,params}){
const db=env.DB;if(!db)return J({error:'db_not_bound'},500);
const path=[].concat(params.path||[]).join('/');
if(path=='ping')return J({ok:true});
if(request.method!='POST')return J({error:'method_not_allowed'},405);
let b;try{b=await request.json()}catch(e){return J({error:'bad_json'},400)}
await init(db);
if(path=='register'){const u=String(b.username||'').trim(),p=String(b.password||'');
if(!UREG.test(u)||p.length<4||p.length>64)return J({error:'invalid'},400);
if(await db.prepare('SELECT 1 AS x FROM users WHERE username=?1').bind(u).first())return J({error:'username_taken'},409);
const salt=rnd(16),h=await hp(p,salt);
try{await db.prepare('INSERT INTO users(username,salt,hash,created) VALUES(?1,?2,?3,?4)').bind(u,salt,h,Date.now()).run()}catch(e){return J({error:'username_taken'},409)}
return J({ok:true,username:u,token:await newSession(db,u)})}
if(path=='login'){const u=String(b.username||'').trim(),p=String(b.password||'');
const r=await db.prepare('SELECT username,salt,hash FROM users WHERE username=?1').bind(u).first();
if(!r||await hp(p,r.salt)!==r.hash)return J({error:'bad_login'},401);
return J({ok:true,username:r.username,token:await newSession(db,r.username)})}
if(path=='save'){const u=await who(db,b.token);if(!u)return J({error:'unauthorized'},401);
const d=String(b.data||'');if(!d||d.length>200000)return J({error:'invalid'},400);
await db.prepare('INSERT OR REPLACE INTO saves(username,data,updated) VALUES(?1,?2,?3)').bind(u,d,Date.now()).run();return J({ok:true})}
if(path=='load'){const u=await who(db,b.token);if(!u)return J({error:'unauthorized'},401);
const r=await db.prepare('SELECT data FROM saves WHERE username=?1').bind(u).first();return J({ok:true,data:r?r.data:null})}
return J({error:'not_found'},404)}
