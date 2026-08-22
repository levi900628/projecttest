const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const glow = $('.cursor-glow');
window.addEventListener('pointermove', e => {
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
});

function updateClock(){
  const now = new Date();
  $('#clock').textContent = now.toLocaleTimeString('id-ID', {hour12:false});
}
setInterval(updateClock, 1000); updateClock();

const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12});
$$('.reveal').forEach(el=>observer.observe(el));

const counters = $$('.about-stats strong');
const countObserver = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const el=entry.target, target=Number(el.dataset.count);
    let n=0;
    const step=Math.max(1, Math.ceil(target/35));
    const tick=()=>{
      n=Math.min(target,n+step);
      el.textContent=n+(target===100?'%':'+');
      if(n<target) requestAnimationFrame(tick);
    };
    tick();
    countObserver.unobserve(el);
  });
},{threshold:.7});
counters.forEach(c=>countObserver.observe(c));

$$('.tilt').forEach(card=>{
  card.addEventListener('pointermove', e=>{
    if(innerWidth < 900) return;
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    card.style.transform=`perspective(900px) rotateX(${-y*5}deg) rotateY(${x*5}deg) translateY(-3px)`;
  });
  card.addEventListener('pointerleave',()=>card.style.transform='');
});

const menuBtn=$('#menuBtn'), sidebar=$('.sidebar');
menuBtn.addEventListener('click',()=>sidebar.classList.toggle('open'));
$$('.nav-link').forEach(link=>link.addEventListener('click',()=>sidebar.classList.remove('open')));

const sections=$$('section[id]');
const links=$$('.nav-link');
const activeObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')===`#${entry.target.id}`));
    }
  });
},{rootMargin:'-40% 0px -50% 0px'});
sections.forEach(s=>activeObserver.observe(s));
