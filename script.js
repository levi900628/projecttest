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

$$('.nav-link').forEach(link=>{
  link.addEventListener('click',()=>sidebar.classList.remove('open'));
});

const SNIPPETS = {
  'welcome-api': {
    tag: '#api-canvas',
    path: 'snippets/javascript/welcome-card.js',
    url: 'https://projecttest-eosin-eight.vercel.app/api/welcome',
    curl: 'curl -s "https://projecttest-eosin-eight.vercel.app/api/welcome?gender=cewek"',
    filename: 'welcome-card.js',
    code: `const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function generateWelcome(userGender, avatarUrl) {
  const gender = userGender.toLowerCase().trim();
  
  const bgPath = (gender === 'cewe' || gender === 'cewek')
    ? './assets/welcome-cewek.webp'
    : './assets/welcome-cowok.jpg';

  const bgBuffer = fs.readFileSync(bgPath);
  const background = await loadImage(bgBuffer);

  const canvas = createCanvas(1536, 865);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(background, 0, 0, 1536, 865);

  if (avatarUrl) {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(90, 275, 315, 315, 40);
    ctx.clip();
    ctx.drawImage(avatar, 90, 275, 315, 315);
    ctx.restore();
  }

  return canvas.toBuffer('image/png');
}`
  },
  'baileys-hook': {
    tag: '#whatsapp-bot',
    path: 'snippets/javascript/baileys-welcome.js',
    url: 'https://projecttest-eosin-eight.vercel.app/api/webview',
    curl: 'curl -s "https://projecttest-eosin-eight.vercel.app/api/webview?user=@member&gender=cowok"',
    filename: 'baileys-welcome.js',
    code: `const axios = require('axios');

async function sendWelcome(sock, jid, userTag, gender, avatarUrl) {
  const apiUrl = \`https://projecttest-eosin-eight.vercel.app/api/webview?user=\${encodeURIComponent(userTag)}&gender=\${gender.toLowerCase()}&avatar=\${encodeURIComponent(avatarUrl)}\`;

  const caption = \`hello \${userTag} selamat datang di @subject

*Intro marga*
ɴᴀᴍᴀ : 
ᴜᴍᴜʀ : 
ᴀsᴋᴏᴛ : 
ɢᴇɴᴅᴇʀ : \${gender}
ᴛɪᴋᴛᴏᴋ : 
ᴋᴏɴᴛᴇɴ : 

Lihat preview kartu: \${apiUrl}\`;

  await sock.sendMessage(jid, { text: caption });
}`
  }
};

let currentKey = 'welcome-api';

function renderSnippet(key) {
  currentKey = key;
  const data = SNIPPETS[key];
  const lines = data.code.split('\n');
  const sizeKB = (new Blob([data.code]).size / 1024).toFixed(1);

  $('#snipTag').textContent = data.tag;
  $('#snipStats').textContent = `${lines.length} lines · ${sizeKB} KB · updated 2026`;
  $('#snipPath').textContent = data.path;
  $('#snipUrl').textContent = data.url;
  $('#snipCurl').textContent = data.curl;
  
  const codeEl = $('#codeContent');
  codeEl.textContent = data.code;
  codeEl.className = 'language-javascript';

  if (window.Prism) {
    Prism.highlightElement(codeEl);
  }

  $('#lineNumbers').innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
}

$$('.snip-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.snip-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSnippet(btn.dataset.snip);
  });
});

$('#copyCodeBtn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(SNIPPETS[currentKey].code);
  const btn = $('#copyCodeBtn');
  btn.textContent = '✓ Copied!';
  setTimeout(() => btn.textContent = '❐ Copy code', 1800);
});

$$('.bar-copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const targetText = $(`#${btn.dataset.copyTarget}`).textContent;
    await navigator.clipboard.writeText(targetText);
    const old = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = old, 1500);
  });
});

$('#downloadCodeBtn').addEventListener('click', () => {
  const data = SNIPPETS[currentKey];
  const blob = new Blob([data.code], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = data.filename;
  a.click();
});

$('#rawCodeBtn').addEventListener('click', () => {
  const blob = new Blob([SNIPPETS[currentKey].code], { type: 'text/plain;charset=utf-8' });
  window.open(URL.createObjectURL(blob), '_blank');
});

$('#wrapBtn').addEventListener('click', () => {
  $('#wrapBtn').classList.toggle('active');
  $('#codeBody').classList.toggle('wrapped');
});

renderSnippet('welcome-api');
