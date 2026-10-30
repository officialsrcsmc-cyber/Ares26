import {useState,h,Spin,useSubmit,friendly,withTimeout,focusFirstError,Inp,PageSkel} from '../shared.js';
import {sb} from '../supabase.js';

export default function Reset(P){
const{go,session}=P;const[f,setF]=useState({}),[fe,setFe]=useState({}),[er,setEr]=useState(""),[done,setDone]=useState(false),[busy,run]=useSubmit();
const set=k=>e=>setF({...f,[k]:e.target.value});
if(session===undefined)return h`<${PageSkel} narrow=${true}/>`;
if(!session)return h`<div class="auth"><h1 style="font-size:1.7rem">Reset password</h1><p class="sub">Open the reset link from your email to set a new password. Request one from the log in page.</p><div class="panel"><button class="btn block" onClick=${()=>go("login")}>Go to log in</button></div></div>`;
const save=ev=>{ev.preventDefault();setEr("");const x={};
 if((f.a||"").length<8)x.a="Use a password of at least 8 characters.";
 if(f.a!==f.b)x.b="Passwords do not match.";
 setFe(x);if(Object.keys(x).length){focusFirstError();return}
 return run(async()=>{try{const{error}=await withTimeout(sb.auth.updateUser({password:f.a}),20000);error?setEr(friendly(error)):setDone(true)}catch(e){setEr(friendly(e))}})};
if(done)return h`<div class="auth"><h1 style="font-size:1.7rem">Password updated</h1><p class="sub">You can now use your new password to log in.</p><div class="panel"><button class="btn block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div></div>`;
return h`<div class="auth"><h1 style="font-size:1.7rem">Set a new password</h1><p class="sub">Choose a password of at least 8 characters.</p><form class="panel" noValidate onSubmit=${save}>
<${Inp} l="New password" k="a" t="password" ac="new-password" f=${f} set=${set} fe=${fe}/>
<${Inp} l="Confirm password" k="b" t="password" ac="new-password" f=${f} set=${set} fe=${fe}/>
${er&&h`<div class="err" role="alert" tabIndex="-1">${er}</div>`}<button type="submit" class="btn block" disabled=${busy} aria-busy=${busy}>${busy&&h`<${Spin}/>`}${busy?"Saving…":"Save password"}</button></form></div>`}
