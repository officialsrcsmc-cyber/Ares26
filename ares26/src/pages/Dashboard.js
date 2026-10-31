import {useState,useEffect,h,num,LOGO,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

export default function Dashboard(P){
const{session,profile,abs,go,logout,refresh,ct}=P;
const[f,setF]=useState({}),[file,setFile]=useState(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
if(session===undefined||(session&&profile===undefined))return h`<div class="dash"><p class="mut">Loading...</p></div>`;
if(!session)return h`<div class="auth"><h2>Dashboard</h2><p class="sub">Log in to see your registration and abstracts.</p><div class="panel"><button class="btn block" onClick=${()=>go("login")}>Log in</button></div></div>`;
if(!profile)return h`<div class="auth"><h2>Dashboard</h2><p class="sub">We could not load your registration. Try refreshing the page, or log out and back in.</p><div class="panel"><button class="btn o block" onClick=${logout}>Log out</button></div></div>`;
const set=k=>e=>setF({...f,[k]:e.target.value});
const I=(l,k,t="text")=>h`<label>${l}<input type=${t} value=${f[k]||""} onInput=${set(k)}/></label>`;
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
const pay=async()=>{
 if(!f.txd||!f.acct||!f.amt||!f.tid||!file)return setErr("Fill in every field and choose your payment proof.");
 if(file.size>MAX_FILE)return setErr("File is larger than 5 MB.");
 setErr("");setBusy(true);
 try{const path=await upload("payment-proofs",profile.id,file);
  const{error}=await sb.from("profiles").update({tx_date:new Date(f.txd).toISOString(),account_name:f.acct.trim(),amount:Number(f.amt),tx_id:f.tid.trim(),proof_path:path}).eq("id",profile.id);
  if(error)throw error;setF({});setFile(null);await refresh()}
 catch(e){setErr(e.message||"Upload failed. Try again.")}
 setBusy(false)};
return h`<div class="dash">
<div class="dtop"><h2>Dashboard</h2><button class="btn o s" onClick=${logout}>Log out</button></div>
<section class="pass" aria-label="Delegate pass">
<div class="pass-top"><div class="lg"><img src=${LOGO} alt="ARES’26"/></div>
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
<div class="panel">${I("Transaction date & time","txd","datetime-local")}${I("Account name","acct")}<label>Amount (PKR)<input type="text" inputMode="decimal" autoComplete="off" value=${f.amt||""} onInput=${e=>{e.target.value=num(e.target.value);set("amt")(e)}}/></label>${I("Transaction ID","tid")}
<label>Payment proof (image or PDF, max 5 MB)<input type="file" accept="image/*,.pdf" onChange=${e=>setFile(e.target.files[0]||null)}/></label>
${err&&h`<div class="err" role="alert">${err}</div>`}<button class="btn block" disabled=${busy} onClick=${pay}>${busy?"Uploading...":"Submit payment"}</button></div></section>`
:h`<section class="dsec"><h3>Payment</h3><div class="item"><dl class="kv"><dt>Amount</dt><dd>PKR ${profile.amount}</dd><dt>Transaction ID</dt><dd>${profile.tx_id}</dd><dt>Status</dt><dd><span class=${"badge "+profile.status}>${profile.status}</span></dd></dl>${profile.status==="Pending"?h`<p class="mut" style="margin:10px 0 0;font-size:.9rem">Proof received. The team is verifying it.</p>`:""}</div></section>`}
<section class="dsec"><h3>My workshops</h3><p class="empty">No workshops yet. Enrolment opens when the schedule is announced.</p></section>
<section class="dsec"><h3>Abstract acceptance status</h3>${abs.length?abs.map(a=>{const st=a.status,steps=["Submitted","Under Review",st==="Rejected"?"Rejected":"Accepted"],at=steps.indexOf(st),
 msg=st==="Accepted"?"Congratulations! Your abstract has been accepted for "+a.category.toLowerCase()+" presentation. Further instructions will be shared with you.":st==="Rejected"?"Unfortunately your abstract was not accepted this time. Thank you for submitting, and we hope to see you at ARES’26.":st==="Under Review"?"Your abstract is being reviewed by the scientific committee.":"We received your abstract. It will be reviewed soon.";
 return h`<div class=${"item astat "+st.replace(/ /g,"")} key=${a.id}><b>${a.title}</b><div class="meta">${a.discipline}, ${a.category}</div>
<ol class="trk" aria-label="Abstract progress">${steps.map((x,i)=>h`<li key=${x} class=${(i<at||(i==at&&st!=="Submitted"&&st!=="Under Review")?"done ":"")+(i==at?"cur":"")}><i aria-hidden="true">${i<at||(i==at&&(st==="Accepted"||st==="Rejected"))?(st==="Rejected"&&i==at?"✕":"✓"):i+1}</i><span>${x}</span></li>`)}</ol>
<p class="amsg" role="status">${msg}</p></div>`}):h`<p class="empty">You have not submitted an abstract yet. Submit one to see its acceptance status here.</p>`}
<button class="btn" onClick=${()=>go("abstracts")}>New abstract</button></section></div>`}
