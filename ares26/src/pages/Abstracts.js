import {useState,h,DISC,SECT,Spin,useSubmit,friendly,withTimeout,focusFirstError,Inp,track,PageSkel,OKTYPES,THANKS_KEY} from '../shared.js';
import {sb,upload,MAX_FILE} from '../supabase.js';

export default function Abstracts(P){
const{session,go,refresh,ct}=P;const[f,setF]=useState({disc:DISC[0],cat:"Oral"}),[file,setFile]=useState(null),[fe,setFe]=useState({}),[err,setErr]=useState(""),[busy,run]=useSubmit();
if(session===undefined)return h`<${PageSkel} narrow=${true}/>`;
if(!session)return h`<div class="auth"><h1 style="font-size:1.7rem">Abstract submission</h1><p class="sub">You need to be logged in to submit an abstract.</p><div class="panel"><button class="btn block" onClick=${()=>{try{sessionStorage.setItem("srcNext","abstracts")}catch(e){}go("login")}}>Log in</button><p class="alt">No account? <a href="#register" onClick=${e=>{e.preventDefault();try{sessionStorage.setItem("srcNext","abstracts")}catch(x){}go("register")}}>Register</a></p></div></div>`;
const set=k=>e=>setF({...f,[k]:e.target.value});
const pick=e=>{const x=e.target.files[0];setFe(v=>({...v,file:undefined}));
 if(!x){setFile(null);return}
 if(x.size>MAX_FILE){setFe(v=>({...v,file:"File is larger than 5 MB."}));e.target.value="";setFile(null);return}
 if(x.type&&!OKTYPES.concat(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]).includes(x.type)){setFe(v=>({...v,file:"Use a PDF, DOCX or image (JPG, PNG, WebP)."}));e.target.value="";setFile(null);return}
 setFile(x)};
const sub=ev=>{ev.preventDefault();const x={};
 if(!(f.title||"").trim())x.title="Add a title.";else if(f.title.length>300)x.title="Keep the title under 300 characters.";
 SECT.forEach(s=>{if(!(f[s]||"").trim())x[s]="Complete the "+s+" section."});
 if(fe.file)x.file=fe.file;
 setFe(x);setErr(Object.keys(x).length?"Please fix the highlighted fields.":"");if(Object.keys(x).length){focusFirstError();return}
 return run(async()=>{try{
  const path=file?await withTimeout(upload("abstract-files",session.user.id,file),90000):null;
  const{error}=await withTimeout(sb.from("abstracts").insert({user_id:session.user.id,title:f.title.trim(),discipline:f.disc,category:f.cat,body:Object.fromEntries(SECT.map(s=>[s,f[s].trim()])),file_path:path,status:"Submitted"}),30000);
  if(error)throw error;
  track("abstract_submitted",{category:f.cat});
  try{sessionStorage.setItem(THANKS_KEY,"abstract")}catch(e){}
  refresh();go("thanks")}catch(e){setErr(friendly(e,"Submission failed. Try again."))}})};
return h`<div class="auth" style="max-width:640px"><h1 style="font-size:1.7rem">Abstract submission</h1><p class="sub">Closes ${ct.dates[2]?ct.dates[2][0]:"TBC"} (TBC).</p><form class="panel" noValidate onSubmit=${sub}>
<${Inp} l="Title" k="title" f=${f} set=${set} fe=${fe} maxLength="300"/>
<label>Discipline<select value=${f.disc} onChange=${set("disc")}>${DISC.map(d=>h`<option key=${d}>${d}</option>`)}</select></label>
<label>Category<select value=${f.cat} onChange=${set("cat")}><option>Oral</option><option>Poster</option></select></label>
${SECT.map(s=>h`<label key=${s}>${s}<span class="rq" aria-hidden="true"> *</span><textarea rows="4" value=${f[s]||""} onInput=${set(s)} aria-required="true" aria-invalid=${fe[s]?"true":"false"} aria-describedby=${fe[s]?"e-"+s:undefined}/>${fe[s]&&h`<span class="fe" id=${"e-"+s} role="alert">${fe[s]}</span>`}</label>`)}
<label>Supplementary file (optional · PDF, DOCX or image, max 5 MB)<input type="file" accept=".pdf,.docx,image/*" onChange=${pick} aria-invalid=${fe.file?"true":"false"} aria-describedby=${fe.file?"e-file":undefined}/>${fe.file&&h`<span class="fe" id="e-file" role="alert">${fe.file}</span>`}</label>
${err&&h`<div class="err" role="alert" tabIndex="-1">${err}</div>`}<button type="submit" class="btn block" disabled=${busy} aria-busy=${busy}>${busy&&h`<${Spin}/>`}${busy?(file?"Uploading and submitting…":"Submitting…"):"Submit abstract"}</button></form></div>`}
