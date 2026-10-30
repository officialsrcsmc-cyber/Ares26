import {useState,useEffect,h,BANK,DISC,SECT,left} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

const FMT=[["Word limit","Max 300 words (excl. title, keywords, author details)"],["Font","Arial or Calibri, size 12"],["Spacing","Single line spacing (1.0)"],["Language","English"],["File format","MS Word — .doc or .docx"]];
const CATS=[["Original Research Studies","Cross-sectional studies; cohort studies (prospective and retrospective); case-control studies; randomized controlled trials (RCTs); other observational and interventional studies; case reports and case series."],
["Systematic Reviews & Meta-Analyses","Systematic reviews; meta-analyses; scoping reviews."],
["Database & Population-Based Studies","CDC WONDER database studies; Global Burden of Disease (GBD) studies; other large-scale national or international database and registry-based studies."]];
const CONTENT=[["Title","Concise and reflective of the research"],["Introduction","Background, rationale and objectives"],["Methodology","Study design, sample, tools and data analysis"],["Results","Key findings, including a numeric/statistical summary"],["Conclusion & recommendations",""],["Keywords","3–5 terms, preferably using MeSH terms"]];
const PRES=[["Modes of presentation","Oral and Poster"],["Top 3 presentations","Cash prizes"],["Certificates","Awarded to all participants & presenters"],["CME points","For Pre-Conference Workshop participants and scientific-session presenters (oral or poster)"]];
const STEPS=["Submit your abstract through the website.","All submissions are peer-reviewed.","Notification of acceptance: by 14 Nov 2026.","Final PowerPoint presentation / poster due: by 19 Nov 2026.","After acceptance, pay PKR 1,000 per participant/presenter.","Upload the fee payment receipt in the registration form on the website."];
const POLICY=[["Multiple authorships permitted","You may be listed as an author or co-author on more than one submitted abstract."],["One presentation per person","You may serve as the presenting author for only ONE accepted abstract, whether oral or poster."],["More than one acceptance","If you're the presenting author on more than one accepted abstract, nominate another listed co-author to present the rest — they must complete the required registration."],["Designated presenter","Every abstract names one presenting author, responsible for delivering it and answering questions."]];

const Guidelines=({ct})=>{
const dl=(ct.dates.find(([,t])=>/abstract.*deadline/i.test(t))||[])[0]||"9 Nov";
return h`<div class="panel" style="margin-bottom:32px">
<h2 style="margin-bottom:4px">Abstract Submission Guidelines</h2>
<p class="mut" style="margin:0 0 24px">Sargodha Medical College, Sargodha – Pakistan · ARES’26 · Saturday, 21st November 2026</p>

<div class="g c3" style="margin-bottom:28px">
<div class="card k"><div class="dt"><b>Conference date</b></div><p style="margin:8px 0 0">Sat, 21 Nov 2026</p></div>
<div class="card k"><div class="dt"><b>Mode</b></div><p style="margin:8px 0 0">In-person</p></div>
<div class="card k"><div class="dt"><b>Abstract deadline</b></div><p style="margin:8px 0 0">${dl} 2026</p></div>
</div>

<h3>Abstract formatting</h3>
<div class="g c3" style="margin-bottom:28px">
${FMT.map(([t,d])=>h`<div class="card" key=${t}><b style="display:block;margin-bottom:6px">${t}</b><span class="mut" style="font-size:.9rem">${d}</span></div>`)}
</div>

<h3>Abstract categories</h3>
<div style="margin-bottom:12px">
${CATS.map(([t,d])=>h`<details key=${t}><summary>${t}</summary><p>${d}</p></details>`)}
</div>
<p class="err" style="margin-bottom:28px"><b>Not accepted:</b> Narrative reviews, letters to the editor, editorials, opinion articles and commentaries.</p>

<h3>Abstract content structure</h3>
<ol style="margin:0 0 28px;padding-left:20px;line-height:1.9">
${CONTENT.map(([t,d])=>h`<li key=${t}><b>${t}</b>${d?" — "+d:""}</li>`)}
</ol>

<h3>Presentation & recognition</h3>
<div class="g c2" style="margin-bottom:28px">
${PRES.map(([t,d])=>h`<div class="card" key=${t}><b>${t}</b><p class="mut" style="margin:6px 0 0">${d}</p></div>`)}
</div>

<h3>Submission & review</h3>
<ol style="margin:0 0 28px;padding-left:20px;line-height:1.9">${STEPS.map((s,i)=>h`<li key=${i}>${s}</li>`)}</ol>

<h3>Authorship & presenting author policy</h3>
<ul style="margin:0;padding-left:20px;line-height:1.9">
${POLICY.map(([t,d])=>h`<li key=${t}><b>${t}</b> — ${d}</li>`)}
</ul>
</div>`};

export default function Abstracts(P){
const{session,profile,go,refresh,ct}=P;const[f,setF]=useState({disc:DISC[0],cat:"Oral"}),[file,setFile]=useState(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
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

let body;
if(session===undefined)body=h`<div class="w sec"><p class="mut">Loading...</p></div>`;
else if(!session)body=h`<div class="auth"><h2>Abstract submission</h2><p class="sub">You need to be logged in to submit an abstract.</p><div class="panel"><button class="btn block" onClick=${()=>go("login")}>Log in</button></div></div>`;
else if(done)body=h`<div class="auth"><h2>Abstract submitted</h2><p class="sub">Track its review status on your dashboard.</p><div class="panel"><button class="btn block" onClick=${()=>go("dashboard")}>Go to dashboard</button></div></div>`;
else{const dl=(ct.dates.find(([,t])=>/abstract.*deadline/i.test(t))||[])[0]||"TBC";
body=h`<div class="auth" style="max-width:640px"><h2>Abstract submission</h2><p class="sub">Closes ${dl}.</p><div class="panel">
<label>Title<input value=${f.title||""} onInput=${set("title")}/></label>
<label>Discipline<select value=${f.disc} onChange=${set("disc")}>${DISC.map(d=>h`<option key=${d}>${d}</option>`)}</select></label>
<label>Category<select value=${f.cat} onChange=${set("cat")}><option>Oral</option><option>Poster</option></select></label>
${SECT.map(s=>h`<label key=${s}>${s}<textarea rows="4" value=${f[s]||""} onInput=${set(s)}/></label>`)}
<label>Supplementary file (PDF, DOCX or image, max 5 MB)<input type="file" accept=".pdf,.docx,image/*" onChange=${e=>{const x=e.target.files[0];if(x&&x.size>MAX_FILE){setErr("File is larger than 5 MB.");e.target.value="";setFile(null)}else{setErr("");setFile(x||null)}}}/></label>
${err&&h`<div class="err" role="alert">${err}</div>`}<button class="btn block" disabled=${busy} onClick=${sub}>${busy?"Submitting...":"Submit abstract"}</button></div></div>`}

return h`<div>
<section class="sec w" style="max-width:860px;padding-bottom:0">
<${Guidelines} ct=${ct}/>
</section>
${body}
</div>`}
