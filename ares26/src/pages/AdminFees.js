import {useState,h,waNum,ABS_FEE,absRef,absLink} from '../shared.js';
import {sb} from '../supabase.js';

const FILTERS=["All","No link yet","Awaiting payment","Proof to review","Approved","Rejected"];
const stage=a=>!a.fee_link_at?"No link yet":a.fee_status==="Pending"?"Proof to review":a.fee_status==="Approved"?"Approved":a.fee_status==="Rejected"?"Rejected":"Awaiting payment";
const cls=s=>s==="Approved"?"Accepted":s==="Rejected"?"Rejected":s==="Proof to review"?"Pending":"Submitted";
const msg=a=>"Congratulations! Your abstract ("+absRef(a.ref_no)+") has been accepted for ARES'26. Please pay the PKR "+ABS_FEE+" printing and setup fee and upload your receipt here: "+absLink(a.ref_no);

// Admin > Abstract fees: generate the private payment link for selected authors, then approve the fee
export default function AdminFees({abss,setAbss,flash,links,open}){
const[f,setFf]=useState("All"),[busy,setBusy]=useState(""),[q,setQ]=useState("");
const acc=abss.filter(a=>a.status==="Accepted");
const shown=acc.filter(a=>(f==="All"||stage(a)===f)&&(!q.trim()||(a.title+" "+absRef(a.ref_no)+" "+(a.profiles?a.profiles.first_name+" "+a.profiles.last_name+" "+a.profiles.email:"")).toLowerCase().includes(q.trim().toLowerCase())));
const n=s=>acc.filter(a=>stage(a)===s).length;

const patch=async(ids,row,okMsg)=>{setBusy(ids.join());
 const{error}=await sb.from("abstracts").update(row).in("id",ids);setBusy("");
 if(error)return flash(error.message);
 setAbss(abss.map(r=>ids.includes(r.id)?{...r,...row}:r));if(okMsg)flash(okMsg)};
const gen=a=>patch([a.id],{fee_link_at:new Date().toISOString()},"Payment link generated for "+absRef(a.ref_no));
const genAll=()=>{const ids=acc.filter(a=>!a.fee_link_at).map(a=>a.id);if(!ids.length)return;
 if(!window.confirm("Generate payment links for "+ids.length+" accepted abstract"+(ids.length>1?"s":"")+"?"))return;
 patch(ids,{fee_link_at:new Date().toISOString()},ids.length+" link"+(ids.length>1?"s":"")+" generated")};
const revoke=a=>{if(window.confirm("Close the payment link for "+absRef(a.ref_no)+"? The author will not be able to pay until you generate it again."))patch([a.id],{fee_link_at:null},"Link closed")};
const setFee=(a,v)=>patch([a.id],{fee_status:v},"Fee "+v.toLowerCase());
const copy=async a=>{try{await navigator.clipboard.writeText(absLink(a.ref_no));flash("Link copied: "+absRef(a.ref_no))}catch(e){flash(absLink(a.ref_no))}};
const wa=a=>{const x=a.profiles&&waNum(a.profiles.phone);return x?"https://wa.me/"+x+"?text="+encodeURIComponent(msg(a)):null};
const mail=a=>a.profiles&&a.profiles.email?"mailto:"+a.profiles.email+"?subject="+encodeURIComponent("ARES'26 abstract accepted: payment link")+"&body="+encodeURIComponent(msg(a)):null;

return h`<div><p class="mut">Only <b>Accepted</b> abstracts appear here. Generate a payment link to open the page for that author, send it to them, then approve their PKR ${ABS_FEE} fee once you have checked the proof. Until you generate the link, the page stays closed even if someone has the address.</p>
<div class="g c5" style="margin-bottom:14px">${[["Accepted",acc.length],["No link yet",n("No link yet")],["Awaiting payment",n("Awaiting payment")],["Proof to review",n("Proof to review")],["Approved",n("Approved")]].map(([l,v])=>h`<div class="card" key=${l}><b style="font-size:1.4rem">${v}</b><div class="mut" style="font-size:.85rem">${l}</div></div>`)}</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><input placeholder="Search title, name, email or ARES26-ABS-1001" value=${q} onInput=${e=>setQ(e.target.value)} style="flex:1;min-width:220px"/>
<select value=${f} onChange=${e=>setFf(e.target.value)} aria-label="Filter by stage">${FILTERS.map(x=>h`<option key=${x}>${x}</option>`)}</select>
<button class="btn s" disabled=${!n("No link yet")||!!busy} onClick=${genAll}>Generate all missing links (${n("No link yet")})</button></div>
${shown.map(a=>{const s=stage(a);return h`<div class="card" key=${a.id} style="margin-bottom:10px">
<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:flex-start"><div><b>${a.title}</b><div class="mut" style="font-size:.85rem">${absRef(a.ref_no)} · ${a.category}<br/>${a.profiles?a.profiles.first_name+" "+a.profiles.last_name+" · "+a.profiles.email:""}</div></div><span class=${"badge "+cls(s)}>${s}</span></div>
${a.fee_link_at?h`<p class="mut" style="font-size:.85rem;margin:10px 0 6px;word-break:break-all">${absLink(a.ref_no)}<br/>Generated ${new Date(a.fee_link_at).toLocaleString("en-GB")}</p>`:h`<p class="mut" style="font-size:.85rem;margin:10px 0 6px">No link generated yet.</p>`}
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
${!a.fee_link_at?h`<button class="btn s" disabled=${!!busy} onClick=${()=>gen(a)}>Generate link</button>`:h`<button class="btn o s" onClick=${()=>copy(a)}>Copy link</button>${wa(a)&&h`<a class="btn o s" href=${wa(a)} target="_blank" rel="noopener noreferrer">WhatsApp</a>`}${mail(a)&&h`<a class="btn o s" href=${mail(a)}>Email</a>`}${a.fee_status!=="Pending"&&a.fee_status!=="Approved"&&h`<button class="btn o s dng" disabled=${!!busy} onClick=${()=>revoke(a)}>Close link</button>`}`}</div>
${a.fee_proof_path&&h`<div style="margin-top:10px;padding-top:10px;border-top:1px solid #0001"><p style="margin:0 0 8px;font-size:.9rem">PKR ${a.fee_amount} · ID ${a.fee_tx_id} · ${a.fee_account_name}${a.fee_tx_date?" · "+new Date(a.fee_tx_date).toLocaleString("en-GB"):""}<br/>${links["f"+a.id]?h`<a href=${links["f"+a.id]} target="_blank" rel="noopener">Open fee proof</a>`:h`<a onClick=${()=>open("f"+a.id,"payment-proofs",a.fee_proof_path)}>View fee proof</a>`}</p>
<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn s" disabled=${a.fee_status==="Approved"||!!busy} onClick=${()=>setFee(a,"Approved")}>Approve fee</button><button class="btn o s dng" disabled=${a.fee_status==="Rejected"||!!busy} onClick=${()=>setFee(a,"Rejected")}>Reject fee</button></div></div>`}</div>`})}
${!shown.length&&h`<p class="mut">${acc.length?"No abstracts match this filter.":"No accepted abstracts yet. Accept an abstract in the Abstracts tab and it will appear here."}</p>`}</div>`}
