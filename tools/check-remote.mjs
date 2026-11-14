import fs from 'node:fs';
const items=JSON.parse(fs.readFileSync('data/hardware-images.json','utf8')).items.filter(p=>p.mission==='Sojourner');
const results=await Promise.all(items.map(async p=>{try{const r=await fetch(p.image_remote,{signal:AbortSignal.timeout(10000)});const type=r.headers.get('content-type');return {component:p.component,url:p.image_remote,http:r.status,type,ok:r.ok&&!!type?.startsWith('image/'),note:'HTTP check only, not browser decoding'};}catch(e){return {component:p.component,url:p.image_remote,ok:false,error:e.message,note:'Network failure is not proof the source URL is broken'};}}));
fs.writeFileSync('docs/REMOTE_IMAGE_CHECK.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
console.log(JSON.stringify(results.map(({component,ok,error,http})=>({component,ok,error,http})),null,2));
