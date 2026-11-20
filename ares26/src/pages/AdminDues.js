import {useState,h,absRef} from '../shared.js';
import {sb} from '../supabase.js';

// Admin > Registrations: email people who submitted an abstract but have not paid the conference registration fee.
// Owes = registration not Approved AND (no proof uploaded OR proof Rejected). Pending proofs are not chased.
// Authors whose abstracts were all Rejected are not emailed.
export default function AdminDues({regs,abss,setRegs,flash}){
const[mailing,setMailing]=useState(false),[inc,setInc]=useState(false),[show,setShow]=useState(false);
const owes=r=>r.status!=="Approved"&&(!r.proof_path||r.status==="Rejected");
const absOf=r=>abss.filter(a=>a.user_id===r.id&&a.status!=="Rejected");
const due=regs.filter(r=>owes(r)&&absOf(r).length&&r.email);
const todo=due.filter(r=>inc||!r.dues_email_sent_at);
const sentN=due.filter(r=>r.dues_email_sent_at).length;
const when=d=>new Date(d).toLocaleString("en-GB");
const send=async(opts,done)=>{setMailing(true);
 const{data,error}=await sb.functions.invoke("send-dues-emails",{body:{baseUrl:location.origin+import.meta.env.BASE_URL,...opts}});
 setMailing(false);
 if(error){let m=error.message;try{const j=error.context&&await error.context.json();if(j&&j.error)m=j.error}catch(e){}
  return window.alert("Email not sent.\n\n"+m+(/not found|404|Failed to send a request/i.test(m)?"\n\nHas the send-dues-emails function been deployed? See README.":""))}
 if(data&&data.test)return flash("Test email sent to "+data.to);
 if(data&&data.updated&&data.updated.length){const m={};data.updated.forEach(u=>{m[u.id]=u});setRegs(prev=>prev.map(r=>m[r.id]?{...r,dues_email_sent_at:m[r.id].dues_email_sent_at,dues_email_count:m[r.id].dues_email_count}:r))}
 const bad=(data&&data.failed)||[],skip=(data&&data.skipped)||[];
 if(bad.length||skip.length)window.alert("Sent "+data.sent+" reminder"+(data.sent==1?"":"s")+".\n"+(bad.length?"\nFAILED:\n"+bad.map(x=>x.email+": "+x.error).join("\n"):"")+(skip.length?"\nSKIPPED:\n"+skip.map(x=>x.email+": "+x.reason).join("\n"):""));
 else flash(data&&data.sent?done||("Sent "+data.sent+" reminder"+(data.sent==1?"":"s")):"Nothing to send.")};
const sendAll=()=>{if(!todo.length)return;
 if(!window.confirm("Email a payment reminder to "+todo.length+" "+(todo.length==1?"person":"people")+" who submitted an abstract but have not paid their conference registration?"))return;
 send({ids:todo.map(r=>r.id),resend:inc})};
const sendOne=r=>{if(r.dues_email_sent_at&&!window.confirm((r.first_name||"")+" was already reminded on "+when(r.dues_email_sent_at)+". Send again?"))return;
 send({ids:[r.id],resend:true},"Reminder sent to "+r.email)};
return h`<div class="card" style="margin-bottom:14px"><b>Email registration payment reminders</b>
<p class="mut" style="font-size:.88rem;margin:6px 0 10px">Emails everyone who has <b>submitted an abstract but has not paid</b> the conference registration fee (no payment proof uploaded, or the proof was rejected), asking them to pay from their dashboard. People whose proof is already uploaded and waiting for review, and authors whose abstracts were all rejected, are not emailed.</p>
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn" disabled=${!todo.length||mailing} onClick=${sendAll}>${mailing?"Sending...":"Email "+todo.length+" "+(todo.length==1?"person":"people")}</button><button class="btn o s" disabled=${mailing} onClick=${()=>send({test:true})}>Send test to me</button>
<label style="display:flex;gap:6px;align-items:center;margin:0;cursor:pointer;font-size:.88rem"><input type="checkbox" style="width:auto;margin:0" checked=${inc} onChange=${e=>setInc(e.target.checked)}/>Include already reminded</label>
<button class="btn o s" onClick=${()=>setShow(!show)}>${show?"Hide list":"Show list ("+due.length+")"}</button></div>
<p class="mut" style="font-size:.85rem;margin:10px 0 0">Owing and with an abstract: <b>${due.length}</b> · already reminded: <b>${sentN}</b>.</p>
${show&&h`<div style="margin-top:10px">${due.map(r=>h`<div key=${r.id} style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 0;border-top:1px solid #0001;font-size:.88rem"><div><b>${r.first_name} ${r.last_name}</b> <span class="mut">${r.email}</span><br/><span class="mut">${absOf(r).map(a=>a.ref_no?absRef(a.ref_no):a.title).join(", ")} · ${r.status==="Rejected"?"payment rejected":"no payment yet"}${r.dues_email_sent_at?" · reminded "+when(r.dues_email_sent_at)+(r.dues_email_count>1?" (x"+r.dues_email_count+")":""):""}</span></div><button class="btn o s" disabled=${mailing} onClick=${()=>sendOne(r)}>${r.dues_email_sent_at?"Resend":"Send"}</button></div>`)}${!due.length&&h`<p class="mut">Nobody owes a registration fee with a submitted abstract.</p>`}</div>`}</div>`}
