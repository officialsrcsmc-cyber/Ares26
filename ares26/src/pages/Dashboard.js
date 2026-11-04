import {useState,useEffect,h,num,LOGO,BANK,FEES,ACCTS,Ic,ambFind,DISC,SECT,left,wkDate} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

export default function Dashboard(P){
const{session,profile,abs,go,logout,refresh,ct,enr}=P;
const[f,setF]=useState({}),[file,setFile]=useState(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[cv,setCv]=useState(null),[cbusy,setCbusy]=useState(false),[cpy,setCpy]=useState("");
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
const code=(f.amb||"").trim().toUpperCase();
const checkCode=()=>{if(!code)return false;const ok=!!ambFind(code);setCv(ok);return ok};
const copy=async(k,v)=>{try{await navigator.clipboard.writeText(v);setCpy(k);setTimeout(()=>setCpy(""),1800)}catch(e){}};
const pay=async()=>{
 if(!f.txd||!f.acct||!f.amt||!f.tid||!file)return setErr("Fill in every field and choose your payment proof.");
 if(file.size>MAX_FILE)return setErr("File is larger than 5 MB.");
 if(code){const ok=cv===true?true:checkCode();if(!ok)return setErr("This ambassador code was not recognised. Check it or clear the field.")}
 setErr("");setBusy(true);
 try{const path=await upload("payment-proofs",profile.id,file);
  const row={tx_date:new Date(f.txd).toISOString(),account_name:f.acct.trim(),amount:Number(f.amt),tx_id:f.tid.trim(),proof_path:path};if(code)row.ambassador_code=code;
  const{error}=await sb.from("profiles").update(row).eq("id",profile.id);
  if(error)throw error;setF({});setFile(null);setCv(null);await refresh()}
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
<div class="pf-sec"><p class="ab-lbl">Registration fee</p><div class="pf-grid">${FEES.map(([l,v,k])=>h`<div class=${"pf-card"+(k==="amb"?" dk":"")+((k==="smc"&&profile.smc)||(k==="non"&&!profile.smc)?" me":"")} key=${k}><span class="ab-ico sm"><${Ic} n=${k==="amb"?"heart":k==="pg"?"user":"users"}/></span><div><p class="ab-lbl">${l}</p><p class="ab-val">PKR ${v.toLocaleString("en-US")}</p>${((k==="smc"&&profile.smc)||(k==="non"&&!profile.smc))&&h`<span class="ab-pill">Your category</span>`}</div></div>`)}</div></div>
<div class="pf-sec"><p class="ab-lbl">Send payment to</p><div class="pf-grid">${ACCTS.map(([b,n,o])=>h`<div class="pf-card acct" key=${b}><span class="ab-ico sm"><${Ic} n="phone"/></span><div class="pf-body"><p class="ab-lbl">${b}</p><p class="ab-val pf-num">${n}</p><p class="ab-txt">${o}</p></div><button type="button" class="btn o s" onClick=${()=>copy(b,n)}>${cpy===b?"Copied ✓":"Copy"}</button></div>`)}</div><p class="mut" style="font-size:.9rem;margin:10px 0 0">Pay the fee, then enter the transfer details below.</p></div>
<div class="panel">${I("Transaction date & time","txd","datetime-local")}${I("Account name","acct")}<label>Amount (PKR)<input type="text" inputMode="decimal" autoComplete="off" value=${f.amt||""} onInput=${e=>{e.target.value=num(e.target.value);set("amt")(e)}}/></label>${I("Transaction ID","tid")}
<label>Ambassador Code (optional)<div class="amb-in"><input value=${f.amb||""} placeholder="Enter code if you have one" autoComplete="off" onInput=${e=>{set("amb")(e);setCv(null)}}/>${code&&h`<button type="button" class="btn o s" disabled=${cbusy} onClick=${checkCode}>${cbusy?"Checking...":"Verify"}</button>`}${cv===true&&h`<span class="amb-ok" role="status" aria-label="Code valid">✓</span>`}</div>${cv===true&&h`<span class="amb-msg ok">Valid code. The ambassador fee of PKR 800 applies.</span>`}${cv===false&&h`<span class="amb-msg bad">Code not recognised.</span>`}</label>
<label>Payment proof (image or PDF, max 5 MB)<input type="file" accept="image/*,.pdf" onChange=${e=>setFile(e.target.files[0]||null)}/></label>
${err&&h`<div class="err" role="alert">${err}</div>`}<button class="btn block" disabled=${busy} onClick=${pay}>${busy?"Uploading...":"Submit payment"}</button></div></section>`
:h`<section class="dsec"><h3>Payment</h3><div class="item"><dl class="kv"><dt>Amount</dt><dd>PKR ${profile.amount}</dd><dt>Transaction ID</dt><dd>${profile.tx_id}</dd><dt>Status</dt><dd><span class=${"badge "+profile.status}>${profile.status}</span></dd></dl>${profile.status==="Pending"?h`<p class="mut" style="margin:10px 0 0;font-size:.9rem">Proof received. The team is verifying it.</p>`:""}</div></section>`}
<section class="dsec"><h3>My workshops</h3>${(enr||[]).length?(enr||[]).map(e=>{
 const w=(ct.workshops||[]).find(x=>x.id===e.workshop_id)||{},ok=e.status==="Approved",no=e.status==="Rejected",
 tno=String(e.id).replace(/-/g,"").slice(0,8).toUpperCase(),
 date=wkDate(w.date)||"To be announced",time=w.time||"To be announced",venue=w.venue||"Sargodha Medical College";
 return h`<article class=${"tkt "+e.status} key=${e.id} aria-label=${"Workshop ticket: "+(w.title||e.workshop_title)}>
<div class="tkt-main"><p class="tkt-eye"><span>ARES’26</span><i aria-hidden="true"></i><span>Workshop ticket</span></p>
<h4 class="tkt-title">${w.title||e.workshop_title||"Workshop"}</h4>
<dl class="tkt-meta"><div><dt>Date</dt><dd>${date}</dd></div><div><dt>Time</dt><dd>${time}</dd></div><div class="wide"><dt>Venue</dt><dd>${venue}</dd></div></dl>
<p class="tkt-who"><span>Delegate</span>${profile.first_name} ${profile.last_name}</p></div>
<div class="tkt-stub"><span class=${"tkt-chip "+e.status}>${ok?"Confirmed":no?"Not approved":"Awaiting approval"}</span>
<div><p class="tkt-lbl">Ticket no.</p><p class="tkt-no">${tno}</p></div>
${ok?h`<span class="tkt-bars" aria-hidden="true"></span><p class="tkt-note">Admit one. Show at the workshop desk.</p>`:h`<p class="tkt-note">${no?"Contact the organizing team if you think this is a mistake.":"The team will confirm your seat soon."}</p>`}</div></article>`}):h`<p class="empty">${profile.status==="Approved"?"You have not enrolled in a workshop yet. Pick one to request your ticket.":"Workshop enrolment opens once your registration is approved."}</p>`}
<button class="btn o" onClick=${()=>go("workshops")}>${(enr||[]).length?"Browse workshops":"See workshops"}</button></section>
<section class="dsec"><h3>Abstract acceptance status</h3>${abs.length?abs.map(a=>{const st=a.status,steps=["Submitted","Under Review",st==="Rejected"?"Rejected":"Accepted"],at=steps.indexOf(st),
 msg=st==="Accepted"?"Congratulations! Your abstract has been accepted for "+a.category.toLowerCase()+" presentation. Further instructions will be shared with you.":st==="Rejected"?"Unfortunately your abstract was not accepted this time. Thank you for submitting, and we hope to see you at ARES’26.":st==="Under Review"?"Your abstract is being reviewed by the scientific committee.":"We received your abstract. It will be reviewed soon.";
 return h`<div class=${"item astat "+st.replace(/ /g,"")} key=${a.id}><b>${a.title}</b><div class="meta">${a.discipline}, ${a.category}</div>
<ol class="trk" aria-label="Abstract progress">${steps.map((x,i)=>h`<li key=${x} class=${(i<at||(i==at&&st!=="Submitted"&&st!=="Under Review")?"done ":"")+(i==at?"cur":"")}><i aria-hidden="true">${i<at||(i==at&&(st==="Accepted"||st==="Rejected"))?(st==="Rejected"&&i==at?"✕":"✓"):i+1}</i><span>${x}</span></li>`)}</ol>
<p class="amsg" role="status">${msg}</p></div>`}):h`<p class="empty">You have not submitted an abstract yet. Submit one to see its acceptance status here.</p>`}
<button class="btn" onClick=${()=>go("abstracts")}>New abstract</button></section></div>`}
