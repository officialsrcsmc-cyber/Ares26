import {useState,useEffect,h,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

export default function Reset(P){
const{go,session}=P;const[a,setA]=useState(""),[b,setB]=useState(""),[er,setEr]=useState(""),[done,setDone]=useState(false);
if(!session)return h`<div class="w sec" style="max-width:420px"><h2>Reset password</h2><p class="mut">Open the reset link from your email to set a new password. Request one from the log in page.</p><button class="btn" onClick=${()=>go("login")}>Go to log in</button></div>`;
const save=async()=>{if(a.length<8)return setEr("Use a password of at least 8 characters.");if(a!==b)return setEr("Passwords do not match.");
 const{error}=await sb.auth.updateUser({password:a});error?setEr(error.message):setDone(true)};
if(done)return h`<div class="w sec" style="max-width:420px"><h2>Password updated</h2><button class="btn" onClick=${()=>go("dashboard")}>Go to dashboard</button></div>`;
return h`<div class="w sec" style="max-width:420px"><h2>Set a new password</h2><label>New password<input type="password" value=${a} onInput=${e=>setA(e.target.value)}/></label><label>Confirm password<input type="password" value=${b} onInput=${e=>setB(e.target.value)}/></label>${er&&h`<div class="err">${er}</div>`}<button class="btn" onClick=${save}>Save password</button></div>`}
