import {useState,useEffect,h,Ic,feeLabel,wkDate,ACCTS} from '../shared.js';
import {upload,MAX_FILE} from '../supabase.js';

const Head=(e,t)=>h`<div class="ab-top"><p class="ab-eyebrow"><span>ARES’26</span><i aria-hidden="true"></i><span>${e}</span></p><h1 class="ab-title">${t}</h1></div>`;

export default function Workshops(P){
const{ct,session,profile,enr,go,sb,refresh}=P;
const[busy,setBusy]=useState(""),[err,setErr]=useState("");
const[payFor,setPayFor]=useState(""),[pf,setPf]=useState({}),[file,setFile]=useState(null);
const list=ct.workshops||[];
const mine=id=>(enr||[]).find(e=>e.workshop_id===id);
const loading=session===undefined||(session&&profile===undefined);

// Who may enrol: someone who has signed up (has a profile) AND whose registration is Approved.
// The database enforces the same rule, so this only decides what message to show.
let gate=null;
if(!loading){
 if(!session)gate={msg:"Log in with your ARES’26 account to enrol. You need an approved registration first.",btn:"Log in",to:"login"};
 else if(!profile)gate={msg:"We could not load your registration. Open your dashboard and try again.",btn:"Go to dashboard",to:"dashboard"};
 else if(profile.status==="Rejected")gate={msg:"Your payment was rejected. Upload a new proof on your dashboard. You can enrol once your registration is approved.",btn:"Go to dashboard",to:"dashboard"};
 else if(profile.status!=="Approved")gate={msg:profile.proof_path?"Your registration is awaiting approval. You can enrol in a workshop as soon as it is approved.":"Complete your registration payment first. Workshop enrolment opens once your registration is approved.",btn:"Go to dashboard",to:"dashboard"};
}

// Pop-up shown to anyone who is not yet verified. Once per browser session, so it never nags.
const SEEN="ares26-wk-notice";
const[note,setNote]=useState(false);
useEffect(()=>{
 if(loading||!gate)return;
 try{if(sessionStorage.getItem(SEEN))return}catch(_){}
 setNote(true)},[loading,!!gate]);
const closeNote=()=>{setNote(false);try{sessionStorage.setItem(SEEN,"1")}catch(_){}};
useEffect(()=>{
 if(!note)return;
 const k=e=>{if(e.key==="Escape")closeNote()};
 document.addEventListener("keydown",k);
 return()=>document.removeEventListener("keydown",k)},[note]);

const feeOf=w=>profile?Number(profile.smc?w.feeSmc:w.feeNon)||0:0;
const setPF=k=>e=>setPf({...pf,[k]:e.target.value});
const openPay=w=>{setErr("");setPf({});setFile(null);setPayFor(w.id)};
const closePay=()=>{setErr("");setPf({});setFile(null);setPayFor("")};

const enrol=async w=>{
 setErr("");setBusy(w.id);
 const{error}=await sb.from("workshop_enrollments").insert({user_id:session.user.id,workshop_id:w.id,workshop_title:w.title||""});
 if(error&&error.code!=="23505")setErr(/row-level security|policy/i.test(error.message)?"Only approved registrations can enrol in a workshop.":error.message);
 await refresh();setBusy("")};

const enrolPay=async(w,existing)=>{
 if(!pf.txd||!pf.acct||!pf.tid||!file)return setErr("Fill in every field and choose your payment proof.");
 if(file.size>MAX_FILE)return setErr("File is larger than 5 MB.");
 setErr("");setBusy(w.id);
 try{
  const path=await upload("payment-proofs",session.user.id,file);
  const row={tx_date:new Date(pf.txd).toISOString(),account_name:pf.acct.trim(),tx_id:pf.tid.trim(),amount:feeOf(w),proof_path:path};
  if(existing){const{error}=await sb.from("workshop_enrollments").update(row).eq("id",existing.id);if(error)throw error}
  else{const{error}=await sb.from("workshop_enrollments").insert({...row,user_id:session.user.id,workshop_id:w.id,workshop_title:w.title||""});if(error&&error.code!=="23505")throw error}
  closePay();await refresh()}
 catch(e){setErr(e.message||"Upload failed. Try again.")}
 setBusy("")};

const cancel=async e=>{
 if(!window.confirm("Cancel this enrolment request?"))return;
 setErr("");setBusy(e.workshop_id);
 const{error}=await sb.from("workshop_enrollments").delete().eq("id",e.id);
 if(error)setErr(error.message);
 await refresh();setBusy("")};

const payForm=w=>h`<div class="panel" style="margin-top:10px">
<p class="ab-lbl">Send payment to</p><div class="pf-grid">${ACCTS.map(([b,n,o])=>h`<div class="pf-card acct" key=${b}><span class="ab-ico sm"><${Ic} n="phone"/></span><div class="pf-body"><p class="ab-lbl">${b}</p><p class="ab-val pf-num">${n}</p><p class="ab-txt">${o}</p></div></div>`)}</div>
<p class="mut" style="font-size:.9rem;margin:10px 0 0">Fee: ${feeLabel(feeOf(w))}. Pay the fee, then enter the transfer details below.</p>
<label>Transaction date & time<input type="datetime-local" value=${pf.txd||""} onInput=${setPF("txd")}/></label>
<label>Account name<input value=${pf.acct||""} onInput=${setPF("acct")}/></label>
<label>Transaction ID<input value=${pf.tid||""} onInput=${setPF("tid")}/></label>
<label>Payment proof (image or PDF, max 5 MB)<input type="file" accept="image/*,.pdf" onChange=${e=>setFile(e.target.files[0]||null)}/></label>
${err&&h`<div class="err" role="alert">${err}</div>`}
<div class="row"><button class="btn o" disabled=${busy===w.id} onClick=${closePay}>Cancel</button><button class="btn block" disabled=${busy===w.id} onClick=${()=>enrolPay(w,mine(w.id)&&mine(w.id).status==="Rejected"?mine(w.id):null)}>${busy===w.id?"Uploading...":"Submit payment"}</button></div></div>`;

const action=w=>{
 const e=mine(w.id),fee=feeOf(w);
 if(e&&e.status==="Approved")return h`<div class="wk-state ok"><${Ic} n="check" size=${18}/><span>You’re in. Your ticket is on your dashboard.</span></div><button class="btn o s" onClick=${()=>go("dashboard")}>View ticket</button>`;
 if(e&&e.status==="Pending")return h`<div class="wk-state"><${Ic} n="clock" size=${18}/><span>Request sent. Awaiting approval from the team.</span></div><button class="btn o s" disabled=${busy===w.id} onClick=${()=>cancel(e)}>Cancel request</button>`;
 if(e&&e.status==="Rejected"){
  if(fee>0){
   if(payFor===w.id)return payForm(w);
   return h`<div class="wk-state bad"><${Ic} n="alert" size=${18}/><span>Your request was not approved for this workshop.</span></div><button class="btn o s" disabled=${busy===w.id} onClick=${()=>openPay(w)}>Upload new proof</button>`;
  }
  return h`<div class="wk-state bad"><${Ic} n="alert" size=${18}/><span>Your request was not approved for this workshop.</span></div>`;
 }
 if(loading)return h`<button class="btn block" disabled>Loading...</button>`;
 if(gate)return h`<button class="btn block" onClick=${()=>go(gate.to)}>${session?"Enrolment opens after approval":"Log in to enrol"}</button>`;
 if(fee>0){
  if(payFor===w.id)return payForm(w);
  return h`<button class="btn block" disabled=${busy===w.id} onClick=${()=>openPay(w)}>Request enrolment</button>`;
 }
 return h`<button class="btn block" disabled=${busy===w.id} onClick=${()=>enrol(w)}>${busy===w.id?"Sending...":"Request enrolment"}</button>`};

return h`<div class="w sec ab">${Head("HANDS-ON","Workshops")}
${note&&gate&&h`<div class="wk-modal" onClick=${e=>{if(e.target===e.currentTarget)closeNote()}}><div class="wk-dialog" role="dialog" aria-modal="true" aria-labelledby="wk-nt">
<span class="ab-ico"><${Ic} n="lock"/></span>
<h2 id="wk-nt">Verification required</h2>
<p>Your account must be verified before you can enrol in the workshops.</p>
<ul class="wk-fees"><li><b>SMC students</b><span>Free</span></li><li><b>Outside SMC</b><span>Around PKR 500</span></li></ul>
<div class="row"><button class="btn o" onClick=${closeNote}>Not now</button><button class="btn" onClick=${()=>{closeNote();go(gate.to)}}>${gate.btn}</button></div></div></div>`}
${gate&&h`<div class="wk-gate" role="status"><span class="ab-ico sm"><${Ic} n="lock"/></span><div><p>${gate.msg}</p><button class="btn o s" onClick=${()=>go(gate.to)}>${gate.btn}</button></div></div>`}
${err&&!payFor&&h`<div class="err" role="alert">${err}</div>`}
${list.length?h`<div class="g c3">${list.map(w=>{
 const fee=profile?(feeOf(w)):null,when=[wkDate(w.date),w.time].filter(Boolean).join(" · ");
 return h`<div class="card wk-card" key=${w.id}>${w.image&&h`<img src=${w.image} alt=${w.title} loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;margin-bottom:12px"/>`}<h3>${w.title}</h3>
 ${(when||w.venue)&&h`<p class="wk-when">${when&&h`<span><${Ic} n="cal" size=${15}/>${when}</span>`}${w.venue&&h`<span><${Ic} n="pin" size=${15}/>${w.venue}</span>`}</p>`}
 <p class="mut" style="white-space:pre-wrap">${w.desc}</p>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">${fee!==null?(feeLabel(fee)&&h`<span class="badge Accepted">Your fee: ${feeLabel(fee)}</span>`):h`${feeLabel(w.feeSmc)&&h`<span class="badge Accepted">SMC: ${feeLabel(w.feeSmc)}</span>`}${feeLabel(w.feeNon)&&h`<span class="badge Pending">Non-SMC: ${feeLabel(w.feeNon)}</span>`}`}</div>
 <div class="wk-act">${action(w)}</div></div>`})}</div>`
:h`<div class="ab-note"><p>Coming soon. Hands-on workshop details, schedule and enrolment will be posted here.</p></div>`}</div>`}
