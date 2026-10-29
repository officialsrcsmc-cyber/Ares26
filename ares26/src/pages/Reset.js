import {useState,h} from '../shared.js';
import {sb} from '../supabase.js';

export default function Reset(P){
const{go,session}=P;const[a,setA]=useState(""),[b,setB]=useState(""),[er,setEr]=useState(""),[done,setDone]=useState(false);
if(!session)return h`<div class="auth"><h2>Reset password</h2><p class="sub">Open the reset link from your email to set a new password. Request one from the log in page.</p><div class="panel"><button class="btn block" onClick=${()=>go("login")}>Go to log in</button></div></div>`;
const save=async()=>{if(a.length<8)return setEr("Use a password of at least 8 characters.");if(a!==b)return setEr("Passwords do not match.");
 const{error}=await sb.auth.updateUser({password:a});error?setEr(error.message):setDone(true)};
if(done)return h`<div class="auth"><h2>Password updated</h2><p class="sub">You can now use your new password to log in.</p><div class="panel"><button class="btn block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div></div>`;
return h`<div class="auth"><h2>Set a new password</h2><p class="sub">Choose a password of at least 8 characters.</p><div class="panel">
<label>New password<input type="password" autocomplete="new-password" value=${a} onInput=${e=>setA(e.target.value)}/></label>
<label>Confirm password<input type="password" autocomplete="new-password" value=${b} onInput=${e=>setB(e.target.value)}/></label>
${er&&h`<div class="err" role="alert">${er}</div>`}<button class="btn block" onClick=${save}>Save password</button></div></div>`}
