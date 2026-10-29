import {useState,useEffect,h,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

const clean=c=>{let v=String(c??"");if(/^[=@\t\r]/.test(v)||/^[+-](?![0-9])/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
const download=(name,rows)=>{const csv="\ufeff"+rows.map(r=>r.map(clean).join(",")).join("\r\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=name;document.body.appendChild(a);a.click();a.remove()};

export default function Admin(P){
const{session,profile,logout,ct,setC}=P;
const[em,setEm]=useState(""),[pw,setPw]=useState(""),[er,setEr]=useState(""),[tab,setT]=useState("reg"),
[regs,setRegs]=useState([]),[abss,setAbss]=useState([]),[links,setLinks]=useState({}),[draft,setDraft]=useState(ct),[msg,setMsg]=useState(""),[q,setQ]=useState("");
const isAdmin=!!(profile&&profile.is_admin);

const load=async()=>{
 const a=await sb.from("profiles").select("*").order("created_at",{ascending:false});if(a.error)setMsg(a.error.message);else setRegs(a.data||[]);
 const b=await sb.from("abstracts").select("*, profiles(first_name,last_name,email)").order("created_at",{ascending:false});if(b.error)setMsg(b.error.message);else setAbss(b.data||[])};
useEffect(()=>{if(isAdmin)load()},[isAdmin]);
useEffect(()=>{setDraft(ct)},[ct]);

if(session===undefined||(session&&profile===undefined))return h`<div class="w sec"><p class="mut">Loading...</p></div>`;
if(!session)return h`<div class="auth"><h2>Admin sign in</h2><div class="panel"><label>Email<input type="email" value=${em} onInput=${e=>setEm(e.target.value)}/></label><label>Password<input type="password" value=${pw} onInput=${e=>setPw(e.target.value)}/></label>${er&&h`<div class="err" role="alert">${er}</div>`}
<button class="btn block" onClick=${async()=>{setEr("");const{error}=await sb.auth.signInWithPassword({email:em.trim(),password:pw});if(error)setEr("Email or password is incorrect.")}}>Sign in</button></div></div>`;
if(!isAdmin)return h`<div class="w sec" style="max-width:480px"><h2>Not authorized</h2><p class="mut">This account does not have admin access. Ask an existing admin to enable it.</p><button class="btn o" onClick=${logout}>Log out</button></div>`;

const flash=t=>{setMsg(t);setTimeout(()=>setMsg(""),4000)};
const setStatus=async(table,id,status)=>{const{error}=await sb.from(table).update({status}).eq("id",id);if(error)return flash(error.message);
 table==="profiles"?setRegs(regs.map(r=>r.id==id?{...r,status}:r)):setAbss(abss.map(r=>r.id==id?{...r,status}:r))};
const open=async(key,bucket,path)=>{try{const u=await signed(bucket,path);setLinks(l=>({...l,[key]:u}))}catch(e){flash(e.message)}};
const ed=(key,i,j,v)=>setDraft({...draft,[key]:draft[key].map((r,x)=>x==i?r.map((c,y)=>y==j?v:c):r)});
const saveContent=async()=>{const{error}=await sb.from("site_content").upsert({id:1,data:draft});if(error)return flash(error.message);setC(draft);flash("Saved. The public site now shows these changes.")};
const Sel=(v,fn,o)=>h`<select value=${v} onChange=${e=>fn(e.target.value)} style="width:auto">${o.map(x=>h`<option key=${x}>${x}</option>`)}</select>`;
const day=d=>d?new Date(d).toLocaleString():"";
const shown=regs.filter(r=>!q||(r.first_name+" "+r.last_name+" "+r.email+" "+(r.tx_id||"")).toLowerCase().includes(q.toLowerCase()));

const exportRegs=()=>download("ares26-registrations.csv",[["Registered at","First name","Last name","Email","SMC student","Phone","Institution","Programme","Degree year","Transaction date","Account name","Amount (PKR)","Transaction ID","Proof uploaded","Status"],
 ...regs.map(r=>[r.created_at,r.first_name,r.last_name,r.email,r.smc?"Yes":"No",r.phone,r.institution,r.programme,r.degree_year,r.tx_date,r.account_name,r.amount,r.tx_id,r.proof_path?"Yes":"No",r.status])]);
const exportAbs=()=>download("ares26-abstracts.csv",[["Submitted at","Author","Email","Title","Discipline","Category","Introduction","Methodology","Results","Conclusion","File uploaded","Status"],
 ...abss.map(a=>[a.created_at,a.profiles?a.profiles.first_name+" "+a.profiles.last_name:"",a.profiles?a.profiles.email:"",a.title,a.discipline,a.category,...SECT.map(s=>a.body[s]),a.file_path?"Yes":"No",a.status])]);

return h`<div class="w sec"><div style="display:flex;justify-content:space-between"><h2>Admin panel</h2><button class="btn o s" onClick=${logout}>Sign out</button></div>
${msg&&h`<div class="ok">${msg}</div>`}
<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">${[["reg","Registrations"],["abs","Abstracts"],["ct","Content"],["csv","Export"]].map(([k,l])=>h`<button key=${k} class=${"btn s"+(tab==k?"":" o")} onClick=${()=>setT(k)}>${l}</button>`)}<button class="btn o s" onClick=${load}>Refresh</button></div>
${tab=="reg"&&h`<div><input placeholder="Search name, email or transaction ID" value=${q} onInput=${e=>setQ(e.target.value)} style="margin-bottom:12px"/>
<div class="ov"><table><tr><th>Name</th><th>Payment</th><th>Status</th></tr>${shown.map(u=>h`<tr key=${u.id}><td>${u.first_name} ${u.last_name}<br/><span class="mut">${u.email}</span><br/><span class="mut">${u.institution} · ${u.programme}</span></td>
<td>${u.proof_path?h`<span>PKR ${u.amount}<br/>ID ${u.tx_id}<br/>${u.account_name}<br/><span class="mut">${day(u.tx_date)}</span><br/>${links["p"+u.id]?h`<a href=${links["p"+u.id]} target="_blank" rel="noopener">Open proof</a>`:h`<a onClick=${()=>open("p"+u.id,"payment-proofs",u.proof_path)}>View proof</a>`}</span>`:h`<span class="mut">No payment yet</span>`}</td>
<td>${Sel(u.status,v=>setStatus("profiles",u.id,v),["Pending","Approved","Rejected"])}</td></tr>`)}</table>${!shown.length&&h`<p class="mut">No registrations found.</p>`}</div></div>`}
${tab=="abs"&&h`<div>${abss.map(a=>h`<div class="card" key=${a.id} style="margin-bottom:10px"><b>${a.title}</b><div class="mut" style="font-size:.85rem">${a.profiles?a.profiles.first_name+" "+a.profiles.last_name+" · "+a.profiles.email:""}<br/>${a.discipline} · ${a.category}</div>${SECT.map(s=>h`<p key=${s} style="margin:6px 0;font-size:.9rem"><b>${s}:</b> ${a.body[s]}</p>`)}
${a.file_path&&(links["a"+a.id]?h`<p><a href=${links["a"+a.id]} target="_blank" rel="noopener">Open attached file</a></p>`:h`<p><a onClick=${()=>open("a"+a.id,"abstract-files",a.file_path)}>View attached file</a></p>`)}
${Sel(a.status,v=>setStatus("abstracts",a.id,v),["Submitted","Under Review","Accepted","Rejected"])}</div>`)}${!abss.length&&h`<p class="mut">No abstracts yet.</p>`}</div>`}
${tab=="ct"&&h`<div><h3>Key dates</h3>${draft.dates.map((d,i)=>h`<div key=${i} class="g c3" style="margin-bottom:8px"><input value=${d[0]} onInput=${e=>ed("dates",i,0,e.target.value)}/><input value=${d[1]} onInput=${e=>ed("dates",i,1,e.target.value)}/><input type="date" value=${d[2]} onInput=${e=>ed("dates",i,2,e.target.value)}/></div>`)}
<h3>Team</h3>${draft.team.map((d,i)=>h`<div key=${i} class="g c2" style="margin-bottom:8px"><input value=${d[0]} onInput=${e=>ed("team",i,0,e.target.value)}/><input value=${d[1]} onInput=${e=>ed("team",i,1,e.target.value)}/></div>`)}
<h3>FAQs</h3>${draft.faqs.map((d,i)=>h`<div key=${i} class="g c2" style="margin-bottom:8px"><input value=${d[0]} onInput=${e=>ed("faqs",i,0,e.target.value)}/><input value=${d[1]} onInput=${e=>ed("faqs",i,1,e.target.value)}/></div>`)}
<button class="btn" onClick=${saveContent}>Save changes</button></div>`}
${tab=="csv"&&h`<div><p class="mut">Downloads open directly in Excel or Google Sheets.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onClick=${exportRegs}>Download registrations CSV (${regs.length})</button><button class="btn o" onClick=${exportAbs}>Download abstracts CSV (${abss.length})</button></div></div>`}</div>`}
