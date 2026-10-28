import {useState,useEffect,h,LOGO,BANK,DISC,SECT,DEF,left,NAV,Faq} from '../shared.js';

export default function Home(P){const{ct,go}=P;return h`<div>
<section class="hero"><div class="w"><div class="lg"><img src=${LOGO} alt="ARES’26 logo"/></div>
<h1>ARES’26: Academic Research & Excellence Symposium</h1>
<p>Sargodha Medical College’s first international research conference. Present your work, learn hands-on, and meet researchers shaping medicine.</p>
<p><b>Third week of November 2026</b> · In person at Sargodha Medical College</p>
<button class="btn" onClick=${()=>go("register")}>Register now</button> <button class="btn o" onClick=${()=>go("abstracts")}>Submit abstract</button></div></section>
<section class="sec w"><h2>What’s coming</h2><div class="g c3">
<div class="card"><h3>Conference registration</h3><p class="mut">Open to students, faculty and researchers. Includes conference access and materials. Fee announced with opening of registration.</p><button class="btn o s" onClick=${()=>go("register")}>Register</button></div>
<div class="card"><h3>Abstract submission</h3><p class="mut">Submit a structured abstract for oral or poster presentation. Peer reviewed; decisions appear on your dashboard.</p><button class="btn o s" onClick=${()=>go("abstracts")}>Submit</button></div>
<div class="card"><h3>Workshops</h3><p class="mut">Hands-on sessions led by invited faculty. Capacity is limited. Schedule coming soon.</p><button class="btn o s" onClick=${()=>go("workshops")}>See status</button></div></div></section>
<section class="sec w" style="padding-top:0"><h2>Mark your calendar</h2><div class="g c5">${ct.dates.map(([d,t,iso])=>h`<div class="card k" key=${t}><div class="dt"><b>${d}</b><span>${left(iso)}</span></div><h3 style="margin-top:10px;font-size:1rem">${t}</h3></div>`)}</div></section>
<section class="sec w" style="padding-top:0"><h2>Theme</h2><div class="g c2">
<div class="card"><h3>AI advancements</h3><p class="mut">AI is already reading scans, flagging risk and drafting notes. We ask how researchers can use it well, test it honestly and keep clinical judgment in charge.</p></div>
<div class="card"><h3>Psychological roles</h3><p class="mut">Outcomes depend on people: patient trust, clinician burnout, team dynamics. This strand looks at the human side of care and research.</p></div></div></section>
<section class="q"><div class="w"><p>“Research is to see what everybody else has seen, and to think what nobody else has thought.”</p><span class="mut">Albert Szent-Györgyi</span></div></section>
<section class="sec w"><h2>Our team</h2><div class="g c5">${ct.team.map(([n,r],i)=>h`<div class="card" key=${i}><div class="av">${n.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><b>${n}</b><div class="mut" style="font-size:.85rem">${r}</div></div>`)}</div></section>
<section class="sec w" style="padding-top:0"><h2>FAQs</h2><${Faq} ct=${ct}/></section></div>`}
