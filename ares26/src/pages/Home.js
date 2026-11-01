import HERO from '../assets/hero-building.webp';
import {useState,useEffect,h,LOGO,BANK,DISC,SECT,DEF,left,NAV,Faq,Ic} from '../shared.js';

const Head=({t,id,sub})=>h`<div class="hm-head"><h2 class="ab-h" id=${id}>${t}</h2>${sub&&h`<p class="mut">${sub}</p>`}</div>`;
const initials=n=>n.split(" ").map(x=>x[0]).join("").slice(0,2);
const CORE=[
["Director",["Ahmad Rashid"]],
["Sub-Directors",["Muhammad Anas Sandhu","Mahnoor Tahir"]],
["Chief Secretary",["Muhammad Taqi Jafar"]],
["Secretary Scientific Committee",["Muhammad Bilal"]],
["Secretaries Event Management",["Mudassir Kazmi","Areej Batool Malik"]],
["Secretaries Logistic & Ambassadors",["Muhammad Sameer","Laiba Saleem"]],
["General Secretaries",["Sadeema Chaudhary","Ayesha Rehman"]],
["Joint Secretaries",["Abdul Rehman","Noor-ul-Ain"]],
["Additional Secretaries",["Umer Aziz","Alizay Umer"]]];
const coreInit=n=>{const w=n.split(/[\s-]+/).filter(Boolean);return(w.length>1?w[0][0]+w[w.length-1][0]:w[0][0]).toUpperCase()};
const TP={
atom:[["ellipse",{cx:12,cy:12,rx:10,ry:4}],["ellipse",{cx:12,cy:12,rx:10,ry:4,transform:"rotate(60 12 12)"}],["ellipse",{cx:12,cy:12,rx:10,ry:4,transform:"rotate(120 12 12)"}],["circle",{cx:12,cy:12,r:1.4,fill:"currentColor"}]],
dna:[["path",{d:"M8 3c0 5 8 5 8 9s-8 4-8 9"}],["path",{d:"M16 3c0 5-8 5-8 9s8 4 8 9"}],["path",{d:"M9.3 6.5h5.4M9.3 17.5h5.4M8.6 12h6.8"}]],
chip:[["rect",{x:6,y:6,width:12,height:12,rx:2}],["path",{d:"M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"}],["text",{x:12,y:15,textAnchor:"middle",fontSize:7,fontWeight:700,fill:"currentColor",stroke:"none"},"AI"]],
steth:[["path",{d:"M5 3H4v6a5 5 0 0 0 10 0V3h-1"}],["path",{d:"M9 14v1a5 5 0 0 0 10 0v-2"}],["circle",{cx:19,cy:11,r:2}]],
scalpel:[["path",{d:"M20.5 3.5c-4 1-9 5-12 10l2 2c5-3 9-8 10-12z"}],["path",{d:"M8.5 13.5L4 20l6.5-4.5"}]]};
const TI=({n})=>h`<svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${TP[n].map(([t,a,c],i)=>h`<${t} key=${i} ...${a}>${c}<//>`)}</svg>`;

export default function Home(P){const{ct,go}=P;return h`<div>
<section class="hero"><div class="hero-bg" style=${"background-image:url(\""+HERO+"\")"} aria-hidden="true"></div><div class="w hero-in"><div class="hero-txt">
<p class="hero-eyebrow"><span>ARES’26</span><i aria-hidden="true"></i><span>SARGODHA MEDICAL COLLEGE</span></p>
<h1>ARES’26: Academic Research & Excellence Symposium</h1>
<p class="hero-lead">Sargodha Medical College’s first international research conference. Present your work, learn hands-on, and meet researchers shaping medicine.</p>
<p class="hero-when"><b>Third week of November 2026</b> · In person at Sargodha Medical College</p>
<div class="hero-cta"><button class="btn" onClick=${()=>go("register")}>Register now</button> <button class="btn o" onClick=${()=>go("abstracts")}>Submit abstract</button></div></div>
<div class="lg"><img src=${LOGO} alt="ARES’26 logo"/></div></div></section>

<section class="sec w" aria-labelledby="hm-soon"><${Head} t="What’s coming" id="hm-soon"/><div class="g c3">
<div class="card feat"><span class="ab-ico"><${Ic} n="users"/></span><h3>Conference registration</h3><p class="mut">Open to students, faculty and researchers. Includes conference access and materials. Fee announced with opening of registration.</p><button class="btn o s" onClick=${()=>go("register")}>Register</button></div>
<div class="card feat"><span class="ab-ico"><${Ic} n="file"/></span><h3>Abstract submission</h3><p class="mut">Submit a structured abstract for oral or poster presentation. Peer reviewed; decisions appear on your dashboard.</p><button class="btn o s" onClick=${()=>go("abstracts")}>Submit</button></div>
<div class="card feat"><span class="ab-ico"><${Ic} n="tool"/></span><h3>Workshops</h3><p class="mut">Hands-on sessions led by invited faculty. Capacity is limited. Schedule coming soon.</p><button class="btn o s" onClick=${()=>go("workshops")}>See status</button></div></div></section>

<section class="sec w" style="padding-top:0" aria-labelledby="hm-cal"><${Head} t="Mark your calendar" id="hm-cal"/><div class="g c5">${ct.dates.filter(([,,iso])=>left(iso)!=="PASSED").map(([d,t,iso],i)=>h`<div class="card k" key=${t}><div class="dt"><b>${d}</b><span>${left(iso)}</span></div><h3>${t}</h3></div>`)}</div></section>

<section class="sec w" style="padding-top:0" aria-labelledby="hm-theme"><${Head} t="Theme" id="hm-theme"/>
<div class="th-panel"><h3 class="th-tab">Abstract Domains</h3><div class="th-doms">
<div class="th-dom"><span class="th-ics"><${TI} n="atom"/><${TI} n="dna"/></span><div><h4>Scientific Research</h4><p>Clinical, Translational and Biomedical Disciplines</p></div></div>
<div class="th-dom"><span class="th-ics"><${TI} n="chip"/></span><div><h4>AI-Based Projects</h4><p>ML & data-driven healthcare models</p></div></div></div></div>
<div class="th-panel"><h3 class="th-tab">Subthemes</h3><div class="th-subs">
<div class="th-sub"><${TI} n="steth"/><span>Medicine</span></div>
<div class="th-sub"><${TI} n="scalpel"/><span>Surgery</span></div>
<div class="th-sub"><${Ic} n="users" size=${34}/><span>Public Health</span></div></div></div></section>

<section class="q"><div class="w"><p>“Research is to see what everybody else has seen, and to think what nobody else has thought.”</p><span class="mut">Albert Szent-Györgyi</span></div></section>

<section class="sec w" aria-labelledby="hm-core"><${Head} t="Core Team – ARES’26" id="hm-core"/>${CORE.map(([role,names])=>h`<div class="core-grp" key=${role}><h3 class="core-role">${role}</h3><div class="core-row">${names.map(n=>h`<div class="card tm" key=${n}><div class="av">${coreInit(n)}</div><b>${n}</b></div>`)}</div></div>`)}<div class="core-more"><button class="btn" onClick=${()=>go("teams")}>See Full Team</button></div></section>

<section class="sec w" aria-labelledby="hm-team"><${Head} t="Our team" id="hm-team"/><div class="g c5 team">${ct.team.map(([n,r],i)=>h`<div class="card tm" key=${i}><div class="av">${initials(n)}</div><b>${n}</b><div class="mut">${r}</div></div>`)}</div></section>

<section class="sec w" style="padding-top:0" aria-labelledby="hm-faq"><${Head} t="FAQs" id="hm-faq"/><${Faq} ct=${ct}/></section></div>`}
