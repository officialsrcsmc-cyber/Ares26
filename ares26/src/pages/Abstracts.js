import {useState,useEffect,h,BANK,DISC,SECT,left,Ic,Acc} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

const FMT=[["Word limit","Max 300 words (excl. title, keywords, author details)"],["Font","Arial or Calibri, size 12"],["Spacing","Single line spacing (1.0)"],["Language","English"],["File format","MS Word — .doc or .docx"]];
const CATS=[["Original Research Studies","Cross-sectional studies; cohort studies (prospective and retrospective); case-control studies; randomized controlled trials (RCTs); other observational and interventional studies; case reports and case series."],
["Systematic Reviews & Meta-Analyses","Systematic reviews; meta-analyses; scoping reviews."],
["Database & Population-Based Studies","CDC WONDER database studies; Global Burden of Disease (GBD) studies; other large-scale national or international database and registry-based studies."]];
const CONTENT=[["Title","Concise and reflective of the research"],["Introduction","Background, rationale and objectives"],["Methodology","Study design, sample, tools and data analysis"],["Results","Key findings, including a numeric/statistical summary"],["Conclusion & recommendations",""],["Keywords","3–5 terms, preferably using MeSH terms"]];
const PRES=[["Modes of presentation","Oral and Poster"],["Top 3 presentations","Cash prizes"],["Certificates","Awarded to all participants & presenters"],["CME points","For Pre-Conference Workshop participants and scientific-session presenters (oral or poster)"]];
const STEPS=["Submit your abstract through the website.","All submissions are peer-reviewed.","Notification of acceptance: by 14 Nov 2026.","Final PowerPoint presentation / poster due: by 19 Nov 2026.","After acceptance, pay PKR 1,000 per participant/presenter.","Upload the fee payment receipt in the registration form on the website."];
const POLICY=[["Multiple authorships permitted","You may be listed as an author or co-author on more than one submitted abstract."],["One presentation per person","You may serve as the presenting author for only ONE accepted abstract, whether oral or poster."],["More than one acceptance","If you're the presenting author on more than one accepted abstract, nominate another listed co-author to present the rest — they must complete the required registration."],["Designated presenter","Every abstract names one presenting author, responsible for delivering it and answering questions."]];


/* ---------- Presentation helpers (icons, accordion, highlighting) ---------- */
const FMT_IC=["words","font","space","globe","file"];
const PRES_IC=["present","trophy","award","grad"];

// wraps every match of `re` (one capture group) in a highlighted element
const mark=(s,re,tag)=>String(s).split(re).map((x,i)=>i%2?h`<${tag||"mark"} class=${tag?"ab-key":"ab-hl"} key=${i}>${x}<//>`:x);

const Sec=({t,id,children})=>h`<section class="ab-sec" aria-labelledby=${id}><h2 class="ab-h" id=${id}>${t}</h2>${children}</section>`;

const Guidelines=({ct})=>{
const de=ct.dates.find(([,t])=>/abstract.*deadline/i.test(t))||[],dl=de[0]||"9 Nov",cd=de[2]?left(de[2]):"";
const scrollToForm=()=>{const el=document.getElementById("abs-form");if(el)el.scrollIntoView({behavior:"smooth",block:"start"})};
return h`<div class="ab-page">
<div class="ab-top">
<p class="ab-eyebrow"><span>ARES’26</span><i aria-hidden="true"></i><span>ABSTRACT SUBMISSIONS</span></p>
<h1 class="ab-title">Abstract Submission Guidelines</h1>
<p class="ab-meta"><span>Sargodha Medical College, Sargodha – Pakistan</span><span class="ab-dot" aria-hidden="true">·</span><span>ARES’26</span><span class="ab-dot" aria-hidden="true">·</span><span>Saturday, 21st November 2026</span></p>
<button type="button" class="btn ab-cta" onClick=${scrollToForm}>Submit your abstract <${Ic} n="down" size=${18}/></button>
</div>

<div class="ab-key-cards">
<div class="ab-kc"><span class="ab-ico"><${Ic} n="cal"/></span><div><p class="ab-lbl">Conference date</p><p class="ab-val">Sat, 21 Nov 2026</p></div></div>
<div class="ab-kc"><span class="ab-ico"><${Ic} n="pin"/></span><div><p class="ab-lbl">Mode</p><p class="ab-val">In-person</p></div></div>
<div class="ab-kc ab-deadline"><span class="ab-ico"><${Ic} n="clock"/></span><div><p class="ab-lbl">Abstract deadline</p><p class="ab-val">${dl} 2026</p>${cd&&h`<span class="ab-pill">${cd.charAt(0)+cd.slice(1).toLowerCase()}</span>`}</div></div>
</div>

<${Sec} t="Abstract formatting" id="ab-fmt"><div class="ab-fmt">
${FMT.map(([t,d],i)=>h`<div class=${"ab-fc"+(i==0?" wide":"")} key=${t}><span class="ab-ico sm"><${Ic} n=${FMT_IC[i]} size=${20}/></span><div><p class="ab-lbl dk">${t}</p><p class="ab-txt">${d}</p></div></div>`)}
</div><//>

<${Sec} t="Abstract categories" id="ab-cat">
<div class="ab-accs">${CATS.map(([t,d],i)=>h`<${Acc} key=${t} t=${t} d=${d} i=${i}/>`)}</div>
<div class="ab-warn" role="note"><span class="ab-warn-i"><${Ic} n="alert" size=${20}/></span><p><b>Not accepted:</b> Narrative reviews, letters to the editor, editorials, opinion articles and commentaries.</p></div>
<//>

<${Sec} t="Abstract content structure" id="ab-str">
<ol class="ab-struct">${CONTENT.map(([t,d],i)=>h`<li key=${t}><span class="ab-num" aria-hidden="true">${i+1}</span><div><b>${t}</b>${d&&h`<span>${d}</span>`}</div></li>`)}</ol>
<//>

<${Sec} t="Presentation & recognition" id="ab-pres"><div class="ab-pres">
${PRES.map(([t,d],i)=>h`<div class="ab-pc" key=${t}><span class="ab-ico"><${Ic} n=${PRES_IC[i]}/></span><div><p class="ab-pt">${t}</p><p class="ab-txt">${d}</p></div></div>`)}
</div><//>

<${Sec} t="Submission & review" id="ab-sub">
<ol class="ab-tl">${STEPS.map((s,i)=>{const pay=/PKR|receipt/i.test(s),date=/\d{1,2} Nov 2026/.test(s);
return h`<li key=${i}><span class="ab-num" aria-hidden="true">${i+1}</span><div class="ab-step"><p>${mark(s,/(\d{1,2} Nov 2026|PKR [\d,]+)/)}</p>${(pay||date)&&h`<span class=${"ab-tag"+(pay?" pay":"")}>${pay?"Payment":"Key date"}</span>`}</div></li>`})}</ol>
<//>

<${Sec} t="Authorship & presenting author policy" id="ab-pol">
<ul class="ab-pol">${POLICY.map(([t,d])=>h`<li key=${t}><span class="ab-ck"><${Ic} n="check" size=${16}/></span><p><b>${t}</b> — ${mark(d,/\b(ONE)\b/,"strong")}</p></li>`)}</ul>
<//>
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
<section class="sec w ab">
<${Guidelines} ct=${ct}/>
</section>
<div id="abs-form" class="ab-form">${body}</div>
</div>`}
