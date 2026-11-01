'use strict';
/* ===== Firebase কনফিগ (থিমের কনফিগের সাথে একই) ===== */
var FBCFG = { apiKey: 'AIzaSyB3FcGraFaSdrvM45wqq6TOwnc38XBmidA', authDomain: 'topreelz-x7.firebaseapp.com', projectId: 'topreelz-x7', appId: '1:623475203150:web:c3254891f69eebd21eb71f' };
/* ================================================== */

var $ = function(s, r){ return (r || document).querySelector(s); };
var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
function toast(m){ var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600); }
function money(n){ return '৳' + (Math.round((+n || 0) * 100) / 100); }
function fdate(ts){ try { return (ts && ts.toDate ? ts.toDate() : new Date()).toLocaleString('bn-BD', {day:'numeric', month:'short', hour:'numeric', minute:'2-digit'}); } catch(e) { return ''; } }

if (!FBCFG.apiKey) { document.body.innerHTML = '<div style="padding:40px;text-align:center">⚙️ admin/index.html এর FBCFG-এ Firebase কনফিগ বসান।</div>'; throw new Error('no config'); }
firebase.initializeApp(FBCFG);
var auth = firebase.auth(), db = firebase.firestore(), FV = firebase.firestore.FieldValue;
var ME = null, subs = [], badge = { dep: 0, wd: 0, chat: 0 };

function parseVideo(u){
  u = String(u || '').trim(); var m;
  if (/drive\.google\.com/.test(u) && ((m = u.match(/\/d\/([\w-]+)/)) || (m = u.match(/[?&]id=([\w-]+)/)))) return { p:'drive', thumb:'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w640' };
  if (/facebook\.com|fb\.watch|fb\.com/.test(u)) return { p:'facebook', thumb:'' };
  if (/tera|1024tera|freeterabox|4funbox|mirrobox|nephobox|momerybox/i.test(u)) return { p:'terabox', thumb:'' };
  if (/\.(mp4|webm|mov|m3u8)(\?|#|$)/i.test(u)) return { p:'direct', thumb:'' };
  return { p:'other', thumb:'' };
}

/* ---------- লগইন ---------- */
$('#lf').onsubmit = function(e){
  e.preventDefault(); $('#lerr').textContent = '';
  auth.signInWithEmailAndPassword($('#le').value.trim(), $('#lp').value).catch(function(){ $('#lerr').textContent = 'ইমেইল বা পাসওয়ার্ড ভুল'; });
};

/* ---------- নেভিগেশন ---------- */
var TABS = [['dash','📊','ড্যাশবোর্ড'],['videos','🎬','ভিডিও'],['dep','⬇️','ডিপোজিট'],['wd','⬆️','উইথড্র'],['users','👥','ইউজার'],['notify','🔔','নোটিফিকেশন'],['chat','💬','লাইভ চ্যাট'],['settings','⚙️','সেটিংস']];
var cur = 'dash';
function buildNav(){
  $('#side').innerHTML = '<div class="logo">▶ TopReelz</div>' + TABS.map(function(t){
    var b = badge[t[0]] ? '<span class="bg">' + badge[t[0]] + '</span>' : '';
    return '<button data-t="' + t[0] + '" class="' + (t[0] === cur ? 'on' : '') + '" type="button">' + t[1] + ' ' + t[2] + b + '</button>';
  }).join('') + '<button id="out" type="button">🚪 লগআউট</button>';
  $('#out').onclick = function(){ auth.signOut(); };
  Array.prototype.forEach.call($('#side').querySelectorAll('[data-t]'), function(b){ b.onclick = function(){ go(b.getAttribute('data-t')); }; });
}
function watchBadges(){
  subs.push(db.collection('deposits').where('status', '==', 'pending').onSnapshot(function(q){ badge.dep = q.size; buildNav(); }));
  subs.push(db.collection('withdrawals').where('status', '==', 'pending').onSnapshot(function(q){ badge.wd = q.size; buildNav(); }));
  subs.push(db.collection('chats').where('unreadAdmin', '==', true).onSnapshot(function(q){ badge.chat = q.size; buildNav(); }));
}
var viewSubs = [];
function go(t){
  cur = t; buildNav();
  viewSubs.forEach(function(s){ s(); }); viewSubs = [];
  var v = $('#view'); v.innerHTML = '<p class="mut">লোড হচ্ছে...</p>';
  ({ dash: vDash, videos: vVideos, dep: vDep, wd: vWd, users: vUsers, notify: vNotify, chat: vChat, settings: vSettings })[t](v);
}

/* ---------- ড্যাশবোর্ড ---------- */
function vDash(v){
  Promise.all([db.collection('videos').get(), db.collection('users').limit(1000).get(), db.collection('deposits').where('status', '==', 'approved').get(), db.collection('purchases').get()]).then(function(r){
    var dep = 0; r[2].forEach(function(d){ dep += +d.data().amount || 0; });
    var sales = 0; r[3].forEach(function(d){ sales += +d.data().price || 0; });
    v.innerHTML = '<h2>📊 ড্যাশবোর্ড</h2><div class="stats">' +
      [['ভিডিও', r[0].size], ['ইউজার', r[1].size], ['মোট ডিপোজিট', money(dep)], ['ভিডিও বিক্রি', money(sales) + ' (' + r[3].size + 'টি)']].map(function(x){ return '<div class="stat"><span class="mut sm">' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('') +
      '</div><div class="note" style="margin-top:16px">অপেক্ষমাণ ডিপোজিট: ' + badge.dep + ' · অপেক্ষমাণ উইথড্র: ' + badge.wd + ' · অপঠিত চ্যাট: ' + badge.chat + '</div>';
  }).catch(function(e){ v.innerHTML = '<p>লোড হয়নি: ' + esc(e.message) + '</p>'; });
                                                  }
  
