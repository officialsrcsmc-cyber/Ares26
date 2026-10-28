import {useState,useEffect,h,LOGO,DEF,NAV,Faq} from './shared.js';
import {sb} from './supabase.js';

import Home from './pages/Home.js';
import Registration from './pages/Registration.js';
import Login from './pages/Login.js';
import Reset from './pages/Reset.js';
import Abstracts from './pages/Abstracts.js';
import Dashboard from './pages/Dashboard.js';
import Admin from './pages/Admin.js';

const Txt=(t,b)=>()=>h`<div class="w sec" style="max-width:640px"><h2>${t}</h2><p class="mut">${b}</p></div>`;
const PAGES={home:Home,register:Registration,login:Login,reset:Reset,abstracts:Abstracts,dashboard:Dashboard,"ares-admin":Admin,
faqs:P=>h`<div class="w sec"><h2>FAQs</h2><${Faq} ct=${P.ct}/></div>`,
workshops:Txt("Workshops","Coming soon. Hands-on workshop details, schedule and enrolment will be posted here."),
terms:Txt("Terms of use","Placeholder. The organizing committee will publish the full Terms of Use before registration opens."),
conduct:Txt("Code of conduct","Placeholder. ARES’26 expects respectful, honest and inclusive conduct from every participant. Full text to follow.")};

const validContent=c=>c&&Array.isArray(c.dates)&&Array.isArray(c.team)&&Array.isArray(c.faqs);

function Setup(){return h`<div class="w sec" style="max-width:560px"><h2>Setup needed</h2><p class="mut">The site cannot find its Supabase settings. Copy <b>.env.example</b> to <b>.env</b>, fill in your project URL and anon key, then restart <b>npm run dev</b>. On a hosting service, add the same two variables in its environment settings and redeploy.</p></div>`}

export default function App(){
const[pg,setPg]=useState(()=>{const t=(location.hash||"").slice(1);return PAGES[t]?t:"home"}),[menu,setMenu]=useState(false),
[session,setSession]=useState(undefined),[profile,setProfile]=useState(undefined),[abs,setA]=useState([]),[ct,setC]=useState(DEF);

// auth session
useEffect(()=>{if(!sb)return;
 sb.auth.getSession().then(({data})=>setSession(data.session||null));
 const{data:l}=sb.auth.onAuthStateChange((ev,s)=>{setSession(s||null);if(ev==="PASSWORD_RECOVERY")setPg("reset")});
 return()=>l.subscription.unsubscribe()},[]);

// public site content (dates, team, FAQs) edited by admins
useEffect(()=>{if(!sb)return;
 sb.from("site_content").select("data").eq("id",1).maybeSingle().then(({data})=>{if(data&&validContent(data.data))setC(data.data)})},[]);

// the signed-in person's profile and abstracts
const refresh=async()=>{
 if(!sb||!session){setProfile(session===undefined?undefined:null);setA([]);return}
 const{data:p}=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();setProfile(p||null);
 const{data:a}=await sb.from("abstracts").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});setA(a||[])};
useEffect(()=>{refresh()},[session&&session.user.id]);

const go=p=>{setPg(p);setMenu(false);window.scrollTo(0,0);try{location.hash=p}catch(e){}};
const logout=async()=>{await sb.auth.signOut();setProfile(null);setA([]);go("home")};
const P={go,sb,session,profile,refresh,logout,abs,ct,setC},Page=PAGES[pg]||Home;
return h`<div><header><div class="w hd"><img src=${LOGO} alt="ARES’26" onClick=${()=>go("home")}/><div class="sp"/><nav>${NAV.map(([k,l])=>h`<a key=${k} class=${pg==k?"on":""} onClick=${()=>go(k)}>${l}</a>`)}</nav>
<button class="btn s" onClick=${()=>go("register")}>Register now</button><button class="btn o s bg" aria-label="Menu" onClick=${()=>setMenu(!menu)}>${menu?"Close":"Menu"}</button></div>
${menu&&h`<div class="mn">${NAV.map(([k,l])=>h`<a key=${k} onClick=${()=>go(k)}>${l}</a>`)}</div>`}</header>
${sb?h`<${Page} ...${P}/>`:h`<${Setup}/>`}
<footer><div class="w"><a onClick=${()=>go("terms")}>Terms of use</a><a onClick=${()=>go("conduct")}>Code of conduct</a><div style="margin-top:8px">ARES’26 · Research Cell SMC and Student Research Committee (SRC-SMC) · Sargodha Medical College</div></div></footer></div>`}
