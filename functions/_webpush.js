const enc = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
function unb64(value){const raw=String(value||'').replace(/-/g,'+').replace(/_/g,'/');const padded=raw+'='.repeat((4-raw.length%4)%4);return Uint8Array.from(atob(padded),c=>c.charCodeAt(0));}
const concat=(...parts)=>{const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length;}return out;};
async function hmac(keyBytes,data){const key=await crypto.subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,data));}
async function hkdfExpand(prk,info,length){let previous=new Uint8Array(0),output=new Uint8Array(0),counter=1;while(output.length<length){previous=await hmac(prk,concat(previous,info,new Uint8Array([counter++])));output=concat(output,previous);}return output.slice(0,length);}
async function vapidToken(endpoint,env){
  const privateKeyText=String(env.VAPID_PRIVATE_KEY_PKCS8||'').trim(),publicKey=String(env.VAPID_PUBLIC_KEY||'').trim(),subject=String(env.VAPID_SUBJECT||'').trim();
  if(!privateKeyText||!publicKey||!/^mailto:[^\s@]+@[^\s@]+$/.test(subject))throw new Error('VAPID_NOT_CONFIGURED');
  const privateKey=await crypto.subtle.importKey('pkcs8',unb64(privateKeyText),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const header=b64url(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'})));
  const aud=new URL(endpoint).origin;
  const claims=b64url(enc.encode(JSON.stringify({aud,exp:Math.floor(Date.now()/1000)+6*60*60,sub:subject})));
  const input=`${header}.${claims}`;
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},privateKey,enc.encode(input));
  return {jwt:`${input}.${b64url(signature)}`,publicKey};
}
async function encryptPayload(subscription,payload){
  const uaPublic=unb64(subscription.p256dh),authSecret=unb64(subscription.auth_secret);
  if(uaPublic.length!==65||authSecret.length<16)throw new Error('PUSH_SUBSCRIPTION_KEYS_INVALID');
  const serverPair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const serverPublic=new Uint8Array(await crypto.subtle.exportKey('raw',serverPair.publicKey));
  const clientPublic=await crypto.subtle.importKey('raw',uaPublic,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:clientPublic},serverPair.privateKey,256));
  const keyInfo=concat(enc.encode('WebPush: info\0'),uaPublic,serverPublic);
  const prkKey=await hmac(authSecret,shared);
  const ikm=await hkdfExpand(prkKey,keyInfo,32);
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const prk=await hmac(salt,ikm);
  const cek=await hkdfExpand(prk,enc.encode('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hkdfExpand(prk,enc.encode('Content-Encoding: nonce\0'),12);
  const content=concat(enc.encode(JSON.stringify(payload)),new Uint8Array([2]));
  const aes=await crypto.subtle.importKey('raw',cek,{name:'AES-GCM'},false,['encrypt']);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,tagLength:128},aes,content));
  const rs=new Uint8Array([0,0,16,0]);
  return concat(salt,rs,new Uint8Array([serverPublic.length]),serverPublic,ciphertext);
}
const ALLOWED_PUSH_HOSTS=['fcm.googleapis.com','push.services.mozilla.com','web.push.apple.com','notify.windows.com'];
export function isAllowedPushEndpoint(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&ALLOWED_PUSH_HOSTS.some(host=>url.hostname===host||url.hostname.endsWith(`.${host}`));}catch{return false;}}
export function webPushConfigured(env){return !!(env?.VAPID_PRIVATE_KEY_PKCS8&&env?.VAPID_PUBLIC_KEY&&/^mailto:[^\s@]+@[^\s@]+$/.test(String(env?.VAPID_SUBJECT||'')));}
export async function sendWebPush(subscription,payload,env){
  if(!isAllowedPushEndpoint(subscription.endpoint))throw new Error('PUSH_ENDPOINT_HOST_REJECTED');
  const {jwt,publicKey}=await vapidToken(subscription.endpoint,env);
  const body=await encryptPayload(subscription,payload);
  const response=await fetch(subscription.endpoint,{method:'POST',headers:{Authorization:`vapid t=${jwt}, k=${publicKey}`,'Content-Type':'application/octet-stream','Content-Encoding':'aes128gcm','TTL':'90','Urgency':'normal'},body});
  if(!response.ok){const error=new Error(`PUSH_PROVIDER_${response.status}`);error.status=response.status;throw error;}
  return true;
}
