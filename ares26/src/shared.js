import React,{useState,useEffect} from 'react';
import htm from 'htm';
import LOGO from './assets/logo.webp';
import LOGO_LIGHT from './assets/logo-onwhite.webp';
export{useState,useEffect,LOGO,LOGO_LIGHT};
const fixProps=p=>{if(!p)return p;p={...p};if(typeof p.style==="string"){p.style=Object.fromEntries(p.style.split(";").filter(x=>x.includes(":")).map(x=>{const i=x.indexOf(":");return[x.slice(0,i).trim().replace(/-([a-z])/g,(m,c)=>c.toUpperCase()),x.slice(i+1).trim()]}))}if(p.class!=null){p.className=p.class;delete p.class}return p};
export const h=htm.bind((t,p,...c)=>React.createElement(t,fixProps(p),...c));
export const BANK="Bank, account title and account number will be announced by the organizing committee.";
export const DISC=["Medicine & Allied","Surgery & Allied","Pediatrics","Obstetrics & Gynecology","Public Health","Psychiatry & Psychology","Basic Medical Sciences","Medical Education","AI in Healthcare"];
export const SECT=["Introduction","Methodology","Results","Conclusion"];
export const DEF={dates:[["Oct 31","Registration opens","2026-10-31"],["Oct 31","Abstract submission opens","2026-10-31"],["Nov 9","Registration closes","2026-11-09"],["Nov 9","Abstract submission deadline","2026-11-09"],["Nov 14","Notification of acceptance","2026-11-14"],["Nov 19","Final PowerPoint / poster due","2026-11-19"],["Nov 21","ARES’26 main event","2026-11-21"]],
team:Array.from({length:10},(_,i)=>["Team Member "+(i+1),"Role / Title"]),
faqs:[["Who can attend?","Medical and allied health students, faculty and researchers. SMC students and external participants may register."],["Is it in person?","Yes. ARES’26 takes place on campus at Sargodha Medical College."],["How do I pay?","Pay by bank transfer, then upload your proof in step 3 of registration. Your status shows as Pending until the team verifies it."],["What can I submit?","Original research, case reports and reviews, as an oral or poster abstract. Use the structured format on the Abstracts page."],["Will there be workshops?","Yes. Details and enrolment will be posted on the Workshop page."]]};
export const left=iso=>{const d=Math.ceil((new Date(iso)-new Date())/864e5);return d>1?"IN "+d+" DAYS":d==1?"TOMORROW":d==0?"TODAY":"PASSED"};
export const NAV=[["home","Home"],["register","Registration"],["abstracts","Abstracts"],["workshops","Workshop"],["faqs","FAQs"],["dashboard","Dashboard"]];
export const Faq=({ct})=>h`<div class="ab-accs">${ct.faqs.map(([q,a],i)=>h`<${Acc} key=${q} t=${q} d=${a} i=${"faq"+i}/>`)}</div>`;


export const num=v=>{v=String(v).replace(/[^\d.]/g,"");const i=v.indexOf(".");return i<0?v:v.slice(0,i+1)+v.slice(i+1).replace(/\./g,"")};
export const phoneClean=v=>String(v).replace(/[^\d+\-\s()]/g,"");


/* ---------- Shared UI: icons + accordion ---------- */
export const IC={
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
down:"M12 5v14|M6 13l6 6 6-6",
user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8z",
users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8z|M22 21v-2a4 4 0 0 0-3-3.9|M16 3.1a4 4 0 0 1 0 7.8",
tool:"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z",
cpu:"M6 6h12v12H6z|M9 2v4|M15 2v4|M9 18v4|M15 18v4|M2 9h4|M2 15h4|M18 9h4|M18 15h4",
heart:"M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z",
mail:"M3 5h18v14H3z|M3 7l9 6 9-6",
phone:"M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
arrow:"M5 12h14|M13 6l6 6-6 6",
lock:"M5 11h14v10H5z|M8 11V7a4 4 0 0 1 8 0v4"};
export const Ic=({n,size=22})=>h`<svg viewBox="0 0 24 24" width=${size} height=${size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">${IC[n].split("|").map((d,i)=>h`<path key=${i} d=${d}/>`)}</svg>`;


export const Acc=({t,d,i})=>{const[o,setO]=useState(false),id="ab-acc-"+i;
return h`<div class=${"ab-acc"+(o?" open":"")}>
<h3 class="ab-acc-h"><button type="button" class="ab-acc-b" id=${id+"-b"} aria-expanded=${o} aria-controls=${id} onClick=${()=>setO(!o)}><span>${t}</span><span class="ab-chev"><${Ic} n="chev" size=${18}/></span></button></h3>
<div class="ab-acc-p" id=${id} role="region" aria-labelledby=${id+"-b"}><div><p>${d}</p></div></div></div>`};

