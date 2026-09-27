function go(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.s===id));
  document.getElementById(id).scrollTop = 0;
}
function toggleAcc(el){ el.classList.toggle('open'); }
function showModal(){ document.getElementById('modal-bg').classList.add('show'); }
function hideModal(){ document.getElementById('modal-bg').classList.remove('show'); }

function saveInfo(){
  try{
    const data = {
      name: document.getElementById('pi-name').value,
      contact: document.getElementById('pi-contact').value,
      notes: document.getElementById('pi-notes').value
    };
    localStorage.setItem('safecampus-info', JSON.stringify(data));
  }catch(e){}
  const m = document.getElementById('save-msg');
  m.classList.add('show');
  setTimeout(()=>m.classList.remove('show'), 2200);
}
(function loadInfo(){
  try{
    const raw = localStorage.getItem('safecampus-info');
    if(raw){
      const d = JSON.parse(raw);
      document.getElementById('pi-name').value = d.name||'';
      document.getElementById('pi-contact').value = d.contact||'';
      document.getElementById('pi-notes').value = d.notes||'';
    }
  }catch(e){}
})();

function shareLocation(){
  const s = document.getElementById('loc-msg-status');
  s.classList.add('show');
  setTimeout(()=>s.classList.remove('show'), 2500);
  try{
    if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(function(){}, function(){}); }
  }catch(e){}
}

// Dark mode
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('dark-switch').classList.toggle('on', t==='dark');
}
function toggleDark(){
  const cur = document.documentElement.getAttribute('data-theme')==='dark' ? 'light':'dark';
  applyTheme(cur);
  try{ localStorage.setItem('safecampus-theme', cur); }catch(e){}
}
(function initTheme(){
  let t = 'light';
  try{ t = localStorage.getItem('safecampus-theme') || 'light'; }catch(e){}
  applyTheme(t);
})();

// Offline sim
function toggleOffline(){
  const sw = document.getElementById('offline-switch');
  sw.classList.toggle('on');
  const off = sw.classList.contains('on');
  const chip = document.getElementById('conn-chip');
  const ind = document.getElementById('conn-ind');
  if(off){
    chip.classList.add('off'); chip.innerHTML = '<span class="cdot"></span>Offline — no connection';
    ind.textContent = '○○○';
  } else {
    chip.classList.remove('off'); chip.innerHTML = '<span class="cdot"></span>Online — connected';
    ind.textContent = '●●●';
  }
}

// Whistle — Web Audio API tone
let audioCtx, oscillator, gainNode;
function startWhistle(){
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 3000;
    gainNode.gain.value = 0.15;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    const el = document.getElementById('whistle-status');
    el.textContent = 'Sounding...'; el.classList.add('on');
  }catch(e){}
}
function stopWhistle(){
  try{ if(oscillator){ oscillator.stop(); oscillator.disconnect(); oscillator=null; } }catch(e){}
  const el = document.getElementById('whistle-status');
  if(el){ el.textContent = 'Press and hold to sound alarm'; el.classList.remove('on'); }
}
(function initWhistle(){
  const b = document.getElementById('whistle-btn');
  b.addEventListener('mousedown', startWhistle);
  b.addEventListener('touchstart', function(e){e.preventDefault(); startWhistle();});
  b.addEventListener('mouseup', stopWhistle);
  b.addEventListener('mouseleave', stopWhistle);
  b.addEventListener('touchend', stopWhistle);
})();

// clock
(function clock(){
  const el = document.getElementById('clock');
  function upd(){ const d=new Date(); let h=d.getHours(); const m=d.getMinutes().toString().padStart(2,'0'); const ap=h>=12?'PM':'AM'; h=h%12; if(h===0)h=12; el.textContent = h+':'+m; }
  upd(); setInterval(upd, 30000);
})();
