import {useState,h,phoneClean,Spin,useSubmit,friendly,withTimeout,focusFirstError,Inp,track,THANKS_KEY} from '../shared.js';
import {sb} from '../supabase.js';

const EM=/^\S+@\S+\.\S+$/;

export default function Registration(P){
const{go}=P;const[s,setS]=useState(1),[f,setF]=useState({smc:"Yes"}),[fe,setFe]=useState({}),[err,setErr]=useState(""),[busy,run]=useSubmit();
const set=k=>e=>setF({...f,[k]:e.target.value});
const fail=x=>{setFe(x);setErr(Object.keys(x).length?"Please fix the highlighted fields.":"");if(Object.keys(x).length)focusFirstError();return Object.keys(x).length>0};
const need=(x,k,m)=>{if(!(f[k]||"").trim())x[k]=m};

const next=()=>{const x={};
 need(x,"fn","Enter your first name.");need(x,"ln","Enter your last name.");
 if(!(f.email||"").trim())x.email="Enter your email address.";else if(!EM.test(f.email.trim()))x.email="Enter a valid email address.";
 if(!f.pw)x.pw="Choose a password.";else if(f.pw.length<8)x.pw="Use a password of at least 8 characters.";
 if(!f.pw2)x.pw2="Confirm your password.";else if(f.pw!==f.pw2)x.pw2="Passwords do not match.";
 if(fail(x))return;setS(2)};

const submit=()=>{const x={};
 const ph=(f.phone||"").trim(),digits=ph.replace(/\D/g,"");
 if(!ph)x.phone="Enter your phone number.";else if(!/^[+\d][\d\s()\-]*$/.test(ph)||digits.length<7||digits.length>15)x.phone="Enter a valid phone number (7–15 digits).";
 need(x,"inst","Enter your institution.");need(x,"prog","Enter your programme.");need(x,"year","Enter your degree year.");
 if(!f.agree)x.agree="Accept the Terms and Code of Conduct to submit.";
 if(fail(x))return;
 return run(async()=>{try{
  const{data,error}=await withTimeout(sb.auth.signUp({email:f.email.trim(),password:f.pw,options:{emailRedirectTo:location.origin+"/ares26/",
   data:{first_name:f.fn.trim(),last_name:f.ln.trim(),smc:f.smc==="Yes",phone:ph,institution:f.inst.trim(),programme:f.prog.trim(),degree_year:f.year.trim(),agreed_at:new Date().toISOString()}}}),30000);
  if(error)return setErr(friendly(error));
  if(data.user&&data.user.identities&&data.user.identities.length===0)return setErr("This email is already registered. Log in instead.");
  track("registration_submitted");
  if(data.session)return go("dashboard");
  try{sessionStorage.setItem(THANKS_KEY,"registered")}catch(e){}
  go("thanks")}catch(e){setErr(friendly(e))}})};

const onSubmit=ev=>{ev.preventDefault();s==1?next():submit()};
const A=p=>h`<${Inp} f=${f} set=${set} fe=${fe} ...${p}/>`;
return h`<div class="auth wide"><h1 style="font-size:1.7rem">Registration</h1><p class="sub">Step ${s} of 3${s==1?": your account":s==2?": academic details":""}</p><div class="st" aria-hidden="true">${[1,2,3].map(i=>h`<i class=${i<=s?"on":""}/>`)}</div>
<form class="panel" noValidate onSubmit=${onSubmit}>
${s==1&&h`<div><h2 style="font-size:1.15rem;margin-bottom:14px">Create your account</h2>${A({l:"First name",k:"fn",ac:"given-name"})}${A({l:"Last name",k:"ln",ac:"family-name"})}${A({l:"Email",k:"email",t:"email",ac:"email"})}${A({l:"Password (8+ characters)",k:"pw",t:"password",ac:"new-password"})}${A({l:"Confirm password",k:"pw2",t:"password",ac:"new-password"})}<label>Are you an SMC student?<select value=${f.smc} onChange=${set("smc")}><option>Yes</option><option>No</option></select></label></div>`}
${s==2&&h`<div><h2 style="font-size:1.15rem;margin-bottom:14px">Academic details</h2>${A({l:"Phone number",k:"phone",t:"tel",ac:"tel",inputMode:"tel",clean:phoneClean})}${A({l:"Institution name",k:"inst",ac:"organization"})}${A({l:"Programme (e.g. MBBS)",k:"prog"})}${A({l:"Degree year",k:"year"})}
<label class="chk"><input type="checkbox" checked=${!!f.agree} aria-invalid=${fe.agree?"true":"false"} aria-describedby=${fe.agree?"e-agree":undefined} onChange=${e=>setF({...f,agree:e.target.checked})}/><span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms & Conditions</a> and <a href="#conduct" onClick=${e=>{e.preventDefault();window.open(location.pathname+"#conduct","_blank","noopener")}}>Code of Conduct</a>. See also the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>
${fe.agree&&h`<span class="fe" id="e-agree" role="alert" style="margin:-8px 0 14px">${fe.agree}</span>`}
<p class="fine">Next, we email you a confirmation link. After confirming, log in and upload your payment proof from your dashboard. The team then verifies it and your status changes to Approved or Rejected.</p></div>`}
${err&&h`<div class="err" role="alert" tabIndex="-1">${err}</div>`}
<div class="row">${s>1&&h`<button type="button" class="btn o" disabled=${busy} onClick=${()=>{setErr("");setFe({});setS(1)}}>Back</button>`}<button type="submit" class="btn" disabled=${busy} aria-busy=${busy}>${busy&&h`<${Spin}/>`}${s==1?"Continue":busy?"Creating account…":"Create account"}</button></div>
${s==1&&h`<p class="alt">Already registered? <a href="#login" onClick=${e=>{e.preventDefault();go("login")}}>Log in</a></p>`}</form></div>`}
