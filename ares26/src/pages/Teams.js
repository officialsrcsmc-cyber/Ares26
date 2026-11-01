import {h} from '../shared.js';

const TEAMS=[
["Registration & Attendance Team",
 ["Zain ul Hassan","Tahira Tayyaba"],["Moazzma Azeem","Muhammad Afham"],
 ["Ayesha Qayyum","Samiya Habib","Ayesha Rehman","Ghanwa Saeed","Anas Javed","Sabiha Naz","Muhammad Aqib","Rubab Fatima","Musfira Sanaullah"]],
["Abstract Team",
 ["M Abdullah (Posters)","Muhammad Bilal (Oral)"],["Muddassar Hayat","Hafsa Salman"],
 ["Maham Farooq","Zoha Aslam","Fatima Nawaz","Hamna Habib","Umaniah Malik","Maryam Afzal","Noor-ul-Ain"]],
["Activity Team",
 ["M Taqi Jafar","Mahnoor Tahir"],["Aniza Sohail","Laiba Hussain"],
 ["Maleeka Saleem","Aqsa Zahid","Rofia Ali","Laiba Siddique","Sabeen Zainab","Syed Dabeer Ali","Amna Waqar","Matloob Bibi","Muaz Farooq"]],
["Workshop Team",
 ["Muhammad Hasher Saeed","Muhammad Abdulwahab"],["Awais Ali","Rida Safdar"],
 ["Tabeer Arshad","Amna Masood","Naba Naeem","Hira Fukushima Butt","Muhammad Alwaz","Muhammad Shoais","Maha Jafar","Eman Rauf","Maryam Zainab","Wajeeha Shahid"]],
["Discipline/Protocol Team",
 ["M Ahmad Anwar","Abdul Hanan"],["Ayesha Usman","Mahnoor Fatima"],
 ["Mudassir Hussain","Shiza Rafiq Shaikh","Areej Batool","Malaika Hameed","Nabeeha Malik","Ahmad Hassan","Izzah Zahra","Sahar Farooq","Ayesha Ehsan","Shahzaib Khan"]],
["Stage Team",
 ["Salahuddin","Muhammad Ali Tahir"],["Muhammad Zohaib Khan","Amna Sadiq"],
 ["M Subhan Babar","Abdur Rehman","Omaiza Qaiser","M Ali Cheema","Khadeeja Kifal"]],
["Hosting Team",
 ["Nouman Ali"],["Amna Ehsan Malik"],
 ["Syeda Eman Zahra","Mahnoor Khizar","Momna Ahsan","Talha Ansari"]],
["Media Team",
 ["Sadeema Chaudhary","Afifa Maryam"],["Meerub Ijaz"],
 ["Aiman Imtiaz","Baqir Abbas","Fatima Athar"]],
["Decor Team",
 ["Fatima"],["Azfreen Ijaz"],
 ["Hafsa Kanwal","Rimsha Habib","Hamma Munir"]]];

const ROLES=["Coordinators","Team Lead","Team Members"];
const Ico=({k})=>h`<span class=${"tb-ico k"+k} aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6z"/>${k!==1&&h`<circle cx="5" cy="9.5" r="2.2" opacity=".75"/><circle cx="19" cy="9.5" r="2.2" opacity=".75"/>`}</svg></span>`;

export default function Teams({go}){return h`<div class="w sec ab">
<div class="ab-top"><p class="ab-eyebrow"><span>ARES’26</span><i aria-hidden="true"></i><span>TEAMS</span></p><h1 class="ab-title">Teams – ARES’26</h1></div>
<div class="tb-grid">${TEAMS.map(([title,...groups],i)=>h`<article class="tb-card" key=${title}>
<header class="tb-head"><span class="tb-num">${i+1}</span><h2>${title}</h2></header>
${groups.map((names,k)=>h`<div class="tb-row" key=${k}><${Ico} k=${k}/><div><h3>${ROLES[k]}:</h3><p>${names.join(", ")}</p></div></div>`)}
</article>`)}</div>
<div class="tb-back"><button class="btn o" onClick=${()=>go("home")}>← Back to Home</button></div>
</div>`}
