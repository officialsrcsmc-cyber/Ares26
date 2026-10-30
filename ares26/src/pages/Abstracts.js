import {useState,useEffect,h,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

export default function Abstracts(P){
const{session,profile,go,refresh,ct}=P;const[f,setF]=useState({disc:DISC[0],cat:"Oral"}),[file,setFile]=useState(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
if(session===undefined)return h`<div class="w sec"><p class="mut">Loading...</p></div>`;
if(!session)return h`<div class="auth"><h2>Abstract submission</h2><p class="sub">You need to be logged in to submit an abstract.</p><div class="panel"><button class="btn block" onClick=${()=>go("login")}>Log in</button></div></div>`;
const set=k=>e=>setF({...f,[k]:e.target.value});
const sub=async()=>{
 if(!(f.title||"").trim()||SECT.some(s=>!(f[s]||"").trim()))return setErr("Add a title and complete every section.");
 if(file&&file.size>MAX_FILE)return setErr("File is larger than 5 MB.");
 setErr("");setBusy(true);
 try{const path=file?await upload("abstract-files",session.user.id,file):null;
  const{error}=await sb.from("abstracts").insert({user_id:session.user.id,title:f.title.trim(),discipline:f.disc,category:f.cat,body:Object.fromEntries(SECT.map(s=>[s,f[s].trim()])),file_path:path,status:"Submitted"});
  if(error)throw error;await refresh();setDone(true)}
 catch(e){setErr(e.message||"Submission failed. Try again.")}
 setBusy(false)};
if(done)return h`<div class="auth"><h2>Abstract submitted</h2><p class="sub">Track its review status on your dashboard.</p><div class="panel"><button class="btn block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div></div>`;
return h`<div class="auth" style="max-width:640px"><h2>Abstract submission</h2><p class="sub">Closes ${ct.dates[2]?ct.dates[2][0]:"TBC"} (TBC).</p><div class="panel">
<label>Title<input value=${f.title||""} onInput=${set("title")}/></label>
<label>Discipline<select value=${f.disc} onChange=${set("disc")}>${DISC.map(d=>h`<option key=${d}>${d}</option>`)}</select></label>
<label>Category<select value=${f.cat} onChange=${set("cat")}><option>Oral</option><option>Poster</option></select></label>
${SECT.map(s=>h`<label key=${s}>${s}<textarea rows="4" value=${f[s]||""} onInput=${set(s)}/></label>`)}
<label>Supplementary file (PDF, DOCX or image, max 5 MB)<input type="file" accept=".pdf,.docx,image/*" onChange=${e=>{const x=e.target.files[0];if(x&&x.size>MAX_FILE){setErr("File is larger than 5 MB.");e.target.value="";setFile(null)}else{setErr("");setFile(x||null)}}}/></label>
${err&&h`<div class="err" role="alert">${err}</div>`}<button class="btn block" disabled=${busy} onClick=${sub}>${busy?"Submitting...":"Submit abstract"}</button></div></div>`}
