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


/* ---------- Presentation helpers (icons, accordion, highlighting) ---------- */
const IC={
cal:"M8 2v4|M16 2v4|M3 10h18|M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
pin:"M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z|M12 7a3 3 0 1 0 0 6a3 3 0 0 0 0-6z",
clock:"M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z|M12 7v5l3 2",
words:"M4 7V5h16v2|M9 19h6|M12 5v14",
font:"M4 20l8-16 8 16|M7.5 14h9",
space:"M9 6h11|M9 12h11|M9 18h11|M4 4v16|M2.5 5.5L4 4l1.5 1.5|M2.5 18.5L4 20l1.5-1.5",
globe:"M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z|M3 12h18|M12 3c2.5 2.5 3.8 5.6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z",
file:"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z|M14 3v5h5|M9 13h6|M9 17h6",
present:"M3 4h18|M5 4v11h14V4|M12 15v5|M8 20h8",
trophy:"M8 21h8|M12 17v4|M7 4h10v5a5 5 0 0 1-10 0z|M7 6H4v1a3 3 0 0 0 3 3|M17 6h3v1a3 3 0 0 1-3 3",
award:"M12 3a6 6 0 1 0 0 12a6 6 0 0 0 0-12z|M8.5 14L7 21l5-3 5 3-1.5-7",
grad:"M2 9l10-5 10 5-10 5z|M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5|M22 9v6",
chev:"M6 9l6 6 6-6",
alert:"M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z|M12 9.5v4|M12 17.2v.01",
check:"M5 12.5l4.5 4.5L19 7.5",
down:"M12 5v14|M6 13l6 6 6-6"};
const Ic=({n,size=22})=>h`<svg viewBox="0 0 24 24" width=${size} height=${size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">${IC[n].split("|").map((d,i)=>h`<path key=${i} d=${d}/>`)}</svg>`;

const FMT_IC=["words","font","space","globe","file"];
const PRES_IC=["present","trophy","award","grad"];

// wraps every match of `re` (one capture group) in a highlighted element
const mark=(s,re,tag)=>String(s).split(re).map((x,i)=>i%2?h`<${tag||"mark"} class=${tag?"ab-key":"ab-hl"} key=${i}>${x}<//>`:x);

const Acc=({t,d,i})=>{const[o,setO]=useState(false),id="ab-acc-"+i;
return h`<div class=${"ab-acc"+(o?" open":"")}>
<h3 class="ab-acc-h"><button type="button" class="ab-acc-b" id=${id+"-b"} aria-expanded=${o} aria-controls=${id} onClick=${()=>setO(!o)}><span>${t}</span><span class="ab-chev"><${Ic} n="chev" size=${18}/></span></button></h3>
<div class="ab-acc-p" id=${id} role="region" aria-labelledby=${id+"-b"}><div><p>${d}</p></div></div></div>`};

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
