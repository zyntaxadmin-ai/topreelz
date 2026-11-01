'use strict';
/* ============ Firebase কনফিগ (Firebase Console > Project settings > Web app থেকে) ============ */
var FBCFG = {
  apiKey: 'AIzaSyB3FcGraFaSdrvM45wqq6TOwnc38XBmidA',
  authDomain: 'topreelz-x7.firebaseapp.com',
  projectId: 'topreelz-x7',
  appId: '1:623475203150:web:c3254891f69eebd21eb71f'
};
/* ওয়ালেট/ডিপোজিট/উইথড্র আপাতত বন্ধ। পরে চালু করতে false কে true করুন */
var WALLET_ON = false;
/* ================================================================================================ */

var D = document;
var $ = function(s, r){ return (r || D).querySelector(s); };
var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var BN = '০১২৩৪৫৬৭৮৯';
function bn(n){ return String(n).replace(/\d/g, function(d){ return BN.charAt(+d); }); }
function money(n){ return '৳' + bn(Math.round((+n || 0) * 100) / 100); }
function toast(m){ var t = D.createElement('div'); t.className = 'toast'; t.textContent = m; D.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2800); }
function copy(txt){
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function(){ toast('কপি হয়েছে ✓'); }); return; }
  var i = D.createElement('textarea'); i.value = txt; D.body.appendChild(i); i.select();
  try { D.execCommand('copy'); toast('কপি হয়েছে ✓'); } catch(e) {} i.remove();
}
function fdate(ts){ try { var d = ts && ts.toDate ? ts.toDate() : new Date(); return d.toLocaleString('bn-BD', {day:'numeric', month:'short', hour:'numeric', minute:'2-digit'}); } catch(e) { return ''; } }

if (!FBCFG.apiKey || !FBCFG.projectId) {
  $('main .wrap').innerHTML = '<div class="setup"><h2>⚙️ Firebase সেটআপ বাকি</h2><p class="mut" style="margin-top:8px">থিমের কোডে FBCFG অংশে আপনার Firebase কনফিগ বসান।</p></div>';
  throw new Error('FBCFG missing');
}
firebase.initializeApp(FBCFG);
var auth = firebase.auth(), db = firebase.firestore(), FV = firebase.firestore.FieldValue;

var S = { user: null, prof: null, set: {}, videos: [], byId: {}, notes: [], notesAll: [], notesMe: [], chatOpen: false };
var unsubs = [];

/* ---------- ভিডিও লিংক বিশ্লেষণ ---------- */
function parseVideo(u){
  u = String(u || '').trim(); var m;
  if (/drive\.google\.com/.test(u) && ((m = u.match(/\/d\/([\w-]+)/)) || (m = u.match(/[?&]id=([\w-]+)/))))
    return { p:'drive', embed:'https://drive.google.com/file/d/' + m[1] + '/preview', thumb:'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w640' };
  if (/facebook\.com|fb\.watch|fb\.com/.test(u))
    return { p:'facebook', embed:'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(u) + '&show_text=false&t=0', thumb:'' };
  if (/tera|1024tera|freeterabox|4funbox|mirrobox|nephobox|momerybox/i.test(u) && ((m = u.match(/\/s\/1?([\w-]+)/)) || (m = u.match(/surl=([\w-]+)/))))
    return { p:'terabox', embed:'https://www.terabox.com/sharing/embed?surl=' + m[1] + '&autoplay=true&mute=false', thumb:'' };
  if (/\.(mp4|webm|mov|m3u8)(\?|#|$)/i.test(u)) return { p:'direct', embed:u, thumb:'' };
  return { p:'other', embed:u, thumb:'' };
}
var PICON = { drive:'📁', facebook:'📘', terabox:'📦', direct:'🎞', other:'🎬' };

/* ---------- বিজ্ঞাপন ---------- */
var seenSrc = {};
function adEl(pos){
  var a = S.set.ads || {};
  if (!a.enabled || !a[pos]) return null;
  var d = D.createElement('div'); d.className = 'ad'; d.innerHTML = '<small>বিজ্ঞাপন</small><div class="in"></div>';
  var inn = $('.in', d); inn.innerHTML = a[pos];
  Array.prototype.slice.call(inn.querySelectorAll('script')).forEach(function(o){
    var n = D.createElement('script');
    Array.prototype.slice.call(o.attributes).forEach(function(at){ n.setAttribute(at.name, at.value); });
    n.text = o.text; o.parentNode.replaceChild(n, o);
  });
  return d;
}
function putAd(id, pos){ var h = $(id); if (!h) return; h.innerHTML = ''; var e = adEl(pos); if (e) h.appendChild(e); }

/* ---------- মডাল ---------- */
function modal(html, big){
  var m = D.createElement('div'); m.className = 'mo';
  m.innerHTML = '<div class="box' + (big ? ' big' : '') + '"><button class="x" type="button" aria-label="Close">✕</button>' + html + '</div>';
  m.addEventListener('click', function(e){ if (e.target === m || e.target.closest('.x')) m.remove(); });
  $('#root').appendChild(m);
  return m;
}

/* ---------- সেটিংস ও ভিডিও লোড ---------- */
function applySettings(){
  var s = S.set;
  var br = $('#brand');
  br.innerHTML = s.logo ? '<img src="' + esc(s.logo) + '" alt="">' : '<i>▶</i> ' + esc(s.siteName || 'TopReelz');
  if (s.siteName) D.title = s.siteName;
  if (s.heroTitle) $('#hT').textContent = s.heroTitle;
  if (s.heroText) $('#hP').textContent = s.heroText;
  if (s.announce) { var a = $('#ann'); a.textContent = '📢 ' + s.announce; a.style.display = ''; }
  var links = [['Facebook', s.facebook], ['Telegram', s.telegram], ['YouTube', s.youtube], ['WhatsApp', s.whatsapp ? 'https://wa.me/' + String(s.whatsapp).replace(/\D/g, '') : '']].filter(function(x){ return x[1]; });
  $('#so').innerHTML = links.map(function(x){ return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + x[0] + '</a>'; }).join('');
  $('#fcopy').textContent = '© ' + new Date().getFullYear() + ' ' + (s.siteName || 'TopReelz');
  putAd('#adtop', 'top'); putAd('#adbot', 'bottom');
  var old = $('.stk'); if (old) old.remove();
  var st = adEl('sticky');
  if (st) { var w = D.createElement('div'); w.className = 'stk'; w.appendChild(st); var b = D.createElement('button'); b.type = 'button'; b.textContent = '✕'; b.onclick = function(){ w.remove(); }; w.appendChild(b); D.body.appendChild(w); }
}
function thumbHtml(v){
  var t = v.thumb || v.thumbAuto, h = '<div class="ph">' + (PICON[v.platform] || '🎬') + '</div>';
  if (t) return h + '<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="' + esc(t) + '" alt="" onerror="this.style.display=\'none\'">';
  if (!v.paid && v.platform === 'direct' && v.url) return h + '<video muted playsinline preload="metadata" src="' + esc(v.url) + '#t=0.8"></video>';
  return h;
}
function card(v){
  return '<a class="vc' + (v.ratio === '9/16' ? ' pt' : '') + '" href="#v=' + esc(v.id) + '"><div class="th">' + thumbHtml(v) + '<span class="pl">▶</span>' +
    (v.paid ? '<span class="bd p">🔒 ' + money(v.price) + '</span>' : '<span class="bd f">FREE</span>') +
    (v.views ? '<span class="vn">👁 ' + bn(v.views) + '</span>' : '') +
    '<div class="cap"><h3>' + esc(v.title) + '</h3></div></div></a>';
}
function renderGrid(){
  var q = ($('#q').value || '').trim().toLowerCase(), g = $('#grid');
  var list = S.videos.filter(function(v){ return !q || String(v.title).toLowerCase().indexOf(q) > -1; });
  if (!list.length) { g.innerHTML = '<div class="empty">😕 কোনো ভিডিও পাওয়া যায়নি</div>'; return; }
  g.innerHTML = list.map(card).join('');
  var every = +((S.set.ads || {}).feedEvery) || 6;
  Array.prototype.slice.call(g.querySelectorAll('.vc')).forEach(function(c, i){
    if ((i + 1) % every === 0) { var a = adEl('feed'); if (a) { a.className += ' feed'; c.parentNode.insertBefore(a, c.nextSibling); } }
  });
}
function loadAll(){
  db.doc('settings/site').get().then(function(s){ S.set = s.exists ? s.data() : {}; }).catch(function(){ S.set = {}; }).then(function(){
    applySettings();
    return db.collection('videos').orderBy('createdAt', 'desc').limit(300).get();
  }).then(function(qs){
    S.videos = []; S.byId = {};
    qs.forEach(function(d){ var v = d.data(); v.id = d.id; if (!v.hidden && v.platform !== 'youtube') { S.videos.push(v); S.byId[v.id] = v; } });
    renderGrid(); route();
  }).catch(function(){ $('#grid').innerHTML = '<div class="empty">ভিডিও লোড করা যায়নি</div>'; });
}
$('#q').addEventListener('input', renderGrid);

/* ---------- লগইন ---------- */
function errMsg(e){
  var c = (e && e.code) || '';
  if (/wrong-password|invalid-credential|user-not-found/.test(c)) return 'ইমেইল বা পাসওয়ার্ড ভুল';
  if (/email-already/.test(c)) return 'এই ইমেইল আগে থেকেই আছে';
  if (/weak-password/.test(c)) return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর দিন';
  if (/invalid-email/.test(c)) return 'ইমেইল ঠিক নয়';
  if (/popup/.test(c)) return 'পপআপ বন্ধ হয়েছে, আবার চেষ্টা করুন';
  return 'সমস্যা হয়েছে: ' + (c || 'আবার চেষ্টা করুন');
}
function authModal(){
  var mode = 'in';
  var m = modal('<h3>🔐 অ্যাকাউন্ট</h3><div class="tabs"><button class="on" data-m="in" type="button">লগইন</button><button data-m="up" type="button">নতুন অ্যাকাউন্ট</button></div>' +
    '<div id="anm" style="display:none"><label>নাম<input id="an" autocomplete="name"></label></div>' +
    '<label>ইমেইল<input id="ae" type="email" autocomplete="email"></label><label>পাসওয়ার্ড<input id="ap" type="password" autocomplete="current-password"></label>' +
    '<button class="btn" id="ago" type="button">লগইন করুন</button>');
  Array.prototype.forEach.call(m.querySelectorAll('.tabs button'), function(b){
    b.onclick = function(){ mode = b.getAttribute('data-m'); Array.prototype.forEach.call(m.querySelectorAll('.tabs button'), function(x){ x.classList.toggle('on', x === b); });
      $('#anm', m).style.display = mode === 'up' ? '' : 'none'; $('#ago', m).textContent = mode === 'up' ? 'অ্যাকাউন্ট খুলুন' : 'লগইন করুন'; };
  });
  $('#ago', m).onclick = function(){
    var e = $('#ae', m).value.trim(), p = $('#ap', m).value;
    if (!e || !p) { toast('ইমেইল ও পাসওয়ার্ড দিন'); return; }
    var pr = mode === 'up'
      ? auth.createUserWithEmailAndPassword(e, p).then(function(c){ return c.user.updateProfile({ displayName: $('#an', m).value.trim() }); })
      : auth.signInWithEmailAndPassword(e, p);
    pr.then(function(){ m.remove(); }).catch(function(er){ toast(errMsg(er)); });
  };
}
