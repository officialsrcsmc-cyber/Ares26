import {useState,useEffect,h,LOGO,LOGO_LIGHT,DEF,NAV,Faq} from './shared.js';
import {sb} from './supabase.js';

import Home from './pages/Home.js';
import Registration from './pages/Registration.js';
import Login from './pages/Login.js';
import Reset from './pages/Reset.js';
import Abstracts from './pages/Abstracts.js';
import Dashboard from './pages/Dashboard.js';
import Admin from './pages/Admin.js';

const Txt=(t,b)=>()=>h`<div class="w sec" style="max-width:640px"><h2>${t}</h2><p class="mut">${b}</p></div>`;

const AdminGate=P=>{if(P.session===undefined||(P.session&&P.profile===undefined))return h`<div class="w sec"><p class="mut">Loading...</p></div>`;
 return P.profile&&P.profile.is_admin?h`<${Admin} ...${P}/>`:h`<div class="w sec" style="max-width:560px;text-align:center"><h2>This page doesn’t exist</h2><p class="mut">The link may be broken or the page may have moved.</p><button class="btn" onClick=${()=>P.go("home")}>Go home</button></div>`};

const PAGES={home:Home,register:Registration,login:Login,reset:Reset,abstracts:Abstracts,dashboard:Dashboard,"ares-admin":AdminGate,
faqs:P=>h`<div class="w sec"><h2>FAQs</h2><${Faq} ct=${P.ct}/></div>`,
workshops:Txt("Workshops","Coming soon. Hands-on workshop details, schedule and enrolment will be posted here."),
terms:Txt("Terms of use","Placeholder. The organizing committee will publish the full Terms of Use before registration opens."),
conduct:Txt("Code of conduct","Placeholder. ARES’26 expects respectful, honest and inclusive conduct from every participant. Full text to follow.")};
const validContent=c=>c&&Array.isArray(c.dates)&&Array.isArray(c.team)&&Array.isArray(c.faqs);

function Setup(){return h`<div class="w sec" style="max-width:560px"><h2>Setup needed</h2><p class="mut">The site cannot find its Supabase settings. Copy <b>.env.example</b> to <b>.env</b>, fill in your project URL and anon key, then restart <b>npm run dev</b>. On a hosting service, add the same two variables in its environment settings and redeploy.</p></div>`}

export default function App(){
const[pg,setPg]=useState(()=>{const h=location.hash||"";if(/type=signup/.test(h))return"login";const t=h.slice(1);return PAGES[t]?t:"home"}),[menu,setMenu]=useState(false),
[session,setSession]=useState(undefined),[profile,setProfile]=useState(undefined),[abs,setA]=useState([]),[ct,setC]=useState(DEF);

// auth session
useEffect(()=>{if(!sb)return;
 sb.auth.getSession().then(({data})=>setSession(data.session||null));
 const{data:l}=sb.auth.onAuthStateChange((ev,s)=>{setSession(s||null);if(ev==="PASSWORD_RECOVERY")setPg("reset")});
 return()=>l.subscription.unsubscribe()},[]);

// public site content (dates, team, FAQs) edited by admins
useEffect(()=>{if(!sb)return;
 sb.from("site_content").select("data").eq("id",1).maybeSingle().then(({data})=>{if(data&&validContent(data.data))setC({...data.data,dates:DEF.dates})})},[]);

// the signed-in person's profile and abstracts
const refresh=async()=>{
 if(!sb||!session){setProfile(session===undefined?undefined:null);setA([]);return}
 const{data:p}=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();setProfile(p||null);
 const{data:a}=await sb.from("abstracts").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});setA(a||[])};
useEffect(()=>{refresh()},[session&&session.user.id]);

useEffect(()=>{if(!menu)return;const k=e=>{if(e.key==="Escape")setMenu(false)};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[menu]);
const go=p=>{setPg(p);setMenu(false);window.scrollTo(0,0);try{location.hash=p}catch(e){}};
const logout=async()=>{await sb.auth.signOut();setProfile(null);setA([]);go("home")};
const P={go,sb,session,profile,refresh,logout,abs,ct,setC},Page=PAGES[pg]||Home;
const nav=(k,l,mob)=>h`<a key=${k} href=${"#"+k} class=${pg==k?"on":""} aria-current=${pg==k?"page":undefined} onClick=${e=>{e.preventDefault();go(k)}}>${l}</a>`;
const adm=profile&&profile.is_admin;
return h`<div><header><div class="w hd"><a href="#home" class="brand" aria-label="ARES’26 home" onClick=${e=>{e.preventDefault();go("home")}}><img src=${LOGO_LIGHT} alt="ARES’26"/></a><div class="sp"/><nav aria-label="Main">${NAV.map(([k,l])=>nav(k,l))}${adm&&nav("ares-admin","Admin")}</nav>
<a href="#register" class="btn s reg" onClick=${e=>{e.preventDefault();go("register")}}>Register now</a><button type="button" class="burger bg" aria-label=${menu?"Close menu":"Open menu"} aria-expanded=${menu} aria-controls="mobile-menu" onClick=${()=>setMenu(!menu)}><span class=${"bars"+(menu?" x":"")}><i/><i/><i/></span></button></div>
${menu&&h`<nav class="mn" id="mobile-menu" aria-label="Mobile">${NAV.map(([k,l])=>nav(k,l))}${adm&&nav("ares-admin","Admin")}</nav>`}</header>
${sb?h`<${Page} ...${P}/>`:h`<${Setup}/>`}
<footer><div class="w ft">
<div class="ft-col"><h3>Contact</h3><p class="mut">Email: official.srcsmc@gmail.com</p><p class="mut">Phone: (048) 9232004</p><p class="mut">Address: 2P3F+H7J, Faisalabad Rd, Sargodha</p></div>
<div class="ft-col"><h3>ARES'26</h3><p class="mut">Academic Research & Excellence Symposium, organised by the Student Research Council (SRC) at Sargodha Medical College.</p></div>
<div class="ft-col"><h3>Quick Links</h3><p><a onClick=${()=>go("home")}>Home</a></p><p><a onClick=${()=>go("register")}>Register</a></p><p><a onClick=${()=>go("abstracts")}>Submit abstract</a></p><p><a onClick=${()=>go("terms")}>Terms of use</a></p><p><a onClick=${()=>go("conduct")}>Code of conduct</a></p><p><a href="/">← Back to SRC</a></p></div>
</div>
<div class="w ft-bottom mut">© 2026 SRC – Sargodha Medical College. All rights reserved.</div>
</footer></div>`}
