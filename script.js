let _prev = 'home';
function goBack(){ go(_prev === 'contacts' ? 'contacts' : 'home'); }
function go(id){
  const cur = document.querySelector('.screen.active');
  if(cur && id.indexOf('svc-') === 0) _prev = cur.id;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.s===id || (id.indexOf('svc-')===0 && n.dataset.s==='contacts' && _prev==='contacts')));
  document.getElementById(id).scrollTop = 0;
  if(id === 'notifications') renderNotifs();
}
function toggleAcc(el){ el.classList.toggle('open'); }
function showModal(){ document.getElementById('modal-bg').classList.add('show'); pushNotif({title:'SOS alert sent', body:'Your emergency contacts were notified and your location was shared.', icon:'alert', color:'var(--coral)'}); }
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

// Connection status (reflects the device's real network state)
function updateConn(){
  const on = navigator.onLine !== false;
  const chip = document.getElementById('conn-chip');
  const ind = document.getElementById('conn-ind');
  chip.classList.toggle('off', !on);
  chip.innerHTML = '<span class="cdot"></span>' + (on ? 'Online — connected' : 'Offline — no connection');
  ind.textContent = on ? '●●●' : '○○○';
}
window.addEventListener('online', updateConn);
window.addEventListener('offline', updateConn);
updateConn();

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

/* ===== Accounts: db capability with localStorage fallback ===== */
let dbNS = null;
let authMode = 'signup';

async function initCapabilities(){
  try{
    if(window.claude && window.claude.use){
      dbNS = await window.claude.use('db');
    }
  }catch(e){ dbNS = null; }
  refreshAccountUI();
}

function localUsers(){
  try{ return JSON.parse(localStorage.getItem('safecampus-users')||'{}'); }catch(e){ return {}; }
}
function saveLocalUsers(obj){
  try{ localStorage.setItem('safecampus-users', JSON.stringify(obj)); }catch(e){}
}

async function findUser(username){
  if(dbNS){
    try{
      const snap = await dbNS.doc('app_users/'+username).get();
      return snap.exists ? snap.data() : null;
    }catch(e){ return null; }
  }
  const users = localUsers();
  return users[username] || null;
}

async function createUser(username, password){
  if(dbNS){
    await dbNS.doc('app_users/'+username).set({username, password, createdAt: Date.now()});
    return;
  }
  const users = localUsers();
  users[username] = {username, password, createdAt: Date.now()};
  saveLocalUsers(users);
}

function setSession(username){
  try{ localStorage.setItem('safecampus-session', username); }catch(e){}
  refreshAccountUI();
}
function getSession(){
  try{ return localStorage.getItem('safecampus-session'); }catch(e){ return null; }
}
function clearSession(){
  try{ localStorage.removeItem('safecampus-session'); }catch(e){}
  refreshAccountUI();
}

function refreshAccountUI(){
  const session = getSession();
  const btn = document.getElementById('home-signup-btn');
  const acct = document.getElementById('account-status');
  const signoutRow = document.getElementById('signout-row');
  if(session){
    if(btn) btn.style.display = 'none';
    if(acct) acct.textContent = 'Signed in as ' + session;
    if(signoutRow) signoutRow.style.display = '';
  } else {
    if(btn) btn.style.display = '';
    if(acct) acct.textContent = 'Not signed in';
    if(signoutRow) signoutRow.style.display = 'none';
  }
}

function openAuth(mode){
  switchAuthTab(mode);
  go('auth');
}

function switchAuthTab(mode){
  authMode = mode;
  document.getElementById('tab-signup').classList.toggle('active', mode==='signup');
  document.getElementById('tab-login').classList.toggle('active', mode==='login');
  document.getElementById('auth-title').textContent = mode==='signup' ? 'Sign Up' : 'Log In';
  document.getElementById('auth-sub').textContent = mode==='signup'
    ? 'Create an account so your info and settings stay with you.'
    : 'Welcome back — log in to your account.';
  document.getElementById('auth-submit').textContent = mode==='signup' ? 'Create Account' : 'Log In';
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-status').classList.remove('show');
}

async function submitAuth(){
  const uEl = document.getElementById('auth-username');
  const pEl = document.getElementById('auth-password');
  const errEl = document.getElementById('auth-error');
  const username = uEl.value.trim();
  const password = pEl.value;
  errEl.textContent = '';

  if(!username || !password){
    errEl.textContent = 'Please fill in both fields.';
    return;
  }

  const submitBtn = document.getElementById('auth-submit');
  submitBtn.disabled = true;

  try{
    const existing = await findUser(username);
    if(authMode === 'signup'){
      if(existing){
        errEl.textContent = 'That username is already taken.';
        return;
      }
      await createUser(username, password);
      setSession(username);
    } else {
      if(!existing || existing.password !== password){
        errEl.textContent = 'Incorrect username or password.';
        return;
      }
      setSession(username);
    }
    uEl.value = ''; pEl.value = '';
    go('home');
  } catch(e){
    errEl.textContent = 'Something went wrong. Please try again.';
  } finally {
    submitBtn.disabled = false;
  }
}

function logout(){
  clearSession();
  go('home');
}

refreshAccountUI();
initCapabilities();
if(getSession()){ go('home'); }


/* ===== Notifications ===== */
const NOTIF_KEY = 'safecampus-notifs', NOTIF_ON_KEY = 'safecampus-notifs-on';
const ICONS = {
  alert:'<use href="#i-alert"/>', campus:'<use href="#i-campus"/>', tips:'<use href="#i-tips"/>',
  guide:'<use href="#i-guide"/>', clock:'<use href="#i-clock"/>'
};
let notifs = [];
let notifsOn = true;

function seedNotifs(){
  const now = Date.now(), H = 3600000;
  return [
    {id:1, title:'Campus advisory', body:'Security is patrolling the north parking lot tonight. Walk in groups after 8 PM.', icon:'campus', color:'var(--navy)', ts:now-0.4*H, read:false},
    {id:2, title:'Weather alert', body:'Heavy rain expected this afternoon. Avoid flooded walkways and low areas.', icon:'alert', color:'#5B7FE0', ts:now-2*H, read:false},
    {id:3, title:'Fire drill reminder', body:'A building-wide fire drill is scheduled tomorrow at 10:00 AM. Review the exit routes.', icon:'guide', color:'var(--coral)', ts:now-5*H, read:false},
    {id:4, title:'Set up your emergency info', body:'Add your emergency contact and medical notes in Settings so responders can help faster.', icon:'tips', color:'var(--teal)', ts:now-26*H, read:true}
  ];
}
function loadNotifs(){
  try{ notifsOn = localStorage.getItem(NOTIF_ON_KEY) !== '0'; }catch(e){}
  try{
    const raw = localStorage.getItem(NOTIF_KEY);
    notifs = raw ? JSON.parse(raw) : seedNotifs();
  }catch(e){ notifs = seedNotifs(); }
}
function saveNotifs(){ try{ localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs)); }catch(e){} }
function timeAgo(ts){
  const m = Math.floor((Date.now()-ts)/60000);
  if(m < 1) return 'Just now';
  if(m < 60) return m + ' min ago';
  const h = Math.floor(m/60);
  if(h < 24) return h + (h===1 ? ' hour ago' : ' hours ago');
  const d = Math.floor(h/24);
  return d===1 ? 'Yesterday' : d + ' days ago';
}
function unreadCount(){ return notifsOn ? notifs.filter(n=>!n.read).length : 0; }
function updateBadge(){
  const b = document.getElementById('notif-badge');
  if(!b) return;
  const n = unreadCount();
  b.textContent = n > 9 ? '9+' : n;
  b.style.display = n ? 'flex' : 'none';
}
function renderNotifs(){
  const list = document.getElementById('notif-list');
  const empty = document.getElementById('notif-empty');
  list.innerHTML = '';
  notifs.slice().sort((a,b)=>b.ts-a.ts).forEach(n=>{
    const el = document.createElement('div');
    el.className = 'notif' + (n.read ? '' : ' unread');
    el.innerHTML =
      '<div class="notif-ic" style="background:'+n.color+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[n.icon]||ICONS.alert)+'</svg></div>'+
      '<div class="notif-txt"><h3></h3><p></p><span>'+timeAgo(n.ts)+'</span></div>'+
      '<button class="notif-x" aria-label="Dismiss">&times;</button>';
    el.querySelector('h3').textContent = n.title;
    el.querySelector('p').textContent = n.body;
    el.onclick = function(){ n.read = true; saveNotifs(); renderNotifs(); };
    el.querySelector('.notif-x').onclick = function(e){
      e.stopPropagation();
      notifs = notifs.filter(x=>x.id!==n.id); saveNotifs(); renderNotifs();
    };
    list.appendChild(el);
  });
  const has = notifs.length > 0;
  empty.style.display = has ? 'none' : 'flex';
  document.getElementById('notif-empty-txt').textContent = notifsOn ? "You're all caught up." : 'Notifications are turned off in Settings.';
  document.getElementById('clear-btn').style.display = has ? '' : 'none';
  document.getElementById('mark-read').style.visibility = notifs.some(n=>!n.read) ? 'visible' : 'hidden';
  updateBadge();
}
function markAllRead(){ notifs.forEach(n=>n.read = true); saveNotifs(); renderNotifs(); }
function clearNotifs(){ notifs = []; saveNotifs(); renderNotifs(); }
function pushNotif(o){
  if(!notifsOn) return;
  notifs.push({id:Date.now(), title:o.title, body:o.body, icon:o.icon||'alert', color:o.color||'var(--coral)', ts:Date.now(), read:false});
  saveNotifs(); updateBadge();
  if(document.getElementById('notifications').classList.contains('active')) renderNotifs();
}
function toggleNotifs(){
  notifsOn = !notifsOn;
  document.getElementById('notif-switch').classList.toggle('on', notifsOn);
  try{ localStorage.setItem(NOTIF_ON_KEY, notifsOn ? '1' : '0'); }catch(e){}
  updateBadge();
}
loadNotifs();
document.getElementById('notif-switch').classList.toggle('on', notifsOn);
updateBadge();
