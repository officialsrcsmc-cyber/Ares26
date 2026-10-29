import {useState,h} from '../shared.js';
import {sb} from '../supabase.js';

export default function Login(P){
const{go}=P;const[e,setE]=useState(""),[p,setP]=useState(""),[er,setEr]=useState(""),[info,setInfo]=useState(""),[busy,setBusy]=useState(false);
const ok=async()=>{setEr("");setInfo("");if(!e||!p)return setEr("Enter your email and password.");setBusy(true);
 const{error}=await sb.auth.signInWithPassword({email:e.trim(),password:p});setBusy(false);
 if(error)return setEr(/confirm/i.test(error.message)?"Please confirm your email first. Check your inbox for the link.":"Email or password is incorrect.");
 go("dashboard")};
const forgot=async()=>{setEr("");setInfo("");if(!e)return setEr("Type your email above first.");
 const{error}=await sb.auth.resetPasswordForEmail(e.trim(),{redirectTo:location.origin});
 error?setEr(error.message):setInfo("If that email is registered, a reset link is on its way.")};
return h`<div class="auth"><h2>Log in</h2><p class="sub">Access your registration, payment and abstracts.</p>
<div class="panel">
<label>Email<input type="email" autocomplete="email" value=${e} onInput=${x=>setE(x.target.value)}/></label>
<label>Password<input type="password" autocomplete="current-password" value=${p} onInput=${x=>setP(x.target.value)} onKeyDown=${x=>x.key==="Enter"&&ok()}/></label>
${er&&h`<div class="err" role="alert">${er}</div>`}${info&&h`<div class="ok" role="status">${info}</div>`}
<button class="btn block" disabled=${busy} onClick=${ok}>${busy?"Logging in...":"Log in"}</button>
<div class="linkrow"><button type="button" class="lk" onClick=${forgot}>Forgot password?</button></div>
<p class="alt">New here? <a href="#register" onClick=${x=>{x.preventDefault();go("register")}}>Create an account</a></p>
</div></div>`}
