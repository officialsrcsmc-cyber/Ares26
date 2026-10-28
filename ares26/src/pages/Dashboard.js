import {useState,useEffect,h,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

export default function Dashboard(P){
const{session,profile,abs,go,logout,refresh}=P;
const[f,setF]=useState({}),[file,setFile]=useState(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
if(session===undefined||(session&&profile===undefined))return h`<div class="w sec"><p class="mut">Loading...</p></div>`;
if(!session)return h`<div class="w sec"><h2>Dashboard</h2><p class="mut">Log in to see your registration and abstracts.</p><button class="btn" onClick=${()=>go("login")}>Log in</button></div>`;
if(!profile)return h`<div class="w sec"><h2>Dashboard</h2><p class="mut">We could not load your registration. Try refreshing the page, or log out and back in.</p><button class="btn o" onClick=${logout}>Log out</button></div>`;
const set=k=>e=>setF({...f,[k]:e.target.value});
const I=(l,k,t="text")=>h`<label>${l}<input type=${t} value=${f[k]||""} onInput=${set(k)}/></label>`;
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
return h`<div class="w sec"><div style="display:flex;justify-content:space-between"><h2>Hello, ${profile.first_name}</h2><button class="btn o s" onClick=${logout}>Log out</button></div>
<div class="card k"><b>${profile.first_name} ${profile.last_name}</b> <span class="mut">· ${profile.email}</span><p class="mut" style="margin:6px 0">${profile.smc?"SMC student":"External participant"} · ${profile.institution}, ${profile.programme} (year ${profile.degree_year})</p>Registration: <span class=${"badge "+profile.status}>${profile.status}</span></div>
${needPay?h`<div style="margin-top:28px"><h3>${profile.status==="Rejected"?"Payment rejected: upload a new proof":"Complete your registration: payment"}</h3>
<div class="card k" style="margin-bottom:14px"><b>Payment instructions</b><p class="mut" style="margin:6px 0 0">${BANK} Pay the fee, then enter the transfer details below.</p></div>
${I("Transaction date & time","txd","datetime-local")}${I("Account name","acct")}${I("Amount (PKR)","amt","number")}${I("Transaction ID","tid")}
<label>Payment proof (image or PDF, max 5 MB)<input type="file" accept="image/*,.pdf" onChange=${e=>setFile(e.target.files[0]||null)}/></label>
${err&&h`<div class="err">${err}</div>`}<button class="btn" disabled=${busy} onClick=${pay}>${busy?"Uploading...":"Submit payment"}</button></div>`
:h`<div style="margin-top:28px"><h3>Payment</h3><div class="card"><div class="mut" style="font-size:.9rem">PKR ${profile.amount} · Transaction ID ${profile.tx_id}<br/>Proof received. ${profile.status==="Pending"?"The team is verifying it.":""}</div></div></div>`}
<h3 style="margin-top:28px">My workshops</h3><p class="mut">No workshops yet. Enrolment opens when the schedule is announced.</p>
<h3 style="margin-top:28px">My abstracts</h3>${abs.length?abs.map(a=>h`<div class="card" key=${a.id} style="margin-bottom:10px"><b>${a.title}</b><div class="mut" style="font-size:.85rem">${a.discipline} · ${a.category}</div><span class=${"badge "+a.status.replace(/ /g,"")}>${a.status}</span></div>`):h`<p class="mut">You have not submitted an abstract.</p>`}
<button class="btn" onClick=${()=>go("abstracts")}>New abstract</button></div>`}
