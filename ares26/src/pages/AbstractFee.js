import {useState,useEffect,h,ABS_FEE,ACCTS,Ic,absRef} from '../shared.js';
import {sb,upload,MAX_FILE} from '../supabase.js';

// Private payment page for one accepted abstract: #abstract-submission-<ref_no>
export default function AbstractFee(P){
const{session,go,fref}=P;
const[a,setA]=useState(undefined),[f,setF]=useState({}),[file,setFile]=useState(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[cpy,setCpy]=useState("");
const uid=session&&session.user&&session.user.id;

const load=async()=>{
 const{data,error}=await sb.from("abstracts").select("*").eq("ref_no",Number(fref)).maybeSingle();
 setA(error?null:data||null)};
useEffect(()=>{setA(undefined);if(uid)load()},[uid,fref]);

const toLogin=()=>{try{sessionStorage.setItem("ares26_after_login","abstract-submission-"+fref)}catch(e){}go("login")};
const set=k=>e=>setF({...f,[k]:e.target.value});
const copy=async(k,v)=>{try{await navigator.clipboard.writeText(v);setCpy(k);setTimeout(()=>setCpy(""),1800)}catch(e){}};

const pay=async()=>{
 if(!f.txd||!f.acct||!f.tid||!file)return setErr("Fill in every field and choose your payment proof.");
 if(file.size>MAX_FILE)return setErr("File is larger than 5 MB.");
 setErr("");setBusy(true);
 try{const path=await upload("payment-proofs",uid,file);
  const{error}=await sb.from("abstracts").update({fee_tx_date:new Date(f.txd).toISOString(),fee_account_name:f.acct.trim(),fee_amount:ABS_FEE,fee_tx_id:f.tid.trim(),fee_proof_path:path}).eq("id",a.id);
  if(error)throw error;setF({});setFile(null);await load()}
 catch(e){setErr(/row-level security|policy/i.test((e&&e.message)||"")?"Payment can only be submitted for an accepted abstract.":(e&&e.message)||"Upload failed. Try again.")}
 setBusy(false)};

const wrap=c=>h`<div class="auth" style="max-width:620px"><h2>Abstract fee payment</h2>${c}</div>`;
if(session===undefined||(session&&a===undefined))return h`<div class="w sec"><p class="mut">Loading...</p></div>`;
if(!session)return wrap(h`<p class="sub">Log in with the account you used to submit your abstract to open this payment page.</p><div class="panel"><button class="btn block" onClick=${toLogin}>Log in</button></div>`);
if(!a)return wrap(h`<p class="sub">We could not find this abstract under your account. Make sure you are logged in with the account that submitted it, and that the link is exactly as it was sent to you.</p><div class="panel"><button class="btn o block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div>`);
if(a.user_id!==uid)return wrap(h`<p class="sub">This payment page belongs to another account.</p><div class="panel"><button class="btn o block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div>`);

const head=h`<div class="item" style="margin-bottom:16px"><p class="ab-lbl" style="margin:0 0 4px">${absRef(a.ref_no)}</p><b>${a.title}</b><div class="meta">${a.discipline}, ${a.category}</div></div>`;
const st=a.status;
if(st!=="Accepted")return wrap(h`${head}<p class="sub">${st==="Rejected"?"This abstract was not accepted, so no payment is needed.":"Your abstract is still being reviewed. Payment opens only if your abstract is selected, and you will be sent this link then."}</p><div class="panel"><button class="btn o block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div>`);

if(a.fee_status==="Approved")return wrap(h`${head}<div class="ok" role="status">Payment of PKR ${a.fee_amount||ABS_FEE} confirmed. Thank you, your abstract is fully registered.</div><div class="panel"><button class="btn block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div>`);
if(a.fee_status==="Pending")return wrap(h`${head}<div class="ok" role="status">Payment proof received. The team is verifying it.</div><dl class="kv"><dt>Amount</dt><dd>PKR ${a.fee_amount||ABS_FEE}</dd><dt>Transaction ID</dt><dd>${a.fee_tx_id}</dd><dt>Status</dt><dd><span class="badge Pending">Pending</span></dd></dl><div class="panel"><button class="btn o block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div>`);

if(!a.fee_link_at)return wrap(h`${head}<p class="sub">Your abstract is accepted. Payment is not open yet. The organizing team will send you the payment link shortly.</p><div class="panel"><button class="btn o block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div>`);
const rej=a.fee_status==="Rejected";
return wrap(h`${head}<p class="sub">Congratulations, your abstract has been accepted. A fee of <b>PKR ${ABS_FEE}</b> covers printing and setup of your ${a.category.toLowerCase()} presentation.</p>
${rej&&h`<div class="err" role="alert">Your last payment proof was rejected. Please send the fee again and upload a new proof.</div>`}
<div class="pf-sec"><p class="ab-lbl">Send PKR ${ABS_FEE} to</p><div class="pf-grid">${ACCTS.map(([b,n,o])=>h`<div class="pf-card acct" key=${n}><span class="ab-ico sm"><${Ic} n="phone"/></span><div class="pf-body"><p class="ab-lbl">${b}</p><p class="ab-val pf-num">${n}</p><p class="ab-txt">${o}</p></div><button type="button" class="btn o s" onClick=${()=>copy(n,n)}>${cpy===n?"Copied ✓":"Copy"}</button></div>`)}</div><p class="mut" style="font-size:.9rem;margin:10px 0 0">Pay the fee, then enter the transfer details below.</p></div>
<div class="panel"><label>Transaction date & time<input type="datetime-local" value=${f.txd||""} onInput=${set("txd")}/></label><label>Account name<input type="text" value=${f.acct||""} onInput=${set("acct")}/></label><label>Transaction ID<input type="text" value=${f.tid||""} onInput=${set("tid")}/></label>
<label>Payment proof (image or PDF, max 5 MB)<input type="file" accept="image/*,.pdf" onChange=${e=>setFile(e.target.files[0]||null)}/></label>
${err&&h`<div class="err" role="alert">${err}</div>`}<button class="btn block" disabled=${busy} onClick=${pay}>${busy?"Uploading...":"Submit payment"}</button></div>`)}
