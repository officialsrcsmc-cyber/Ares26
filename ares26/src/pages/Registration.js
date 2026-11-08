import {useState,useEffect,h,phoneClean,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

export default function Registration(P){
const{go}=P;const[s,setS]=useState(1),[f,setF]=useState({smc:"Yes"}),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
const smc=f.smc==="Yes",acad=smc?3:2,total=acad+1;
const set=k=>e=>setF({...f,[k]:e.target.value});
const I=(l,k,t="text")=>h`<label>${l}<input type=${t} value=${f[k]||""} onInput=${set(k)}/></label>`;

const next=()=>{
 if(["fn","ln","email","pw","pw2"].some(k=>!(f[k]||"").trim()))return setErr("Fill in every field to continue.");
 if(!/^\S+@\S+\.\S+$/.test(f.email.trim()))return setErr("Enter a valid email address.");
 if(f.pw!==f.pw2)return setErr("Passwords do not match.");
 if(f.pw.length<8)return setErr("Use a password of at least 8 characters.");
 setErr("");setS(2)};
const nextUhs=()=>{if(!(f.uhs||"").trim())return setErr("Enter your UHS Registration No. / SMC ID to continue.");setErr("");setS(3)};

const submit=async()=>{
 if(["phone","inst","prog","year"].some(k=>!(f[k]||"").trim()))return setErr("Fill in every field to continue.");
 if((f.phone||"").replace(/\D/g,"").length<10)return setErr("Enter a valid WhatsApp number, for example 0300 1234567.");
 if(!f.agree)return setErr("Accept the Terms of Use and Code of Conduct to submit.");
 setErr("");setBusy(true);
 const{data,error}=await sb.auth.signUp({email:f.email.trim(),password:f.pw,options:{emailRedirectTo:location.origin+"/ares26/",
  data:{first_name:f.fn.trim(),last_name:f.ln.trim(),smc:smc,uhs_id:smc?(f.uhs||"").trim():"",phone:f.phone.trim(),institution:f.inst.trim(),programme:f.prog.trim(),degree_year:f.year.trim(),agreed_at:new Date().toISOString()}}});
 setBusy(false);
 if(error)return setErr(error.message);
 if(data.user&&data.user.identities&&data.user.identities.length===0)return setErr("This email is already registered. Log in instead.");
 if(data.session)return go("dashboard");
 setSent(true)};

if(sent)return h`<div class="auth wide"><h2>Check your email</h2><p class="sub">One more step to activate your account.</p><div class="panel"><p style="margin:0 0 12px">We sent a confirmation link to <b>${f.email}</b>. Open it to activate your account, then log in to upload your payment proof and finish your registration.</p><p class="fine">Nothing there after a few minutes? Check your spam folder.</p><button class="btn block" onClick=${()=>go("login")}>Go to log in</button></div></div>`;

return h`<div class="auth wide"><h2>Registration</h2><p class="sub">Step ${s} of ${total}${s==1?": your account":s==2&&smc?": SMC verification":s==acad?": academic details":""}</p><div class="st">${Array.from({length:total},(_,i)=>i+1).map(i=>h`<i class=${i<=s?"on":""}/>`)}</div>
<div class="panel">
${s==1&&h`<div><h3>Create your account</h3>${I("First name","fn")}${I("Last name","ln")}${I("Email","email","email")}${I("Password (8+ characters)","pw","password")}${I("Confirm password","pw2","password")}<label>Are you an SMC student?<select value=${f.smc} onChange=${set("smc")}><option>Yes</option><option>No</option></select></label></div>`}
${s==2&&smc&&h`<div><h3>SMC verification</h3><p class="fine" style="margin-top:0">Since you are an SMC student, we need your UHS Registration No. or SMC ID to verify your registration.</p>${I("UHS Registration No. / SMC ID","uhs")}</div>`}
${s==acad&&h`<div><h3>Academic details</h3><label>WhatsApp number<input type="tel" placeholder="e.g. 0300 1234567 or +92 300 1234567" inputMode="tel" autoComplete="tel" value=${f.phone||""} onInput=${e=>{e.target.value=phoneClean(e.target.value);set("phone")(e)}}/><span class="fine" style="display:block;margin-top:4px">Use the number you have on WhatsApp. We use it to share event updates.</span></label>${I("Institution name","inst")}${I("Programme (e.g. MBBS)","prog")}${I("Degree year","year")}
<label class="chk"><input type="checkbox" checked=${!!f.agree} onChange=${e=>setF({...f,agree:e.target.checked})}/><span>I agree to the <a href="#terms" onClick=${e=>{e.preventDefault();go("terms")}}>Terms of Use</a> and <a href="#conduct" onClick=${e=>{e.preventDefault();go("conduct")}}>Code of Conduct</a>.</span></label>
<p class="fine">Next, we email you a confirmation link. After confirming, log in and upload your payment proof from your dashboard. The team then verifies it and your status changes to Approved or Rejected.</p></div>`}
${err&&h`<div class="err" role="alert">${err}</div>`}
<div class="row">${s>1&&h`<button class="btn o" onClick=${()=>{setErr("");setS(s-1)}}>Back</button>`}<button class="btn" disabled=${busy} onClick=${s==1?next:s==acad?submit:nextUhs}>${s<acad?"Continue":busy?"Creating account...":"Create account"}</button></div>
${s==1&&h`<p class="alt">Already registered? <a href="#login" onClick=${e=>{e.preventDefault();go("login")}}>Log in</a></p>`}</div></div>`}
