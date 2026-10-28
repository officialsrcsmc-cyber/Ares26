import {useState,useEffect,h,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

export default function Registration(P){
const{go}=P;const[s,setS]=useState(1),[f,setF]=useState({smc:"Yes"}),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
const set=k=>e=>setF({...f,[k]:e.target.value});
const I=(l,k,t="text")=>h`<label>${l}<input type=${t} value=${f[k]||""} onInput=${set(k)}/></label>`;

const next=()=>{
 if(["fn","ln","email","pw","pw2"].some(k=>!(f[k]||"").trim()))return setErr("Fill in every field to continue.");
 if(!/^\S+@\S+\.\S+$/.test(f.email.trim()))return setErr("Enter a valid email address.");
 if(f.pw!==f.pw2)return setErr("Passwords do not match.");
 if(f.pw.length<8)return setErr("Use a password of at least 8 characters.");
 setErr("");setS(2)};

const submit=async()=>{
 if(["phone","inst","prog","year"].some(k=>!(f[k]||"").trim()))return setErr("Fill in every field to continue.");
 if(!f.agree)return setErr("Accept the Terms of Use and Code of Conduct to submit.");
 setErr("");setBusy(true);
 const{data,error}=await sb.auth.signUp({email:f.email.trim(),password:f.pw,options:{emailRedirectTo:location.origin,
  data:{first_name:f.fn.trim(),last_name:f.ln.trim(),smc:f.smc==="Yes",phone:f.phone.trim(),institution:f.inst.trim(),programme:f.prog.trim(),degree_year:f.year.trim(),agreed_at:new Date().toISOString()}}});
 setBusy(false);
 if(error)return setErr(error.message);
 if(data.user&&data.user.identities&&data.user.identities.length===0)return setErr("This email is already registered. Log in instead.");
 if(data.session)return go("dashboard");
 setSent(true)};

if(sent)return h`<div class="w sec" style="max-width:560px"><h2>Check your email</h2><div class="card k"><p style="margin:0">We sent a confirmation link to <b>${f.email}</b>. Open it to activate your account, then log in to upload your payment proof and finish your registration.</p></div><p class="mut">Nothing there after a few minutes? Check your spam folder.</p><button class="btn" onClick=${()=>go("login")}>Go to log in</button></div>`;

return h`<div class="w sec" style="max-width:560px"><h2>Registration</h2><div class="st">${[1,2,3].map(i=>h`<i class=${i<=s?"on":""}/>`)}</div>
${s==1&&h`<div><h3>Create your account</h3>${I("First name","fn")}${I("Last name","ln")}${I("Email","email","email")}${I("Password (8+ characters)","pw","password")}${I("Confirm password","pw2","password")}<label>Are you an SMC student?<select value=${f.smc} onChange=${set("smc")}><option>Yes</option><option>No</option></select></label></div>`}
${s==2&&h`<div><h3>Academic details</h3>${I("Phone number","phone","tel")}${I("Institution name","inst")}${I("Programme (e.g. MBBS)","prog")}${I("Degree year","year")}
<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" style="width:auto;margin-top:5px" onChange=${e=>setF({...f,agree:e.target.checked})}/><span>I agree to the <a href="#terms" onClick=${e=>{e.preventDefault();go("terms")}}>Terms of Use</a> and <a href="#conduct" onClick=${e=>{e.preventDefault();go("conduct")}}>Code of Conduct</a>.</span></label>
<p class="mut" style="font-size:.85rem">Next, we email you a confirmation link. After confirming, log in and upload your payment proof from your dashboard. The team then verifies it and your status changes to Approved or Rejected.</p></div>`}
${err&&h`<div class="err">${err}</div>`}
<div style="display:flex;gap:10px">${s>1&&h`<button class="btn o" onClick=${()=>{setErr("");setS(1)}}>Back</button>`}<button class="btn" disabled=${busy} onClick=${s==1?next:submit}>${s==1?"Continue":busy?"Creating account...":"Create account"}</button></div>
${s==1&&h`<p class="mut">Already registered? <a href="#login" onClick=${e=>{e.preventDefault();go("login")}}>Log in</a></p>`}</div>`}
