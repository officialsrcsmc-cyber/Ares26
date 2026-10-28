import React,{useState,useEffect} from 'react';
import htm from 'htm';
import LOGO from './assets/logo.jpg';
export{useState,useEffect,LOGO};
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

