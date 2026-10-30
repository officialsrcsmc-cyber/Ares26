var burger=document.getElementById('burger'),mnav=document.getElementById('mnav');
  function closeMenu(){burger.setAttribute('aria-expanded','false');burger.classList.remove('open');mnav.classList.remove('open')}
  burger.addEventListener('click',function(){
    var open=burger.classList.toggle('open');
    burger.setAttribute('aria-expanded',open?'true':'false');
    mnav.classList.toggle('open',open);
  });
  mnav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeMenu)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});

  // Header shadow once scrolled
  var hdr=document.querySelector('header');
  function onScroll(){hdr.classList.toggle('scrolled',window.scrollY>8)}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  // Day difference using local midnight so it flips at the right time
  function daysUntil(iso){
    var p=iso.split('-'),t=new Date(+p[0],+p[1]-1,+p[2]),n=new Date();
    n=new Date(n.getFullYear(),n.getMonth(),n.getDate());
    return Math.round((t-n)/864e5);
  }

  // ARES'26 countdown
  var cd=document.getElementById('countdown'),d=daysUntil('2026-11-21');
  if(d>1){cd.textContent='Starts in '+d+' days';cd.hidden=false}
  else if(d===1){cd.textContent='Starts tomorrow';cd.hidden=false}
  else if(d===0){cd.textContent='Happening today';cd.hidden=false}

  // Dim events that have already passed
  document.querySelectorAll('.event').forEach(function(li){
    if(daysUntil(li.getAttribute('data-date'))<0)li.classList.add('past');
  });

  // Team carousel arrows
  var car=document.getElementById('car');
  function step(dir){var c=car.querySelector('.member');car.scrollBy({left:dir*(c.offsetWidth+16),behavior:'smooth'})}
  document.getElementById('prev').addEventListener('click',function(){step(-1)});
  document.getElementById('next').addEventListener('click',function(){step(1)});
  car.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){e.preventDefault();step(1)}
    if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}
  });

  // Fade-in on scroll
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}});
    },{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){io.observe(el)});
  }else{els.forEach(function(el){el.classList.add('in')})}

// Sticky mobile CTA (CSS shows it on small screens only). Visible once the hero is
// scrolled past; hidden again when the ARES'26 card, the events CTA or the footer is on screen.
(function(){
  var cta=document.getElementById('sticky-cta');if(!cta||!('IntersectionObserver' in window))return;
  var hero=document.querySelector('.hero'),hide={};
  function update(){
    var inHero=hide.hero,blocked=hide.ares||hide.events||hide.footer;
    var show=!inHero&&!blocked;
    cta.hidden=!show;document.body.classList.toggle('has-sticky',show);
  }
  function watch(key,el){if(!el)return;new IntersectionObserver(function(es){hide[key]=es[0].isIntersecting;update()}).observe(el)}
  watch('hero',document.querySelector('.hero .cta'));
  watch('ares',document.getElementById('ares-card'));
  watch('events',document.getElementById('events-cta'));
  watch('footer',document.querySelector('footer'));
})();
