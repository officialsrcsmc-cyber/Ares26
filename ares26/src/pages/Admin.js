import {AMB,ambFind,waNum,waPretty,useState,useEffect,h,BANK,DISC,SECT,left,newWorkshop,wkDate,ABS_FEE,absRef,absLink} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';
import AdminFees from './AdminFees.js';

const clean=c=>{let v=String(c??"");if(/^[=@\t\r]/.test(v)||/^[+-](?![0-9])/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
const download=(name,rows)=>{const csv="\ufeff"+rows.map(r=>r.map(clean).join(",")).join("\r\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=name;document.body.appendChild(a);a.click();a.remove()};

export default function Admin(P){
const{session,profile,logout,ct,setC}=P;
const[em,setEm]=useState(""),[pw,setPw]=useState(""),[er,setEr]=useState(""),[tab,setT]=useState("reg"),
[regs,setRegs]=useState([]),[abss,setAbss]=useState([]),[links,setLinks]=useState({}),[draft,setDraft]=useState(ct),[msg,setMsg]=useState(""),[q,setQ]=useState(""),[sf,setSf]=useState("All"),[enrs,setEnrs]=useState([]),[wkf,setWkf]=useState("All");
const isAdmin=!!(profile&&profile.is_admin);

const load=async()=>{
 const a=await sb.from("profiles").select("*").order("created_at",{ascending:false});if(a.error)setMsg(a.error.message);else setRegs(a.data||[]);
 const b=await sb.from("abstracts").select("*, profiles(first_name,last_name,email,phone)").order("created_at",{ascending:false});if(b.error)setMsg(b.error.message);else setAbss(b.data||[]);
 const c=await sb.from("workshop_enrollments").select("*, profiles(first_name,last_name,email,phone,institution,programme,smc,uhs_id,status)").order("created_at",{ascending:false});if(c.error)setMsg(c.error.message);else setEnrs(c.data||[])};
useEffect(()=>{if(isAdmin)load()},[isAdmin]);
useEffect(()=>{setDraft(ct)},[ct]);

if(session===undefined||(session&&profile===undefined))return h`<div class="w sec"><p class="mut">Loading...</p></div>`;
if(!session)return h`<div class="auth"><h2>Admin sign in</h2><div class="panel"><label>Email<input type="email" value=${em} onInput=${e=>setEm(e.target.value)}/></label><label>Password<input type="password" value=${pw} onInput=${e=>setPw(e.target.value)}/></label>${er&&h`<div class="err" role="alert">${er}</div>`}
<button class="btn block" onClick=${async()=>{setEr("");const{error}=await sb.auth.signInWithPassword({email:em.trim(),password:pw});if(error)setEr("Email or password is incorrect.")}}>Sign in</button></div></div>`;
if(!isAdmin)return h`<div class="w sec" style="max-width:480px"><h2>Not authorized</h2><p class="mut">This account does not have admin access. Ask an existing admin to enable it.</p><button class="btn o" onClick=${logout}>Log out</button></div>`;

const flash=t=>{setMsg(t);setTimeout(()=>setMsg(""),4000)};
const setStatus=async(table,id,status)=>{const{error}=await sb.from(table).update({status}).eq("id",id);if(error)return flash(error.message);
 table==="profiles"?setRegs(regs.map(r=>r.id==id?{...r,status}:r)):setAbss(abss.map(r=>r.id==id?{...r,status}:r))};
const setEnrStatus=async(id,status)=>{const{error}=await sb.from("workshop_enrollments").update({status}).eq("id",id);if(error)return flash(error.message);setEnrs(enrs.map(r=>r.id==id?{...r,status}:r))};
const setAdmin=async(u,on)=>{const nm=(u.first_name||"")+" "+(u.last_name||"");
 if(!window.confirm((on?"Make ":"Remove admin access from ")+nm.trim()+(on?" an admin? They will be able to review payments, abstracts and manage people.":"?")))return;
 const{error}=await sb.rpc("set_admin",{target:u.id,make_admin:on});if(error)return flash(error.message);
 setRegs(regs.map(r=>r.id==u.id?{...r,is_admin:on}:r));flash(on?nm.trim()+" is now an admin.":"Admin access removed.")};
const removePerson=async u=>{const nm=((u.first_name||"")+" "+(u.last_name||"")).trim()||u.email;
 if(!window.confirm("Permanently remove "+nm+" ("+u.email+")?\n\nThis deletes their account, payment details and abstracts. It cannot be undone."))return;
 const files=[[ "payment-proofs",u.proof_path],...abss.filter(a=>a.user_id==u.id).map(a=>["abstract-files",a.file_path]),...enrs.filter(r=>r.user_id==u.id).map(r=>["payment-proofs",r.proof_path]),...abss.filter(a=>a.user_id==u.id).map(a=>["payment-proofs",a.fee_proof_path])].filter(f=>f[1]);
 for(const b of ["payment-proofs","abstract-files"]){const paths=files.filter(f=>f[0]==b).map(f=>f[1]);if(paths.length)await sb.storage.from(b).remove(paths)}
 const{error}=await sb.rpc("remove_user",{target:u.id});if(error)return flash(error.message);
 setRegs(regs.filter(r=>r.id!=u.id));setAbss(abss.filter(a=>a.user_id!=u.id));setEnrs(enrs.filter(r=>r.user_id!=u.id));flash(nm+" has been removed.")};
const open=async(key,bucket,path)=>{try{const u=await signed(bucket,path);setLinks(l=>({...l,[key]:u}))}catch(e){flash(e.message)}};
const ed=(key,i,j,v)=>setDraft({...draft,[key]:draft[key].map((r,x)=>x==i?r.map((c,y)=>y==j?v:c):r)});
const wks=draft.workshops||[];
const edWk=(i,field,v)=>setDraft({...draft,workshops:wks.map((w,x)=>x==i?{...w,[field]:v}:w)});
const addWk=()=>setDraft({...draft,workshops:[...wks,newWorkshop()]});
const delWk=i=>{const n=enrs.filter(r=>r.workshop_id===wks[i].id).length;if(!window.confirm("Remove this workshop?"+(n?"\n\n"+n+" enrolment request(s) exist for it. They stay in the Workshop approvals tab but the workshop will no longer be listed publicly.":"")))return;setDraft({...draft,workshops:wks.filter((_,x)=>x!=i)})};
const saveContent=async()=>{const{error}=await sb.from("site_content").upsert({id:1,data:draft});if(error)return flash(error.message);setC(draft);flash("Saved. The public site now shows these changes.")};
const Sel=(v,fn,o)=>h`<select value=${v} onChange=${e=>fn(e.target.value)} style="width:auto">${o.map(x=>h`<option key=${x}>${x}</option>`)}</select>`;
const day=d=>d?new Date(d).toLocaleString():"";
const cnt=(arr,s)=>arr.filter(x=>x.status===s).length;
const absShown=abss.filter(a=>sf==="All"||a.status===sf);
const shown=regs.filter(r=>(sf==="All"||r.status===sf)&&(!q||(r.first_name+" "+r.last_name+" "+r.email+" "+(r.tx_id||"")+" "+(r.uhs_id||"")+" "+(r.phone||"")).toLowerCase().includes(q.toLowerCase())));

const enrShown=enrs.filter(r=>(sf==="All"||r.status===sf)&&(wkf==="All"||r.workshop_id===wkf)&&(!q||(((r.profiles?r.profiles.first_name+" "+r.profiles.last_name+" "+r.profiles.email+" "+(r.profiles.uhs_id||""):"")+" "+r.workshop_title).toLowerCase().includes(q.toLowerCase()))));
const wkTitle=r=>((ct.workshops||[]).find(w=>w.id===r.workshop_id)||{}).title||r.workshop_title||"Workshop";
const exportEnr=()=>download("ares26-workshop-enrolments.csv",[["Requested at","Workshop","First name","Last name","Email","WhatsApp number","Institution","UHS/SMC ID","Transaction date","Account name","Amount (PKR)","Transaction ID","Proof uploaded","Registration status","Enrolment status"],...enrs.map(r=>{const p=r.profiles||{};return[r.created_at,wkTitle(r),p.first_name,p.last_name,p.email,waPretty(p.phone)||p.phone,p.institution,p.uhs_id||"",r.tx_date,r.account_name,r.amount,r.tx_id,r.proof_path?"Yes":"No",p.status,r.status]})]);
const exportRegs=()=>download("ares26-registrations.csv",[["Registered at","First name","Last name","Email","SMC student","WhatsApp number","Institution","Programme","Degree year","Transaction date","Account name","Amount (PKR)","Transaction ID","UHS/SMC ID","Ambassador code","Code valid","Proof uploaded","Status"],
 ...regs.map(r=>[r.created_at,r.first_name,r.last_name,r.email,r.smc?"Yes":"No",waPretty(r.phone)||r.phone,r.institution,r.programme,r.degree_year,r.tx_date,r.account_name,r.amount,r.tx_id,r.uhs_id||"",r.ambassador_code,r.ambassador_code?(ambFind(r.ambassador_code)?"Yes":"No"):"",r.proof_path?"Yes":"No",r.status])]);
const waList=regs.filter(r=>waNum(r.phone));
const exportWa=()=>download("ares26-whatsapp-list.csv",[["Name","WhatsApp number","WhatsApp number (digits only)"],...waList.map(r=>[((r.first_name||"")+" "+(r.last_name||"")).trim(),waPretty(r.phone),waNum(r.phone)])]);
const exportVcf=()=>{const v=waList.map(r=>{const n=((r.first_name||"")+" "+(r.last_name||"")).trim();return"BEGIN:VCARD\r\nVERSION:3.0\r\nFN:ARES26 "+n.replace(/[,;\r\n]/g," ")+"\r\nTEL;TYPE=CELL:+"+waNum(r.phone)+"\r\nEND:VCARD"}).join("\r\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([v],{type:"text/vcard;charset=utf-8"}));a.download="ares26-whatsapp-contacts.vcf";document.body.appendChild(a);a.click();a.remove()};
const exportAbs=()=>download("ares26-abstracts.csv",[["Submitted at","Author","Email","Title","Discipline","Category","Introduction","Methodology","Results","Conclusion","Authors","File uploaded","Status","Ref no","Fee status","Fee tx ID"],
 ...abss.map(a=>[a.created_at,a.profiles?a.profiles.first_name+" "+a.profiles.last_name:"",a.profiles?a.profiles.email:"",a.title,a.discipline,a.category,...SECT.map(s=>a.body[s]),(a.body.authors||[]).map(x=>x.name+(x.presenting?" [PRESENTING]":"")+(x.email?" <"+x.email+">":"")+" ("+x.affiliation+")").join("; "),a.file_path?"Yes":"No",a.status,absRef(a.ref_no),a.fee_status,a.fee_tx_id||""])]);

return h`<div class="w sec"><div style="display:flex;justify-content:space-between"><h2>Admin panel</h2><button class="btn o s" onClick=${logout}>Sign out</button></div>
${msg&&h`<div class="ok">${msg}</div>`}
<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">${[["reg","Registrations"],["abs","Abstracts"],["fee","Abstract fees"+(abss.filter(x=>x.status==="Accepted"&&x.fee_status==="Pending").length?" ("+abss.filter(x=>x.status==="Accepted"&&x.fee_status==="Pending").length+")":"")],["wk","Workshop approvals"+(cnt(enrs,"Pending")?" ("+cnt(enrs,"Pending")+")":"")],["amb","Ambassadors"],["ct","Content"],["csv","Export"]].map(([k,l])=>h`<button key=${k} class=${"btn s"+(tab==k?"":" o")} onClick=${()=>{setT(k);setSf("All");setQ("");setWkf("All")}}>${l}</button>`)}<button class="btn o s" onClick=${load}>Refresh</button></div>
<div class="g c5" style="margin-bottom:16px">${[["Registrations",regs.length],["Pending",cnt(regs,"Pending")],["Approved",cnt(regs,"Approved")],["Abstracts",abss.length],["Awaiting review",cnt(abss,"Submitted")+cnt(abss,"Under Review")],["Accepted",cnt(abss,"Accepted")],["Workshop requests",cnt(enrs,"Pending")+" pending"]].map(([l,n])=>h`<div class="card" key=${l} style="padding:12px"><b style="font-size:1.4rem">${n}</b><div class="mut" style="font-size:.8rem">${l}</div></div>`)}</div>
${(tab=="reg"||tab=="abs"||tab=="wk")&&h`<label style="max-width:240px">Filter by status<select value=${sf} onChange=${e=>setSf(e.target.value)}>${["All"].concat(tab!="abs"?["Pending","Approved","Rejected"]:["Submitted","Under Review","Accepted","Rejected"]).map(x=>h`<option key=${x}>${x}</option>`)}</select></label>`}
${tab=="reg"&&h`<div><input placeholder="Search name, email, UHS/SMC ID or transaction ID" value=${q} onInput=${e=>setQ(e.target.value)} style="margin-bottom:12px"/>
<div class="ov"><table><tr><th>Name</th><th>WhatsApp</th><th>UHS / SMC ID</th><th>Payment</th><th>Status</th><th>Manage</th></tr>${shown.map(u=>h`<tr key=${u.id}><td>${u.first_name} ${u.last_name}<br/><span class="mut">${u.email}</span><br/><span class="mut">${u.institution} · ${u.programme}</span></td>
<td>${u.phone?h`<b>${waPretty(u.phone)||u.phone}</b><br/><a href=${"https://wa.me/"+waNum(u.phone)} target="_blank" rel="noopener noreferrer">Open chat</a>`:h`<span class="mut">Not provided</span>`}</td>
<td>${u.uhs_id?h`<b>${u.uhs_id}</b>`:h`<span class="mut">${u.smc?"Not provided":"Non-SMC"}</span>`}</td>
<td>${u.proof_path?h`<span>PKR ${u.amount}<br/>ID ${u.tx_id}<br/>${u.account_name}<br/><span class="mut">${day(u.tx_date)}</span><br/>${u.ambassador_code&&h`<span>Code: <b>${u.ambassador_code}</b> ${ambFind(u.ambassador_code)?h`<span class="amb-tick" title="Matches an ambassador code">✓</span> <span class="mut">${ambFind(u.ambassador_code)[1]}</span>`:h`<span class="amb-x" title="No matching code">✕</span>`}</span><br/>`}${links["p"+u.id]?h`<a href=${links["p"+u.id]} target="_blank" rel="noopener">Open proof</a>`:h`<a onClick=${()=>open("p"+u.id,"payment-proofs",u.proof_path)}>View proof</a>`}</span>`:h`<span class="mut">No payment yet</span>`}</td>
<td>${Sel(u.status,v=>setStatus("profiles",u.id,v),["Pending","Approved","Rejected"])}</td>
<td>${u.is_admin&&h`<span class="badge Accepted" style="margin-bottom:6px">Admin</span><br/>`}${u.id===session.user.id?h`<span class="mut">You</span>`:h`<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn o s" onClick=${()=>setAdmin(u,!u.is_admin)}>${u.is_admin?"Remove admin":"Make admin"}</button>${!u.is_admin&&h`<button class="btn o s dng" onClick=${()=>removePerson(u)}>Remove</button>`}</div>`}</td></tr>`)}</table>${!shown.length&&h`<p class="mut">No registrations found.</p>`}</div></div>`}
${tab=="abs"&&h`<div>${absShown.map(a=>h`<div class="card" key=${a.id} style="margin-bottom:10px"><b>${a.title}</b><div class="mut" style="font-size:.85rem">${a.profiles?a.profiles.first_name+" "+a.profiles.last_name+" · "+a.profiles.email:""}<br/>${a.discipline} · ${a.category}</div>${(a.body.authors||[]).length>0&&h`<div style="margin:8px 0;font-size:.9rem"><b>Authors:</b><ol style="margin:4px 0 0;padding-left:20px">${a.body.authors.map((x,i)=>h`<li key=${i}>${x.name}${x.presenting&&h`<b> (presenting)</b>`} · ${x.email?h`<a href=${"mailto:"+x.email}>${x.email}</a>`:h`<span class="mut">no email</span>`} · <span class="mut">${x.affiliation}</span></li>`)}</ol></div>`}${SECT.map(s=>h`<p key=${s} style="margin:6px 0;font-size:.9rem"><b>${s}:</b> ${a.body[s]}</p>`)}
${a.file_path&&(links["a"+a.id]?h`<p><a href=${links["a"+a.id]} target="_blank" rel="noopener">Open attached file</a></p>`:h`<p><a onClick=${()=>open("a"+a.id,"abstract-files",a.file_path)}>View attached file</a></p>`)}
${a.status==="Accepted"&&h`<p class="mut" style="margin:10px 0 0;font-size:.88rem">${absRef(a.ref_no)} · Fee: <b>${a.fee_link_at?a.fee_status:"link not generated"}</b>. Manage it in the <a onClick=${()=>setT("fee")}>Abstract fees</a> tab.</p>`}
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><span class=${"badge "+a.status.replace(/ /g,"")}>${a.status}</span>
<button class="btn s" disabled=${a.status==="Accepted"} onClick=${()=>setStatus("abstracts",a.id,"Accepted")}>Accept</button>
<button class="btn o s dng" disabled=${a.status==="Rejected"} onClick=${()=>setStatus("abstracts",a.id,"Rejected")}>Reject</button>
${Sel(a.status,v=>setStatus("abstracts",a.id,v),["Submitted","Under Review","Accepted","Rejected"])}</div></div>`)}${!abss.length&&h`<p class="mut">No abstracts yet.</p>`}</div>`}
${tab=="fee"&&h`<${AdminFees} abss=${abss} setAbss=${setAbss} flash=${flash} links=${links} open=${open}/>`}
${tab=="wk"&&h`<div><p class="mut">Participants can only request a workshop once their registration is Approved. Approve a request to issue their ticket on the dashboard.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px"><label style="max-width:260px">Workshop<select value=${wkf} onChange=${e=>setWkf(e.target.value)}><option value="All">All workshops</option>${(ct.workshops||[]).map(w=>h`<option key=${w.id} value=${w.id}>${w.title||"Untitled"}</option>`)}</select></label>
<input placeholder="Search name, email, ID or workshop" value=${q} onInput=${e=>setQ(e.target.value)} style="flex:1;min-width:200px;align-self:flex-end"/></div>
<div class="g c3" style="margin-bottom:14px">${["Pending","Approved","Rejected"].map(s=>h`<div class="card" key=${s} style="padding:12px"><b style="font-size:1.4rem">${cnt(enrs.filter(r=>wkf==="All"||r.workshop_id===wkf),s)}</b><div class="mut" style="font-size:.8rem">${s}</div></div>`)}</div>
${enrShown.map(r=>{const p=r.profiles||{},regOk=p.status==="Approved";return h`<div class="card" key=${r.id} style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start"><div><b>${wkTitle(r)}</b><div class="mut" style="font-size:.85rem">Requested ${day(r.created_at)}</div></div><span class=${"badge "+r.status}>${r.status}</span></div>
<div style="margin:10px 0;font-size:.9rem"><b>${p.first_name} ${p.last_name}</b><br/><span class="mut">${p.email}<br/>${p.institution}${p.programme?" · "+p.programme:""}${p.uhs_id?" · ID "+p.uhs_id:""}</span><br/>${p.phone&&h`<a href=${"https://wa.me/"+waNum(p.phone)} target="_blank" rel="noopener noreferrer">${waPretty(p.phone)||p.phone} (WhatsApp)</a>`}</div>
<div style="font-size:.85rem;margin-bottom:10px">Registration: <span class=${"badge "+(p.status||"Pending")}>${p.status||"Unknown"}</span>${!regOk&&h` <span class="amb-x">Registration is no longer approved. Review it before approving this workshop.</span>`}</div>
${r.proof_path?h`<div style="font-size:.85rem;margin-bottom:10px">Workshop fee: PKR ${r.amount}<br/>Transaction ID: ${r.tx_id}<br/>Account name: ${r.account_name}<br/><span class="mut">${day(r.tx_date)}</span><br/>${links["w"+r.id]?h`<a href=${links["w"+r.id]} target="_blank" rel="noopener">Open proof</a>`:h`<a onClick=${()=>open("w"+r.id,"payment-proofs",r.proof_path)}>View proof</a>`}</div>`:h`<div style="font-size:.85rem;margin-bottom:10px"><span class="mut">Free workshop or no payment proof submitted.</span></div>`}
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn s" disabled=${r.status==="Approved"||!regOk} onClick=${()=>setEnrStatus(r.id,"Approved")}>Approve</button><button class="btn o s dng" disabled=${r.status==="Rejected"} onClick=${()=>setEnrStatus(r.id,"Rejected")}>Reject</button>${r.status!=="Pending"&&h`<button class="btn o s" onClick=${()=>setEnrStatus(r.id,"Pending")}>Reset to pending</button>`}</div></div>`})}
${!enrShown.length&&h`<p class="mut">No workshop requests found.</p>`}</div>`}
${tab=="amb"&&h`<div><p class="mut">These ambassador codes are built into the website. A participant who enters one of them gets a ✓ in Registrations. To add or remove codes, edit the AMB list in src/shared.js and redeploy.</p>
<div class="ov"><table><tr><th>Code</th><th>Ambassador</th><th>College</th><th>Registered with this code</th></tr>${AMB.map(([c,n,col])=>h`<tr key=${c}><td><b>${c}</b></td><td>${n}</td><td>${col}</td><td>${(l=>l.length?h`<b>${l.length}</b><br/>${l.map(r=>r.first_name+" "+r.last_name).join(", ")}`:"0")(regs.filter(r=>(r.ambassador_code||"").toUpperCase()===c))}</td></tr>`)}</table></div></div>`}
${tab=="ct"&&h`<div><h3>Key dates</h3>${draft.dates.map((d,i)=>h`<div key=${i} class="g c3" style="margin-bottom:8px"><input value=${d[0]} onInput=${e=>ed("dates",i,0,e.target.value)}/><input value=${d[1]} onInput=${e=>ed("dates",i,1,e.target.value)}/><input type="date" value=${d[2]} onInput=${e=>ed("dates",i,2,e.target.value)}/></div>`)}
<h3>Team</h3>${draft.team.map((d,i)=>h`<div key=${i} class="g c2" style="margin-bottom:8px"><input value=${d[0]} onInput=${e=>ed("team",i,0,e.target.value)}/><input value=${d[1]} onInput=${e=>ed("team",i,1,e.target.value)}/></div>`)}
<h3>FAQs</h3>${draft.faqs.map((d,i)=>h`<div key=${i} class="g c2" style="margin-bottom:8px"><input value=${d[0]} onInput=${e=>ed("faqs",i,0,e.target.value)}/><input value=${d[1]} onInput=${e=>ed("faqs",i,1,e.target.value)}/></div>`)}
<h3>Workshops</h3><p class="mut" style="margin-top:-6px">Shown on the public Workshop page. For the image, paste a direct link to an image hosted online (e.g. an Imgur link ending in .jpg/.png). Enter 0 for a fee that's free.</p>
${wks.map((w,i)=>h`<div key=${i} class="card" style="margin-bottom:12px;padding:16px">
<label>Title<input value=${w.title} placeholder="e.g. Suturing Skills Workshop" onInput=${e=>edWk(i,"title",e.target.value)}/></label>
<label style="margin-top:10px;display:block">Description<textarea value=${w.desc} placeholder="What the workshop covers, who it's for, duration, etc." onInput=${e=>edWk(i,"desc",e.target.value)}/></label>
<label style="margin-top:10px;display:block">Image link (Imgur or any direct image URL)<input type="url" value=${w.image} placeholder="https://i.imgur.com/example.jpg" onInput=${e=>edWk(i,"image",e.target.value)}/></label>
${w.image&&h`<img src=${w.image} alt="Preview" style="max-width:220px;max-height:140px;object-fit:cover;border-radius:8px;margin-top:8px;display:block"/>`}
<div class="g c3" style="margin-top:10px"><label>Date<input type="date" value=${w.date||""} onInput=${e=>edWk(i,"date",e.target.value)}/></label><label>Time<input value=${w.time||""} placeholder="e.g. 9:00 AM – 12:00 PM" onInput=${e=>edWk(i,"time",e.target.value)}/></label><label>Venue<input value=${w.venue||""} placeholder="Sargodha Medical College" onInput=${e=>edWk(i,"venue",e.target.value)}/></label></div>
<div class="g c2" style="margin-top:10px">
<label>Fee for SMCians (PKR)<input type="text" inputMode="decimal" value=${w.feeSmc} placeholder="0 = free" onInput=${e=>edWk(i,"feeSmc",e.target.value.replace(/[^\d.]/g,""))}/></label>
<label>Fee for non-SMCians (PKR)<input type="text" inputMode="decimal" value=${w.feeNon} placeholder="e.g. 500" onInput=${e=>edWk(i,"feeNon",e.target.value.replace(/[^\d.]/g,""))}/></label>
</div>
<button class="btn o s dng" style="margin-top:12px" onClick=${()=>delWk(i)}>Remove workshop</button></div>`)}
<button class="btn o" style="margin-bottom:16px" onClick=${addWk}>+ Add workshop</button><br/>
<button class="btn" onClick=${saveContent}>Save changes</button></div>`}
${tab=="csv"&&h`<div><p class="mut">Downloads open directly in Excel or Google Sheets. The WhatsApp list has each participant’s name and number; the .vcf file imports the same list straight into your phone’s contacts.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onClick=${exportRegs}>Download registrations CSV (${regs.length})</button><button class="btn o" onClick=${exportAbs}>Download abstracts CSV (${abss.length})</button><button class="btn" onClick=${exportWa}>Download WhatsApp list (${waList.length})</button><button class="btn o" onClick=${exportVcf}>Download contacts .vcf (${waList.length})</button><button class="btn" onClick=${exportEnr}>Download workshop enrolments CSV (${enrs.length})</button></div></div>`}</div>`}
