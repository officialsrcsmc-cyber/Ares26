import {useState,useEffect,h,LOGO,LOGO_LIGHT,DEF,NAV,Faq,Ic,withWkIds,absFeeRef} from './shared.js';
import {sb} from './supabase.js';

import Home from './pages/Home.js';
import Registration from './pages/Registration.js';
import Login from './pages/Login.js';
import Reset from './pages/Reset.js';
import Abstracts from './pages/Abstracts.js';
import Dashboard from './pages/Dashboard.js';
import Admin from './pages/Admin.js';
import Teams from './pages/Teams.js';
import Workshops from './pages/Workshops.js';
import AbstractFee from './pages/AbstractFee.js';

const Head=(e,t)=>h`<div class="ab-top"><p class="ab-eyebrow"><span>ARES’26</span><i aria-hidden="true"></i><span>${e}</span></p><h1 class="ab-title">${t}</h1></div>`;
const Txt=(t,b)=>()=>h`<div class="w sec ab txt">${Head("INFORMATION",t)}<div class="ab-note">${b.map(([a,c],i)=>h`<div key=${i} style="margin-bottom:14px">${a&&h`<h3 style="margin:0 0 4px;font-size:1.05rem">${a}</h3>`}<p>${c}</p></div>`)}</div></div>`;

const AdminGate=P=>{if(P.session===undefined||(P.session&&P.profile===undefined))return h`<div class="w sec"><p class="mut">Loading...</p></div>`;
 return P.profile&&P.profile.is_admin?h`<${Admin} ...${P}/>`:h`<div class="w sec ab nf"><p class="nf-code" aria-hidden="true">404</p><h1 class="ab-title">This page doesn’t exist</h1><p class="mut">The link may be broken or the page may have moved.</p><button class="btn" onClick=${()=>P.go("home")}>Go home</button></div>`};

const PAGES={home:Home,register:Registration,login:Login,reset:Reset,abstracts:Abstracts,teams:Teams,dashboard:Dashboard,"ares-admin":AdminGate,
faqs:P=>h`<div class="w sec ab">${Head("FREQUENTLY ASKED","FAQs")}<${Faq} ct=${P.ct}/></div>`,
workshops:Workshops,"abstract-fee":AbstractFee,
terms:Txt("Terms of use",[["Summary","By registering for ARES’26 or using this website you agree to give accurate information, keep your password private, upload only genuine payment proofs and files you have the right to share, and follow the Code of Conduct."],["Registration and fees","Registration is confirmed only after the organising team verifies your payment and marks it Approved. Fees are non-refundable once approved, except where you were charged in error or ARES’26 is cancelled, in which case fees are refunded less bank or wallet charges."],["Abstracts","You keep ownership of your work. By submitting, you allow SRC to review it and, if accepted, publish it with author credit in the programme, abstract book and on SRC channels."],["Full terms","The complete Terms & Conditions are at srcsmc.org/terms and the Privacy Policy is at srcsmc.org/privacy."]]),
conduct:Txt("Code of conduct",[["Our expectation","ARES’26 expects respectful, honest and inclusive conduct from every participant, online and on campus."],["Respect","Treat participants, speakers, volunteers and staff with courtesy. Harassment, discrimination, bullying, intimidation or offensive language of any kind is not tolerated."],["Academic integrity","Submit only original work that is yours or that you have permission to present. Plagiarism, fabricated data and misleading authorship are grounds for rejection or withdrawal of an abstract."],["Honesty","Give accurate information when registering and upload only genuine payment proofs."],["Venue and safety","Follow the instructions of organisers and Sargodha Medical College staff, respect campus rules and property, and do not record or share others’ work without permission."],["Reporting and consequences","Report concerns to official.srcsmc@gmail.com or to any organiser. Breaches may lead to a warning, removal from the event, or cancellation of registration or abstract acceptance, at the organisers’ discretion."]])};
const validContent=c=>c&&Array.isArray(c.dates)&&Array.isArray(c.team)&&Array.isArray(c.faqs);

function Setup(){return h`<div class="w sec" style="max-width:560px"><h2>Setup needed</h2><p class="mut">The site cannot find its Supabase settings. Copy <b>.env.example</b> to <b>.env</b>, fill in your project URL and anon key, then restart <b>npm run dev</b>. On a hosting service, add the same two variables in its environment settings and redeploy.</p></div>`}

export default function App(){
const[pg,setPg]=useState(()=>{const h=location.hash||"";if(/type=signup/.test(h))return"login";if(/type=recovery/.test(h))return"reset";const t=h.slice(1);if(absFeeRef(t))return"abstract-fee";return PAGES[t]?t:"home"}),[fref,setFref]=useState(()=>absFeeRef((location.hash||"").slice(1))),[menu,setMenu]=useState(false),
[session,setSession]=useState(undefined),[profile,setProfile]=useState(undefined),[abs,setA]=useState([]),[ct,setC]=useState(DEF),[enr,setEnr]=useState([]);

// private abstract fee link: #abstract-submission-<ref_no> (also works when pasted while the site is already open)
useEffect(()=>{const f=()=>{const r=absFeeRef((location.hash||"").slice(1));if(r){setFref(r);setPg("abstract-fee")}};window.addEventListener("hashchange",f);return()=>window.removeEventListener("hashchange",f)},[]);

// auth session
useEffect(()=>{if(!sb)return;
 sb.auth.getSession().then(({data})=>setSession(data.session||null));
 const{data:l}=sb.auth.onAuthStateChange((ev,s)=>{setSession(s||null);if(ev==="PASSWORD_RECOVERY")setPg("reset")});
 return()=>l.subscription.unsubscribe()},[]);

// public site content (dates, team, FAQs) edited by admins
useEffect(()=>{if(!sb)return;
 sb.from("site_content").select("data").eq("id",1).maybeSingle().then(({data})=>{if(data&&validContent(data.data))setC({...data.data,dates:DEF.dates,workshops:withWkIds(data.data.workshops)})})},[]);

// the signed-in person's profile and abstracts
const refresh=async()=>{
 if(!sb||!session){setProfile(session===undefined?undefined:null);setA([]);setEnr([]);return}
 const{data:p}=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();setProfile(p||null);
 const{data:a}=await sb.from("abstracts").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});setA(a||[]);
 const{data:w}=await sb.from("workshop_enrollments").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});setEnr(w||[])};
useEffect(()=>{refresh()},[session&&session.user.id]);

useEffect(()=>{if(!menu)return;const k=e=>{if(e.key==="Escape")setMenu(false)};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[menu]);
const go=p=>{const r=absFeeRef(p);if(r)setFref(r);setPg(r?"abstract-fee":p);setMenu(false);window.scrollTo(0,0);try{location.hash=p}catch(e){}};
const logout=async()=>{await sb.auth.signOut();setProfile(null);setA([]);setEnr([]);go("home")};
const P={go,sb,session,profile,refresh,logout,abs,ct,setC,enr,fref},Page=PAGES[pg]||Home;
const nav=(k,l,mob)=>h`<a key=${k} href=${"#"+k} class=${pg==k?"on":""} aria-current=${pg==k?"page":undefined} onClick=${e=>{e.preventDefault();go(k)}}>${l}</a>`;
const adm=profile&&profile.is_admin;
return h`<div><header class=${pg==="abstracts"?"hd-static":""}><div class="w hd"><a href="#home" class="brand" aria-label="ARES’26 home" onClick=${e=>{e.preventDefault();go("home")}}><img src=${LOGO_LIGHT} alt="ARES’26"/></a><div class="sp"/><nav aria-label="Main">${NAV.map(([k,l])=>nav(k,l))}${adm&&nav("ares-admin","Admin")}</nav>
<a href="#register" class="btn s reg" onClick=${e=>{e.preventDefault();go("register")}}>Register now</a><button type="button" class="burger bg" aria-label=${menu?"Close menu":"Open menu"} aria-expanded=${menu} aria-controls="mobile-menu" onClick=${()=>setMenu(!menu)}><span class=${"bars"+(menu?" x":"")}><i/><i/><i/></span></button></div>
${menu&&h`<nav class="mn" id="mobile-menu" aria-label="Mobile">${NAV.map(([k,l])=>nav(k,l))}${adm&&nav("ares-admin","Admin")}</nav>`}</header>
${sb?h`<${Page} ...${P}/>`:h`<${Setup}/>`}
<footer><div class="w ft">
<div class="ft-col ft-brand"><img src=${LOGO} alt="ARES’26" class="ft-logo"/><h3>ARES'26</h3><p>Academic Research & Excellence Symposium, organised by the Student Research Council (SRC) at Sargodha Medical College.</p></div>
<div class="ft-col"><h3>Contact</h3><p><${Ic} n="mail" size=${16}/><span>Email: official.srcsmc@gmail.com</span></p><p><${Ic} n="phone" size=${16}/><span>Phone: (048) 9232004</span></p><p><${Ic} n="pin" size=${16}/><span>Address: 2P3F+H7J, Faisalabad Rd, Sargodha</span></p></div>
<div class="ft-col"><h3>Quick Links</h3><p><a href="#home" onClick=${e=>{e.preventDefault();go("home")}}>Home</a></p><p><a href="#register" onClick=${e=>{e.preventDefault();go("register")}}>Register</a></p><p><a href="#abstracts" onClick=${e=>{e.preventDefault();go("abstracts")}}>Submit abstract</a></p><p><a href="#terms" onClick=${e=>{e.preventDefault();go("terms")}}>Terms of use</a></p><p><a href="#conduct" onClick=${e=>{e.preventDefault();go("conduct")}}>Code of conduct</a></p><p><a href="/sitemap">Sitemap</a></p><p><a href="/privacy">Privacy Policy</a></p><p><button type="button" class="linkbtn" data-cookie-settings>Cookie settings</button></p><p><a href="/">← Back to SRC</a></p></div>
</div>
<div class="w ft-bottom">© 2026 SRC – Sargodha Medical College. All rights reserved.</div>
<div class="w ft-credit"><a href="https://hadbie-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">Made by <b>Hassan Farooq</b> ↗</a></div>
</footer></div>`}
