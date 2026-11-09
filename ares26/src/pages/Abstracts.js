import {useState,useEffect,useRef,h,BANK,DISC,SECT,left,Ic,Acc,ABS_FEE,absRef} from '../shared.js';
import {sb,upload,signed,MAX_FILE} from '../supabase.js';

const FMT=[["Word limit","Max 400 words in total across all sections (excl. title, keywords, author details)"],["Font","Arial or Calibri, size 12"],["Spacing","Single line spacing (1.0)"],["Language","English"],["File format","MS Word — .doc or .docx"]];
const CATS=[["Original Research Studies","Cross-sectional studies; cohort studies (prospective and retrospective); case-control studies; randomized controlled trials (RCTs); other observational and interventional studies; case reports and case series."],
["Systematic Reviews & Meta-Analyses","Systematic reviews; meta-analyses; scoping reviews."],
["Database & Population-Based Studies","CDC WONDER database studies; Global Burden of Disease (GBD) studies; other large-scale national or international database and registry-based studies."]];
const CONTENT=[["Title","Concise and reflective of the research"],["Introduction","Background, rationale and objectives"],["Methodology","Study design, sample, tools and data analysis"],["Results","Key findings, including a numeric/statistical summary"],["Conclusion & recommendations",""],["Keywords","3–5 terms, preferably using MeSH terms"]];
const PRES=[["Modes of presentation","Oral and Poster"],["Top 3 presentations","Cash prizes"],["Certificates","Awarded to all participants & presenters"],["CME points","For Pre-Conference Workshop participants and scientific-session presenters (oral or poster)"]];
const STEPS=["Register and upload your fee payment receipt. Abstract submission opens once the team approves your registration.","Submit your abstract through the website.","All submissions are peer-reviewed.","Notification of acceptance: by 14 Nov 2026.","If your abstract is selected, you will be sent a private payment link. Pay the PKR 500 printing and setup fee and upload your receipt there.","Final PowerPoint presentation / poster due: by 19 Nov 2026."];
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

<${Sec} t="Printing & setup fee" id="ab-fee"><div class="ab-fmt"><div class="ab-fc wide"><span class="ab-ico sm"><${Ic} n="file" size=${20}/></span><div><p class="ab-lbl dk">PKR ${ABS_FEE} per accepted abstract</p><p class="ab-txt">Covers printing and setup of your oral or poster presentation. There is nothing to pay when you submit. Only authors whose abstract is selected are sent a private link to a payment page for their own abstract, where they upload the transfer receipt.</p></div></div></div><//>

<${Sec} t="Authorship & presenting author policy" id="ab-pol">
<ul class="ab-pol">${POLICY.map(([t,d])=>h`<li key=${t}><span class="ab-ck"><${Ic} n="check" size=${16}/></span><p><b>${t}</b> — ${mark(d,/\b(ONE)\b/,"strong")}</p></li>`)}</ul>
<//>
</div>`};

/* ---------- Submission form: 4-step flow ---------- */
const LIM_WORDS=400,MAXA=10,DKEY="ares26_abstract_draft_v2:";
const STEP_NAMES=["Details","Authors","Abstract","Review"];
const ORD=["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth"];
const INIT={title:"",disc:DISC[0],cat:"Oral",Introduction:"",Methodology:"",Results:"",Conclusion:""};
const blankAu=()=>({n:"",e:"",a:""});
const wc=s=>{const t=(s||"").trim();return t?t.split(/\s+/).length:0};
const emailOk=v=>/^\S+@\S+\.\S+$/.test(v);
const lvl=(n,max)=>n>max?"lv-over":n>=max*0.9?"lv-warn":"lv-ok";
const grow=el=>{if(!el)return;el.style.height="auto";el.style.height=(el.scrollHeight+2)+"px"};
const STEP_KEYS=(au)=>({1:["title"],2:au.flatMap((_,i)=>["n"+i,"e"+i,"a"+i]),3:[...SECT,"total"]});

export default function Abstracts(P){
const{session,profile,go,refresh,ct}=P;const uid=session&&session.user&&session.user.id;
const[f,setF]=useState(INIT),[au,setAu]=useState([blankAu()]),[pres,setPres]=useState(0),[step,setStep]=useState(1),[touched,setT]=useState({}),
[file,setFile]=useState(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(null),
[loaded,setLoaded]=useState(false),[saved,setSaved]=useState("idle"),[restored,setRestored]=useState(false);
const hadDraft=useRef(false),topRef=useRef(null);

/* --- restore draft --- */
useEffect(()=>{if(!uid)return;let d=null;try{d=JSON.parse(localStorage.getItem(DKEY+uid)||"null")}catch(e){}
 if(d&&d.f){hadDraft.current=true;setF({...INIT,...d.f});setAu(Array.isArray(d.au)&&d.au.length?d.au:[blankAu()]);setPres(Number(d.pres)||0);setStep(Math.min(4,Math.max(1,Number(d.step)||1)));setRestored(true);setSaved("saved")}
 setLoaded(true)},[uid]);
/* --- prefill first author from profile (only when there is no draft) --- */
useEffect(()=>{if(!loaded||hadDraft.current||!profile)return;
 setAu(a=>a.length===1&&!a[0].n&&!a[0].e&&!a[0].a?[{n:((profile.first_name||"")+" "+(profile.last_name||"")).trim(),e:profile.email||(session&&session.user.email)||"",a:profile.institution||""}]:a)},[loaded,profile]);
/* --- debounced autosave --- */
const draftObj=()=>({f,au,pres,step,at:Date.now()});
const pf=profile?{n:((profile.first_name||"")+" "+(profile.last_name||"")).trim(),e:profile.email||(session&&session.user.email)||"",a:profile.institution||""}:{n:"",e:"",a:""};
const isBlank=()=>!f.title&&SECT.every(s=>!f[s])&&au.length===1&&au[0].n===pf.n&&au[0].e===pf.e&&au[0].a===pf.a;
const write=()=>{try{localStorage.setItem(DKEY+uid,JSON.stringify(draftObj()));setSaved("saved");return true}catch(e){setSaved("error");return false}};
useEffect(()=>{if(!loaded||!uid||done)return;setSaved(s=>s==="error"?s:"saving");const t=setTimeout(()=>{if(isBlank()){setSaved("idle");return}write()},700);return()=>clearTimeout(t)},[f,au,pres,step,loaded,done]);
/* --- auto-grow textareas --- */
useEffect(()=>{document.querySelectorAll(".af-ta").forEach(grow)},[step,loaded,done]);

/* --- validation --- */
const total=SECT.reduce((n,s)=>n+wc(f[s]),0);
const E={};
if(!f.title.trim())E.title="Enter a title for your abstract.";
au.forEach((x,i)=>{if(!x.n.trim())E["n"+i]="Enter the author’s full name.";if(!x.a.trim())E["a"+i]="Enter the author’s affiliation.";const em=x.e.trim();
 if(i===0&&!em)E["e"+i]="Enter the first author’s email.";else if(em&&!emailOk(em))E["e"+i]="Enter a valid email, like name@example.com."});
SECT.forEach(s=>{if(!wc(f[s]))E[s]="Please complete this section."});
if(total>LIM_WORDS)E.total="Your abstract is "+(total-LIM_WORDS)+" word"+(total-LIM_WORDS===1?"":"s")+" over the "+LIM_WORDS+"-word limit. Shorten it to continue.";
const keysFor=n=>STEP_KEYS(au)[n]||[];
const stepBad=n=>keysFor(n).some(k=>E[k]);
const touch=keys=>setT(t=>{const x={...t};keys.forEach(k=>x[k]=true);return x});
const blur=k=>()=>setT(t=>t[k]?t:{...t,[k]:true});
const focusKey=k=>setTimeout(()=>{const el=document.getElementById("af-"+(k==="total"?"Introduction":k));if(el){el.focus();el.scrollIntoView({block:"center",behavior:"smooth"})}},60);
const toTop=()=>setTimeout(()=>{const el=topRef.current;if(el){el.scrollIntoView({behavior:"smooth",block:"start"});const hd=el.querySelector("[data-stephead]");if(hd)hd.focus({preventScroll:true})}},40);
const goStep=n=>{setErr("");setStep(n);toTop()};
const next=()=>{const ks=keysFor(step);touch(ks);const bad=ks.find(k=>E[k]);if(bad){setErr("");return focusKey(bad)}goStep(step+1)};

const setV=k=>e=>setF(x=>({...x,[k]:e.target.value}));
const setTa=k=>e=>{grow(e.target);const v=e.target.value;setF(x=>({...x,[k]:v}))};
const setA=(i,k)=>e=>{const v=e.target.value;setAu(a=>a.map((x,j)=>j===i?{...x,[k]:v}:x))};
const addAu=()=>{if(au.length>=MAXA)return;setAu([...au,blankAu()]);focusKey("n"+au.length)};
const rmAu=i=>{setAu(au.filter((_,j)=>j!==i));setPres(p=>p===i?0:p>i?p-1:p);setT(t=>Object.fromEntries(Object.entries(t).filter(([k])=>!/^[nea]\d+$/.test(k))))};
const pickFile=e=>{const x=e.target.files[0];if(x&&x.size>MAX_FILE){setErr("That file is larger than 5 MB. Choose a smaller one.");e.target.value="";setFile(null)}else{setErr("");setFile(x||null)}};
const saveNow=()=>{if(write())setSaved("saved")};

/* --- submit --- */
const submit=async()=>{
 if(busy)return;
 if(!profile||profile.status!=="Approved"){setErr("Your registration must be approved before you can submit an abstract.");return}
 const badStep=[1,2,3].find(stepBad);
 if(badStep){touch([1,2,3].flatMap(keysFor));setErr("Some required details are missing or need fixing. We’ve taken you to the first one.");setStep(badStep);toTop();const k=keysFor(badStep).find(k=>E[k]);if(k)focusKey(k);return}
 setErr("");setBusy(true);
 try{const path=file?await upload("abstract-files",session.user.id,file):null;
  const A=au.map((x,i)=>({name:x.n.trim(),email:x.e.trim(),affiliation:x.a.trim(),presenting:i===pres}));
  const{data,error}=await sb.from("abstracts").insert({user_id:session.user.id,title:f.title.trim(),discipline:f.disc,category:f.cat,body:{...Object.fromEntries(SECT.map(s=>[s,f[s].trim()])),authors:A},file_path:path,status:"Submitted"}).select("id,ref_no").single();
  if(error)throw error;
  try{localStorage.removeItem(DKEY+session.user.id)}catch(e){}
  const ref=data&&data.ref_no?absRef(data.ref_no):"ARES26-ABS-"+String(data&&data.id||Date.now()).replace(/-/g,"").slice(0,8).toUpperCase();
  setDone({ref,title:f.title.trim(),cat:f.cat,disc:f.disc,words:total,authors:A,fileName:file?file.name:""});
  setBusy(false);toTop();try{await refresh()}catch(e){}return}
 catch(e){setErr(/row-level security|policy/i.test((e&&e.message)||"")?"Only approved registrations can submit an abstract. Check your status on your dashboard.":(e&&e.message)||"Submission failed. Check your connection and try again. Your draft is still saved.")}
 setBusy(false)};
const again=()=>{setDone(null);setF(INIT);setAu([{n:((profile&&profile.first_name)||"")+" "+((profile&&profile.last_name)||""),e:(profile&&profile.email)||"",a:(profile&&profile.institution)||""}].map(x=>({...x,n:x.n.trim()})));setPres(0);setFile(null);setT({});setErr("");setStep(1);hadDraft.current=false;setRestored(false);setSaved("idle");toTop()};

/* --- field helper --- */
const F=(k,label,o,ctl)=>{o=o||{};const er=touched[k]&&E[k];
 const dd=[o.hint&&"af-h-"+k,er&&"af-e-"+k,o.cnt&&"af-c-"+k].filter(Boolean).join(" ");
 return h`<div class=${"af-f"+(er?" bad":"")} key=${k}><label htmlFor=${"af-"+k}>${label}${o.req&&h`<span class="af-req" aria-hidden="true"> *</span>`}${o.req&&h`<span class="sr"> (required)</span>`}</label>
${ctl({id:"af-"+k,"aria-invalid":er?"true":"false","aria-describedby":dd||undefined,onBlur:blur(k)})}
${o.hint&&h`<p class="af-hint" id=${"af-h-"+k}>${o.hint}</p>`}${o.cnt}
${er&&h`<p class="af-err" id=${"af-e-"+k} role="alert"><${Ic} n="alert" size=${15}/><span>${E[k]}</span></p>`}</div>`};
const wordCnt=k=>h`<p class=${"af-cnt "+lvl(total,LIM_WORDS)} id=${"af-c-"+k}><span>${wc(f[k])} word${wc(f[k])===1?"":"s"}</span></p>`;

/* --- deadline banner --- */
const de=(ct.dates.find(([,t])=>/abstract.*deadline/i.test(t))||[]);const dl=de[0]||"",iso=de[2];
const days=iso?Math.ceil((new Date(iso)-new Date())/864e5):null;
const dlc=days===null?"lv-ok":days<0?"lv-over":days<=3?"lv-warn":"lv-ok";
const banner=dl?h`<div class=${"af-dl "+dlc} role="status"><span class="af-dl-i"><${Ic} n="clock" size=${22}/></span><div><b>Abstract deadline: ${dl}${iso?" "+iso.slice(0,4):""}</b><span>${days===null?"":days<0?"The deadline has passed.":days===0?"Last day to submit — closes tonight.":days===1?"1 day remaining":days+" days remaining"}</span></div></div>`:null;

const savedTxt=saved==="saving"?"Saving…":saved==="saved"?"Draft saved":saved==="error"?"Couldn’t save draft (storage blocked)":"";
/* --- only people with an Approved (verified, fee-paid) registration may submit --- */
let gate=null;
if(session){
 if(!profile)gate={msg:"We could not load your registration. Open your dashboard and try again.",btn:"Go to dashboard",to:"dashboard"};
 else if(profile.status==="Rejected")gate={msg:"Your payment was rejected. Upload a new proof on your dashboard. You can submit an abstract once your registration is approved.",btn:"Go to dashboard",to:"dashboard"};
 else if(profile.status!=="Approved")gate={msg:profile.proof_path?"Your registration is awaiting approval. You can submit an abstract as soon as it is approved.":"Complete your registration payment first. Abstract submission opens once your registration is approved.",btn:"Go to dashboard",to:"dashboard"};
}
let body;
if(session===undefined)body=h`<div class="w sec"><p class="mut">Loading...</p></div>`;
else if(!session)body=h`<div class="auth"><h2>Abstract submission</h2><p class="sub">You need to be logged in to submit an abstract.</p><div class="panel"><button class="btn block" onClick=${()=>go("login")}>Log in</button></div></div>`;
else if(profile===undefined)body=h`<div class="w sec"><p class="mut">Loading...</p></div>`;
else if(gate&&!done)body=h`<div class="auth"><div class="wk-banner" role="status"><span class="ab-ico sm"><${Ic} n="lock"/></span><div class="wk-bn-body"><h2>Account verification required</h2><p>Your account must be verified and your registration fee approved before you can submit an abstract. ${gate.msg}</p><button class="btn s" onClick=${()=>go(gate.to)}>${gate.btn}</button></div></div></div>`;
else if(done)body=h`<div class="af af-wrap" ref=${topRef}><div class="af-ok"><span class="af-ok-i"><${Ic} n="check" size=${34}/></span><h2 data-stephead tabIndex="-1">Abstract submitted</h2><p class="af-lead">Thank you. Your abstract has been received and will be peer-reviewed. Track its status on your dashboard. If it is selected, you will be sent a private link to pay the PKR ${ABS_FEE} printing and setup fee.</p>
<div class="af-ref"><span>Reference number</span><b>${done.ref}</b><small>Please keep this for your records.</small></div>
<dl class="af-sum"><div><dt>Title</dt><dd>${done.title}</dd></div><div><dt>Category</dt><dd>${done.cat} · ${done.disc}</dd></div><div><dt>Authors</dt><dd>${done.authors.map(a=>a.name+(a.presenting?" (presenting)":"")).join(", ")}</dd></div><div><dt>Length</dt><dd>${done.words} words</dd></div>${done.fileName&&h`<div><dt>Attachment</dt><dd>${done.fileName}</dd></div>`}</dl>
<div class="af-ok-btns"><button class="btn block" onClick=${()=>go("dashboard")}>Go to dashboard</button><button class="btn o block" onClick=${again}>Submit another abstract</button></div></div></div>`;
else{
const stepHead=(n,t,sub)=>h`<div class="af-sh"><h2 data-stephead tabIndex="-1">${t}</h2><p>${sub}</p></div>`;
const edit=n=>h`<button type="button" class="af-edit" onClick=${()=>goStep(n)}>Edit</button>`;
let content;
if(step===1)content=h`<div>${stepHead(1,"Abstract details","Tell us what your work is about.")}
${F("title","Title",{req:1,hint:"Concise and reflective of your research."},p=>h`<input ...${p} type="text" value=${f.title} placeholder="XYZ" onInput=${setV("title")} enterKeyHint="next"/>`)}
${F("disc","Discipline",{req:1},p=>h`<select ...${p} value=${f.disc} onChange=${setV("disc")}>${DISC.map(d=>h`<option key=${d}>${d}</option>`)}</select>`)}
<fieldset class="af-fs"><legend>Category <span class="af-req" aria-hidden="true">*</span><span class="sr"> (required)</span></legend>
<div class="af-radios">${[["Oral","Presentation"],["Poster","Printed display"]].map(([v,d])=>h`<label class=${"af-rad"+(f.cat===v?" on":"")} key=${v}><input type="radio" name="cat" value=${v} checked=${f.cat===v} onChange=${setV("cat")}/><span><b>${v}</b><small>${d}</small></span></label>`)}</div>
<p class="af-hint">Oral = presentation, Poster = printed display.</p></fieldset></div>`;
if(step===2)content=h`<div>${stepHead(2,"Authors","List everyone who contributed, in order. Choose one presenting author.")}
${au.map((x,i)=>h`<fieldset class=${"af-au"+(pres===i?" pres":"")} key=${i}><legend>${(ORD[i]||"Author "+(i+1))+" author"}</legend>
${i>0&&h`<button type="button" class="af-rm" onClick=${()=>rmAu(i)} aria-label=${"Remove "+(ORD[i]||"author "+(i+1))+" author"}>Remove</button>`}
${F("n"+i,"Name",{req:1},p=>h`<input ...${p} type="text" value=${x.n} placeholder="XYZ" autoComplete=${i===0?"name":"off"} onInput=${setA(i,"n")}/>`)}
${F("e"+i,"Email",{req:i===0,hint:i>0?"Optional for co-authors.":""},p=>h`<input ...${p} type="email" inputMode="email" value=${x.e} placeholder="XYZ" autoComplete=${i===0?"email":"off"} autoCapitalize="none" onInput=${setA(i,"e")}/>`)}
${F("a"+i,"Affiliation",{req:1},p=>h`<input ...${p} type="text" value=${x.a} placeholder="XYZ" autoComplete=${i===0?"organization":"off"} onInput=${setA(i,"a")}/>`)}
<label class=${"af-pick"+(pres===i?" on":"")}><input type="radio" name="presenter" checked=${pres===i} onChange=${()=>setPres(i)}/><span>Presenting author</span></label></fieldset>`)}
${au.length<MAXA?h`<button type="button" class="btn o block af-add" onClick=${addAu}>+ Add another author</button>`:h`<p class="af-hint">You’ve reached the maximum of ${MAXA} authors.</p>`}</div>`;
if(step===3)content=h`<div>${stepHead(3,"Abstract","Maximum "+LIM_WORDS+" words in total across all four sections.")}
<div class=${"af-meter "+lvl(total,LIM_WORDS)} aria-live="polite"><div class="af-meter-bar"><i style=${"width:"+Math.min(100,total/LIM_WORDS*100)+"%"}></i></div><span>${total} / ${LIM_WORDS} words</span></div>
${touched.total&&E.total&&h`<p class="af-err" role="alert"><${Ic} n="alert" size=${15}/><span>${E.total}</span></p>`}
${SECT.map(k=>F(k,k,{req:1,hint:{Introduction:"Background, rationale and objectives.",Methodology:"Study design, sample, tools and data analysis.",Results:"Key findings, including a numeric or statistical summary.",Conclusion:"Conclusions and recommendations."}[k],cnt:wordCnt(k)},p=>h`<textarea ...${p} class="af-ta" rows="4" placeholder="XYZ" value=${f[k]} onInput=${setTa(k)}/>`))}
${F("file","Supplementary file (optional)",{hint:"PDF, DOCX or image, up to 5 MB. Attachments are not kept in drafts."},p=>h`<input ...${p} type="file" accept=".pdf,.docx,image/*" onChange=${pickFile}/>`)}</div>`;
if(step===4)content=h`<div>${stepHead(4,"Review & submit","Check everything below. You can edit any section.")}
<section class="af-rv"><div class="af-rv-h"><h3>Details</h3>${edit(1)}</div><dl class="af-sum"><div><dt>Title</dt><dd>${f.title}</dd></div><div><dt>Discipline</dt><dd>${f.disc}</dd></div><div><dt>Category</dt><dd>${f.cat}</dd></div></dl></section>
<section class="af-rv"><div class="af-rv-h"><h3>Authors</h3>${edit(2)}</div><ol class="af-rv-au">${au.map((x,i)=>h`<li key=${i}><b>${x.n}</b>${pres===i&&h`<span class="af-tag">Presenting</span>`}<span>${x.e||"No email"}</span><span>${x.a}</span></li>`)}</ol></section>
<section class="af-rv"><div class="af-rv-h"><h3>Abstract <small class=${lvl(total,LIM_WORDS)}>${total} / ${LIM_WORDS} words</small></h3>${edit(3)}</div><dl class="af-sum">${SECT.map(k=>h`<div key=${k}><dt>${k} <small>(${wc(f[k])} words)</small></dt><dd class="af-pre">${f[k]}</dd></div>`)}<div><dt>Attachment</dt><dd>${file?file.name:"None"}</dd></div></dl></section></div>`;

body=h`<div class="af af-wrap" ref=${topRef}>
${banner}
<div class="af-top"><h1 class="af-title">Abstract submission</h1><p class=${"af-saved "+saved} role="status" aria-live="polite">${savedTxt&&h`<${Ic} n=${saved==="error"?"alert":"check"} size=${14}/>`}${savedTxt}</p></div>
<ol class="af-steps" aria-label="Progress">${STEP_NAMES.map((n,i)=>h`<li key=${n} class=${(i+1===step?"cur ":"")+(i+1<step?"done":"")} aria-current=${i+1===step?"step":undefined}><button type="button" disabled=${i+1>step} onClick=${()=>goStep(i+1)}><span class="af-dot">${i+1<step?h`<${Ic} n="check" size=${14}/>`:i+1}</span><span class="af-sn">${n}</span></button></li>`)}</ol>
<div class="af-bar" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow=${step} aria-label=${"Step "+step+" of 4: "+STEP_NAMES[step-1]}><i style=${"width:"+(step/4*100)+"%"}></i></div>
${restored&&h`<div class="af-note" role="status"><span>We restored your saved draft.</span><button type="button" onClick=${()=>setRestored(false)} aria-label="Dismiss">Dismiss</button></div>`}
<div class="af-card">${content}${err&&h`<div class="err" role="alert" style="margin-top:14px">${err}</div>`}</div>
<div class="af-actions"><div class="af-actions-in">
${step>1&&h`<button type="button" class="btn o af-b-back" onClick=${()=>goStep(step-1)} disabled=${busy}>Back</button>`}
<button type="button" class="btn o af-b-save" onClick=${saveNow} disabled=${busy}>Save draft</button>
${step<4?h`<button type="button" class="btn af-b-next" onClick=${next}>Next</button>`:h`<button type="button" class="btn af-b-next" onClick=${submit} disabled=${busy} aria-busy=${busy}>${busy?h`<span class="af-spin" aria-hidden="true"></span>Submitting…`:"Submit abstract"}</button>`}
</div></div></div>`}

return h`<div>
<section class="sec w ab">
<${Guidelines} ct=${ct}/>
</section>
<div id="abs-form" class="ab-form">${body}</div>
</div>`}
