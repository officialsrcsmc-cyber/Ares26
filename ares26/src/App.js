import React,{Suspense,lazy} from 'react';
import {useState,useEffect,useRef,h,LOGO,LOGO_SIZE,DEF,NAV,Faq,PageSkel,withTimeout,track} from './shared.js';
import {sb} from './supabase.js';

import Home from './pages/Home.js';
import Registration from './pages/Registration.js';
import Login from './pages/Login.js';
import Reset from './pages/Reset.js';
import Abstracts from './pages/Abstracts.js';
import Dashboard from './pages/Dashboard.js';
import Thanks from './pages/Thanks.js';
const Admin=lazy(()=>import('./pages/Admin.js')); // only admins need this code

const Txt=(t,b)=>()=>h`<div class="w sec" style="max-width:640px"><h1 style="font-size:1.7rem">${t}</h1><p class="mut">${b}</p></div>`;
// Terms and Privacy live on the main site; old #terms links keep working
const Out=(to)=>function Out(){useEffect(()=>{location.replace(to)},[]);return h`<div class="w sec"><p class="mut">Opening… <a href=${to}>Continue</a></p></div>`};
const NotFound=P=>h`<div class="w sec" style="max-width:560px;text-align:center"><p class="nf-code" aria-hidden="true">404</p><h1 style="font-size:1.8rem">This page doesn’t exist</h1><p class="mut">The link may be broken or the page may have moved.</p><p><a class="btn" href="#home" onClick=${e=>{e.preventDefault();P.go("home")}}>Go to ARES’26 home</a> <a class="btn o" href="/">SRC homepage</a></p></div>`;
const FaqPage=P=>h`<div class="w sec"><h1 style="font-size:1.7rem">FAQs</h1><${Faq} ct=${P.ct}/></div>`;
// Admin is invisible to everyone but admins: others get the same 404 view as any unknown page
const AdminGate=P=>{if(P.session===undefined||(P.session&&P.profile===undefined))return h`<${PageSkel}/>`;
 return P.profile&&P.profile.is_admin?h`<${Admin} ...${P}/>`:h`<${NotFound} ...${P}/>`};
const PAGES={home:Home,register:Registration,login:Login,reset:Reset,abstracts:Abstracts,dashboard:Dashboard,"ares-admin":AdminGate,thanks:Thanks,
faqs:FaqPage,
workshops:Txt("Workshops","Coming soon. Hands-on workshop details, schedule and enrolment will be posted here."),
terms:Out("/terms"),privacy:Out("/privacy"),
conduct:Txt("Code of conduct","Placeholder. ARES’26 expects respectful, honest and inclusive conduct from every participant. Full text to follow.")};

// Per-page <title>, description and robots (the app uses #hash routes, so one canonical URL for all)
const META={
 home:["ARES’26 · Academic Research & Excellence Symposium | Sargodha Medical College","Register for ARES’26, Sargodha Medical College’s first international research conference on November 21, 2026. Submit an abstract and meet researchers shaping medicine."],
 register:["Register for ARES’26 · Sargodha Medical College","Create your ARES’26 account, enter your academic details and upload payment proof to secure your place at the symposium."],
 abstracts:["Submit an abstract · ARES’26","Submit a structured abstract (oral or poster) for ARES’26. Log in or register to begin."],
 workshops:["Workshops · ARES’26","Hands-on ARES’26 workshops led by invited faculty. Schedule and enrolment will be announced soon."],
 faqs:["FAQs · ARES’26","Answers about who can attend ARES’26, payment, abstract submission and workshops."],
 conduct:["Code of conduct · ARES’26","The ARES’26 code of conduct for participants."],
 login:["Log in · ARES’26",""],reset:["Reset password · ARES’26",""],dashboard:["Dashboard · ARES’26",""],"ares-admin":["Admin · ARES’26",""],thanks:["Thank you · ARES’26",""],notfound:["Page not found · ARES’26",""]};
const PRIVATE=new Set(["login","reset","dashboard","ares-admin","thanks","notfound"]);
function applyMeta(pg){
 const[t,d]=META[pg]||META.home;document.title=t;
 const set=(sel,attr,v)=>{const e=document.head.querySelector(sel);if(e)e.setAttribute(attr,v)};
 if(d){set('meta[name="description"]','content',d);set('meta[property="og:description"]','content',d);set('meta[name="twitter:description"]','content',d)}
 set('meta[property="og:title"]','content',t);set('meta[name="twitter:title"]','content',t);
 set('meta[name="robots"]','content',PRIVATE.has(pg)?"noindex, nofollow":"index, follow, max-image-preview:large")}

const route=()=>{const t=(location.hash||"").slice(1).split("?")[0];
 if(!t||t.includes("="))return"home"; // empty hash, or an auth redirect fragment such as #error=…
 return PAGES[t]?t:"notfound"};
const validContent=c=>c&&Array.isArray(c.dates)&&Array.isArray(c.team)&&Array.isArray(c.faqs);

function Setup(){return h`<div class="w sec" style="max-width:560px"><h2>Setup needed</h2><p class="mut">The site cannot find its Supabase settings. Copy <b>.env.example</b> to <b>.env</b>, fill in your project URL and anon key, then restart <b>npm run dev</b>. On a hosting service, add the same two variables in its environment settings and redeploy.</p></div>`}

// Mobile-only sticky "Register now": shown on the home page once the hero buttons have scrolled away
function StickyCta({pg,go}){
 const[show,setShow]=useState(false);
 useEffect(()=>{setShow(false);if(pg!=="home"||!("IntersectionObserver" in window))return;
  const vis={};const upd=()=>setShow(vis.hero===false&&!vis.foot);
  const mk=(k,el)=>{if(!el)return null;const o=new IntersectionObserver(es=>{vis[k]=es[0].isIntersecting;upd()});o.observe(el);return o};
  const a=mk("hero",document.getElementById("hero-cta")),b=mk("foot",document.querySelector("footer"));
  return()=>{a&&a.disconnect();b&&b.disconnect()}},[pg]);
 useEffect(()=>{document.body.classList.toggle("has-sticky",show);return()=>document.body.classList.remove("has-sticky")},[show]);
 return show?h`<button type="button" class="sticky-cta" data-track="cta_sticky_register" onClick=${()=>go("register")}>Register now</button>`:null}

export default function App(){
const[pg,setPg]=useState(route),[menu,setMenu]=useState(false),
[session,setSession]=useState(undefined),[profile,setProfile]=useState(undefined),[abs,setA]=useState([]),[ct,setC]=useState(DEF),[ready,setReady]=useState(false);
const first=useRef(true);

// follow the browser back/forward buttons and manual hash edits
useEffect(()=>{const on=()=>setPg(route());window.addEventListener("hashchange",on);return()=>window.removeEventListener("hashchange",on)},[]);

// per-page metadata, focus + analytics page view on navigation
useEffect(()=>{applyMeta(pg);
 if(first.current){first.current=false;return}
 const m=document.getElementById("main");if(m){m.focus({preventScroll:true})}
 if(window.srcPageview)window.srcPageview("/ares26/#"+pg)},[pg]);

// auth session
useEffect(()=>{if(!sb)return;
 withTimeout(sb.auth.getSession(),15000).then(({data})=>setSession(data.session||null)).catch(()=>setSession(null));
 const{data:l}=sb.auth.onAuthStateChange((ev,s)=>{setSession(s||null);if(ev==="PASSWORD_RECOVERY")setPg("reset")});
 return()=>l.subscription.unsubscribe()},[]);

// public site content (dates, team, FAQs) edited by admins; defaults are used if it can't load
useEffect(()=>{if(!sb){setReady(true);return}
 withTimeout(sb.from("site_content").select("data").eq("id",1).maybeSingle(),8000)
  .then(({data})=>{if(data&&validContent(data.data))setC(data.data)}).catch(()=>{}).finally(()=>setReady(true))},[]);

// the signed-in person's profile and abstracts (loaded together so the dashboard never flashes empty)
const refresh=async()=>{
 if(!sb||!session){setProfile(session===undefined?undefined:null);setA([]);return}
 try{const[p,a]=await Promise.all([
   withTimeout(sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle(),15000),
   withTimeout(sb.from("abstracts").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false}),15000)]);
  setProfile(p.data||null);setA(a.data||[])}
 catch(e){setProfile(null);setA([])}};
useEffect(()=>{refresh()},[session&&session.user.id]);

const go=p=>{setPg(p);setMenu(false);window.scrollTo(0,0);try{location.hash=p}catch(e){}};
const logout=async()=>{try{await sb.auth.signOut()}catch(e){}setProfile(null);setA([]);go("home")};
const P={go,sb,session,profile,refresh,logout,abs,ct,setC,ready},Page=pg==="notfound"?NotFound:PAGES[pg]||Home;
const isAdm=!!(profile&&profile.is_admin);
const link=(k,l,cls)=>h`<a key=${k} href=${"#"+k} class=${cls} aria-current=${pg==k?"page":undefined} onClick=${e=>{e.preventDefault();track("nav_"+k);go(k)}}>${l}</a>`;
const fl=(k,l)=>h`<p><a href=${"#"+k} onClick=${e=>{e.preventDefault();go(k)}}>${l}</a></p>`;
return h`<div><a class="skip" href="#main" onClick=${e=>{e.preventDefault();const m=document.getElementById("main");m&&m.focus()}}>Skip to content</a>
<header><div class="w hd"><a class="logo-link" href="#home" aria-label="ARES’26 home" onClick=${e=>{e.preventDefault();go("home")}}><img src=${LOGO} alt="" width=${LOGO_SIZE} height=${LOGO_SIZE} decoding="async"/></a><div class="sp"/><nav aria-label="Main">${NAV.map(([k,l])=>link(k,l,pg==k?"on":""))}${isAdm&&link("ares-admin","Admin",pg=="ares-admin"?"on":"")}</nav>
<button class="btn s" data-track="cta_header_register" onClick=${()=>go("register")}>Register now</button><button class="btn o s bg" aria-expanded=${menu?"true":"false"} aria-controls="mobile-menu" onClick=${()=>setMenu(!menu)}>${menu?"Close":"Menu"}</button></div>
${menu&&h`<div class="mn" id="mobile-menu" role="navigation" aria-label="Mobile">${NAV.map(([k,l])=>link(k,l))}${isAdm&&link("ares-admin","Admin")}</div>`}</header>
<main id="main" tabIndex="-1">
${!sb?h`<${Setup}/>`:h`<${Suspense} fallback=${h`<${PageSkel}/>`}><${Page} ...${P}/><//>`}</main>
<${StickyCta} pg=${pg} go=${go}/>
<footer><div class="w ft">
<div class="ft-col"><h3>Contact</h3><p class="mut">Email: <a href="mailto:official.srcsmc@gmail.com">official.srcsmc@gmail.com</a></p><p class="mut">Phone: <a href="tel:+92489232004">(048) 9232004</a></p><p class="mut">Address: 2P3F+H7J, Faisalabad Rd, Sargodha</p></div>
<div class="ft-col"><h3>ARES'26</h3><p class="mut">Academic Research &amp; Excellence Symposium, organised by the Student Research Council (SRC) at Sargodha Medical College.</p></div>
<div class="ft-col"><h3>Quick Links</h3>${fl("home","Home")}${fl("register","Register")}${fl("abstracts","Submit abstract")}<p><a href="/terms">Terms & Conditions</a></p><p><a href="/privacy">Privacy Policy</a></p>${fl("conduct","Code of conduct")}<p><button type="button" class="linkbtn" data-cookie-settings>Cookie settings</button></p><p><a href="/">← Back to SRC</a></p></div>
</div>
<div class="w ft-bottom mut">© 2026 SRC – Sargodha Medical College. All rights reserved.</div>
</footer></div>`}
