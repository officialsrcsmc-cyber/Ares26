import React,{useState,useEffect,useRef} from 'react';
import htm from 'htm';
import LOGO from './assets/logo-256.webp';
export{useState,useEffect,useRef,LOGO};
const fixProps=p=>{if(!p)return p;p={...p};if(typeof p.style==="string"){p.style=Object.fromEntries(p.style.split(";").filter(x=>x.includes(":")).map(x=>{const i=x.indexOf(":");return[x.slice(0,i).trim().replace(/-([a-z])/g,(m,c)=>c.toUpperCase()),x.slice(i+1).trim()]}))}if(p.class!=null){p.className=p.class;delete p.class}return p};
export const h=htm.bind((t,p,...c)=>React.createElement(t,fixProps(p),...c));
export const BANK="Bank, account title and account number will be announced by the organizing committee.";
export const DISC=["Medicine & Allied","Surgery & Allied","Pediatrics","Obstetrics & Gynecology","Public Health","Psychiatry & Psychology","Basic Medical Sciences","Medical Education","AI in Healthcare"];
export const SECT=["Introduction","Methodology","Results","Conclusion"];
export const DEF={dates:[["Nov 10","Registration opens","2026-11-10"],["Nov 14","Early bird deadline","2026-11-14"],["Nov 16","Abstract submission closes (TBC)","2026-11-16"],["Nov 20","Workshops (TBC)","2026-11-20"],["Nov 21","ARES’26 main event","2026-11-21"]],
team:Array.from({length:10},(_,i)=>["Team Member "+(i+1),"Role / Title"]),
faqs:[["Who can attend?","Medical and allied health students, faculty and researchers. SMC students and external participants may register."],["Is it in person?","Yes. ARES’26 takes place on campus at Sargodha Medical College."],["How do I pay?","Pay by bank transfer, then upload your proof in step 3 of registration. Your status shows as Pending until the team verifies it."],["What can I submit?","Original research, case reports and reviews, as an oral or poster abstract. Use the structured format on the Abstracts page."],["Will there be workshops?","Yes. Details and enrolment will be posted on the Workshop page."]]};
export const left=iso=>{const d=Math.ceil((new Date(iso)-new Date())/864e5);return d>1?"IN "+d+" DAYS":d==1?"TOMORROW":d==0?"TODAY":"PASSED"};
export const NAV=[["home","Home"],["register","Registration"],["abstracts","Abstracts"],["workshops","Workshop"],["faqs","FAQs"],["dashboard","Dashboard"]];
export const Faq=({ct})=>h`<div>${ct.faqs.map(([q,a])=>h`<details key=${q}><summary>${q}</summary><p>${a}</p></details>`)}</div>`;


// ---------- production helpers ----------
export const LOGO_SIZE=256;
// Analytics: no-op unless the visitor consented (see /consent.js). Never pass personal data.
export const track=(n,p)=>{try{window.srcTrack&&window.srcTrack(n,p)}catch(e){}};
export const Spin=()=>h`<i class="spin" aria-hidden="true"/>`;
export const Skel=({w="100%",ht=16,r=8})=>h`<div class="skel" style=${{width:w,height:ht,borderRadius:r}} aria-hidden="true"/>`;
export const PageSkel=({narrow})=>h`<div class=${"w sec"} style=${{maxWidth:narrow?560:undefined}} role="status" aria-busy="true"><span class="sr">Loading…</span>
<${Skel} ht=${34} w="45%"/><div style=${{height:14}}/><${Skel} ht=${16}/><div style=${{height:8}}/><${Skel} ht=${16} w="80%"/><div style=${{height:24}}/><${Skel} ht=${150} r=${14}/></div>`;
// Wraps a promise so a hung network request ends with a clear message instead of spinning forever
export const withTimeout=(p,ms=30000)=>Promise.race([p,new Promise((_,rj)=>setTimeout(()=>rj(Object.assign(new Error("timeout"),{timeout:true})),ms))]);
// Turns library / network errors into messages a participant can act on
export const friendly=(e,fallback="Something went wrong. Please try again.")=>{
 const m=String((e&&e.message)||e||"");
 if(e&&e.timeout)return "This is taking longer than expected. Check your connection and try again.";
 if(typeof navigator!=="undefined"&&navigator.onLine===false)return "You appear to be offline. Reconnect and try again.";
 if(/failed to fetch|networkerror|load failed|network request/i.test(m))return "Network problem. Check your connection and try again.";
 if(/rate limit|too many|over_email_send_rate/i.test(m))return "Too many attempts. Please wait a few minutes and try again.";
 if(/already registered|already been registered/i.test(m))return "This email is already registered. Log in instead.";
 if(/mime type|not supported|invalid.*file/i.test(m))return "That file type isn’t accepted. Use a JPG, PNG, WebP or PDF.";
 if(/exceeded the maximum|too large|payload/i.test(m))return "That file is larger than 5 MB.";
 if(/row-level security|permission denied|not authorized|jwt/i.test(m))return "You don’t have permission to do that. Log in again and retry.";
 if(/password/i.test(m)&&/(least|weak|short)/i.test(m))return "Use a stronger password of at least 8 characters.";
 try{console.error(e)}catch(x){}
 return fallback};
// Submit guard: ignores a second click while the first is still running
export function useSubmit(){const[busy,setBusy]=useState(false),r=useRef(false);
 const run=async fn=>{if(r.current)return;r.current=true;setBusy(true);try{return await fn()}finally{r.current=false;setBusy(false)}};return[busy,run]}
export const focusFirstError=()=>setTimeout(()=>{const x=document.querySelector('[aria-invalid="true"]')||document.querySelector('.err');if(x&&x.focus){x.focus()}},0);
// Text input with label, required marker and inline error
export const num=v=>{v=String(v).replace(/[^\d.]/g,"");const i=v.indexOf(".");return i<0?v:v.slice(0,i+1)+v.slice(i+1).replace(/\./g,"")};
export const phoneClean=v=>String(v).replace(/[^\d+\-\s()]/g,"");
export const Inp=({l,k,f,set,fe={},t="text",ac,req=true,clean,...r})=>h`<label>${l}${req?h`<span class="rq" aria-hidden="true"> *</span>`:""}
<input type=${t} value=${f[k]||""} onInput=${clean?(e=>{e.target.value=clean(e.target.value);set(k)(e)}):set(k)} autoComplete=${ac} aria-required=${req?"true":undefined} aria-invalid=${fe[k]?"true":"false"} aria-describedby=${fe[k]?"e-"+k:undefined} ...${r}/>
${fe[k]&&h`<span class="fe" id=${"e-"+k} role="alert">${fe[k]}</span>`}</label>`;
// One-shot flag so the thank-you page only shows right after a real successful submission
export const THANKS_KEY="srcThanks";
export const OKTYPES=["image/jpeg","image/png","image/webp","image/heic","application/pdf"];
