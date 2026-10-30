import {useState,useEffect,h,THANKS_KEY,PageSkel} from '../shared.js';

const COPY={
 registered:{t:"Check your email",s:"Your account has been created.",steps:["Open the confirmation email we sent you and click the link (check spam if you don’t see it).","Log in to your dashboard.","Upload your payment proof there. The team will verify it and update your status."],btn:["Go to log in","login"]},
 payment:{t:"Payment proof received",s:"Thank you. Your payment details and proof were submitted.",steps:["The organising team will verify your payment.","Your status on the dashboard will change to Approved or Rejected.","If it is rejected, you can upload a new proof from the dashboard."],btn:["Go to dashboard","dashboard"]},
 abstract:{t:"Abstract submitted",s:"Thank you. Your abstract has been received.",steps:["The abstract will be reviewed by the committee.","Track its status on your dashboard (Submitted, Under Review, Accepted or Rejected)."],btn:["Go to dashboard","dashboard"]}};

// Only reachable right after a real successful submission (the flag is set by the form, then cleared here)
export default function Thanks(P){
 const[kind]=useState(()=>{try{return sessionStorage.getItem(THANKS_KEY)}catch(e){return null}});
 useEffect(()=>{try{sessionStorage.removeItem(THANKS_KEY)}catch(e){}if(!COPY[kind])P.go("home")},[]);
 const c=COPY[kind];if(!c)return h`<${PageSkel} narrow=${true}/>`;
 return h`<div class="auth thanks"><div class="tick" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></div>
<h1 style="font-size:1.7rem">${c.t}</h1><p class="sub">${c.s}</p>
<div class="panel"><h3>What happens next</h3><ol>${c.steps.map(x=>h`<li key=${x}>${x}</li>`)}</ol>
<button class="btn block" onClick=${()=>P.go(c.btn[1])}>${c.btn[0]}</button><p class="alt"><a href="#home" onClick=${e=>{e.preventDefault();P.go("home")}}>Return to home</a> · <a href="/">SRC homepage</a></p></div></div>`}
