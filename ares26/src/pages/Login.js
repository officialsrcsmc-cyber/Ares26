import {useState,h,Spin,useSubmit,friendly,withTimeout,focusFirstError,Inp} from '../shared.js';
import {sb} from '../supabase.js';

export default function Login(P){
const{go}=P;const[f,setF]=useState({}),[fe,setFe]=useState({}),[er,setEr]=useState(""),[info,setInfo]=useState(""),[busy,run]=useSubmit();
const set=k=>e=>setF({...f,[k]:e.target.value});
const ok=ev=>{ev&&ev.preventDefault();setEr("");setInfo("");const x={};
 if(!(f.email||"").trim())x.email="Enter your email address.";else if(!/^\S+@\S+\.\S+$/.test(f.email.trim()))x.email="Enter a valid email address.";
 if(!f.pw)x.pw="Enter your password.";
 setFe(x);if(Object.keys(x).length){focusFirstError();return}
 return run(async()=>{try{
  const{error}=await withTimeout(sb.auth.signInWithPassword({email:f.email.trim(),password:f.pw}),20000);
  if(error){setEr(/confirm/i.test(error.message)?"Please confirm your email first. Check your inbox for the link.":/invalid|credentials/i.test(error.message)?"Email or password is incorrect.":friendly(error));return}
  let nx="dashboard";try{nx=sessionStorage.getItem("srcNext")||"dashboard";sessionStorage.removeItem("srcNext")}catch(x){}
  go(nx)}catch(e){setEr(friendly(e))}})};
const forgot=()=>{setEr("");setInfo("");const m=(f.email||"").trim();
 if(!m||!/^\S+@\S+\.\S+$/.test(m)){setFe({email:"Type your email above first."});focusFirstError();return}
 setFe({});return run(async()=>{try{
  const{error}=await withTimeout(sb.auth.resetPasswordForEmail(m,{redirectTo:location.origin+"/ares26/"}),20000);
  error?setEr(friendly(error)):setInfo("If that email is registered, a reset link is on its way.")}catch(e){setEr(friendly(e))}})};
return h`<div class="auth"><h1 style="font-size:1.7rem">Log in</h1><p class="sub">Access your registration, payment and abstracts.</p>
<form class="panel" noValidate onSubmit=${ok}>
<${Inp} l="Email" k="email" t="email" ac="email" f=${f} set=${set} fe=${fe}/>
<${Inp} l="Password" k="pw" t="password" ac="current-password" f=${f} set=${set} fe=${fe}/>
${er&&h`<div class="err" role="alert" tabIndex="-1">${er}</div>`}${info&&h`<div class="ok" role="status">${info}</div>`}
<button type="submit" class="btn block" disabled=${busy} aria-busy=${busy}>${busy&&h`<${Spin}/>`}${busy?"Please wait…":"Log in"}</button>
<div class="linkrow"><button type="button" class="lk" disabled=${busy} onClick=${forgot}>Forgot password?</button></div>
<p class="alt">New here? <a href="#register" onClick=${x=>{x.preventDefault();go("register")}}>Create an account</a></p>
</form></div>`}
