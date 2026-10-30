import {useState,h,num,LOGO,LOGO_SIZE,BANK,Spin,useSubmit,friendly,withTimeout,focusFirstError,Inp,track,PageSkel,OKTYPES,THANKS_KEY} from '../shared.js';
import {sb,upload,MAX_FILE} from '../supabase.js';

export default function Dashboard(P){
const{session,profile,abs,go,logout,refresh,ct}=P;
const[f,setF]=useState({}),[file,setFile]=useState(null),[fe,setFe]=useState({}),[err,setErr]=useState(""),[busy,run]=useSubmit();
if(session===undefined||(session&&profile===undefined))return h`<${PageSkel} narrow=${true}/>`;
if(!session)return h`<div class="auth"><h1 style="font-size:1.7rem">Dashboard</h1><p class="sub">Log in to see your registration and abstracts.</p><div class="panel"><button class="btn block" onClick=${()=>go("login")}>Log in</button></div></div>`;
if(!profile)return h`<div class="auth"><h1 style="font-size:1.7rem">Dashboard</h1><p class="sub">We could not load your registration. Try refreshing the page, or log out and back in.</p><div class="panel"><button class="btn o block" onClick=${logout}>Log out</button></div></div>`;
const set=k=>e=>setF({...f,[k]:e.target.value});
const I=(l,k,t="text",x={})=>h`<${Inp} l=${l} k=${k} t=${t} f=${f} set=${set} fe=${fe} ...${x}/>`;
const ev=(ct.dates||[]).slice(-1)[0]||["Nov 21","ARES’26 main event","2026-11-21"];
const evDate=new Date(ev[2]+"T00:00:00");
const evText=isNaN(evDate)?ev[0]:evDate.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
const days=isNaN(evDate)?null:Math.ceil((evDate-new Date())/864e5);
const cd=days===null?"":days>1?days+" days to go":days==1?"Tomorrow":days==0?"Today":"Event has passed";
const regLabel=profile.status==="Approved"?"Registered":profile.status==="Rejected"?"Payment rejected":profile.proof_path?"Payment under verification":"Payment required";
const a0=abs[0];
const absChip=a0?(a0.status==="Accepted"?a0.category+" presenter":"Abstract "+a0.status.toLowerCase()):"";
const ref=String(profile.id).replace(/-/g,"").slice(0,6).toUpperCase();
const needPay=!profile.proof_path||profile.status==="Rejected";
const pickProof=e=>{const x=e.target.files[0];setFe(v=>({...v,file:undefined}));
 if(!x){setFile(null);return}
 if(x.size>MAX_FILE){setFe(v=>({...v,file:"File is larger than 5 MB."}));e.target.value="";setFile(null);return}
 if(x.type&&!OKTYPES.includes(x.type)){setFe(v=>({...v,file:"Use a JPG, PNG, WebP or PDF."}));e.target.value="";setFile(null);return}
 setFile(x)};
const pay=ev=>{ev.preventDefault();const x={};
 if(!f.txd)x.txd="Enter the transaction date and time.";else if(new Date(f.txd)>new Date())x.txd="The transaction date can’t be in the future.";
 if(!(f.acct||"").trim())x.acct="Enter the account name.";
 if(!f.amt)x.amt="Enter the amount.";else if(!(Number(f.amt)>0)||!isFinite(Number(f.amt)))x.amt="Enter an amount greater than zero.";
 if(!(f.tid||"").trim())x.tid="Enter the transaction ID.";
 if(!file)x.file="Choose your payment proof.";else if(fe.file)x.file=fe.file;
 setFe(x);setErr(Object.keys(x).length?"Please fix the highlighted fields.":"");if(Object.keys(x).length){focusFirstError();return}
 return run(async()=>{try{
  const path=await withTimeout(upload("payment-proofs",profile.id,file),90000);
  const{error}=await withTimeout(sb.from("profiles").update({tx_date:new Date(f.txd).toISOString(),account_name:f.acct.trim(),amount:Number(f.amt),tx_id:f.tid.trim(),proof_path:path}).eq("id",profile.id),30000);
  if(error)throw error;
  track("payment_submitted");
  try{sessionStorage.setItem(THANKS_KEY,"payment")}catch(e){}
  setF({});setFe({});setFile(null);refresh();go("thanks")}catch(e){setErr(friendly(e,"Upload failed. Try again."))}})};
return h`<div class="dash">
<div class="dtop"><h1 style="font-size:1.7rem;margin:0">Dashboard</h1><button class="btn o s" onClick=${logout}>Log out</button></div>
<section class="pass" aria-label="Delegate pass">
<div class="pass-top"><div class="lg"><img src=${LOGO} alt="" width=${LOGO_SIZE} height=${LOGO_SIZE} decoding="async"/></div>
<p class="lbl">Delegate pass</p><h2 class="nm">${profile.first_name} ${profile.last_name}</h2>
<p class="inst">${profile.institution}${profile.programme?" — "+profile.programme:""}</p>
<div class="chips"><span class=${"chip "+profile.status}>${regLabel}</span>${absChip&&h`<span class="chip">${absChip}</span>`}</div></div>
<div class="pass-bot"><p class="when">${evText}</p><p class="where">Sargodha Medical College, Sargodha</p>
<p class="ref">Registration ID</p><p class="refn">${ref}</p>
<p class="hint">${profile.status==="Approved"?h`Show this pass at the <b>registration desk</b> when you arrive.`:profile.status==="Rejected"?h`Upload a new payment proof below to get your pass.`:profile.proof_path?h`The team is verifying your payment. Your pass is confirmed once it is approved.`:h`Submit your payment details below to confirm your pass.`}</p>
${cd&&h`<div class="cd"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${cd}</div>`}</div>
</section>
${needPay?h`<section class="dsec"><h3>${profile.status==="Rejected"?"Payment rejected: upload a new proof":"Complete your registration: payment"}</h3>
<div class="item"><b>Payment instructions</b><p class="mut" style="margin:6px 0 0">${BANK} Pay the fee, then enter the transfer details below.</p></div>
<form class="panel" noValidate onSubmit=${pay}>${I("Transaction date & time","txd","datetime-local")}${I("Account name","acct")}${I("Amount (PKR)","amt","text",{clean:num,inputMode:"decimal",autoComplete:"off"})}${I("Transaction ID","tid")}
<label>Payment proof (image or PDF, max 5 MB)<span class="rq" aria-hidden="true"> *</span><input type="file" accept="image/*,.pdf" onChange=${pickProof} aria-required="true" aria-invalid=${fe.file?"true":"false"} aria-describedby=${fe.file?"e-file":undefined}/>${fe.file&&h`<span class="fe" id="e-file" role="alert">${fe.file}</span>`}</label>
${err&&h`<div class="err" role="alert" tabIndex="-1">${err}</div>`}<button type="submit" class="btn block" disabled=${busy} aria-busy=${busy}>${busy&&h`<${Spin}/>`}${busy?"Uploading…":"Submit payment"}</button></form></section>`
:h`<section class="dsec"><h3>Payment</h3><div class="item"><dl class="kv"><dt>Amount</dt><dd>PKR ${profile.amount}</dd><dt>Transaction ID</dt><dd>${profile.tx_id}</dd><dt>Status</dt><dd><span class=${"badge "+profile.status}>${profile.status}</span></dd></dl>${profile.status==="Pending"?h`<p class="mut" style="margin:10px 0 0;font-size:.9rem">Proof received. The team is verifying it.</p>`:""}</div></section>`}
<section class="dsec"><h3>My workshops</h3><p class="empty">No workshops yet. Enrolment opens when the schedule is announced.</p></section>
<section class="dsec"><h3>My abstracts</h3>${abs.length?abs.map(a=>h`<div class="item" key=${a.id}><b>${a.title}</b><div class="meta">${a.discipline}, ${a.category}</div><span class=${"badge "+a.status.replace(/ /g,"")}>${a.status}</span></div>`):h`<p class="empty">You have not submitted an abstract.</p>`}
<button class="btn" onClick=${()=>go("abstracts")}>New abstract</button></section></div>`}
