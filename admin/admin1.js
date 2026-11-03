'use strict';

var FBCFG = { apiKey: 'AIzaSyB3FcGraFaSdrvM45wqq6TOwnc38XBmidA', authDomain: 'topreelz-x7.firebaseapp.com', projectId: 'topreelz-x7', appId: '1:623475203150:web:c3254891f69eebd21eb71f' };
/* ================================================== */

var $ = function(s, r){ return (r || document).querySelector(s); };
var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
function toast(m){ var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600); }
function money(n){ return '৳' + (Math.round((+n || 0) * 100) / 100); }
function fdate(ts){ try { return (ts && ts.toDate ? ts.toDate() : new Date()).toLocaleString('en-US', {day:'numeric', month:'short', hour:'numeric', minute:'2-digit'}); } catch(e) { return ''; } }

if (!FBCFG.apiKey) { document.body.innerHTML = '<div style="padding:40px;text-align:center">⚙️ Put your Firebase config in FBCFG inside admin/index.html.</div>'; throw new Error('no config'); }
firebase.initializeApp(FBCFG);
var auth = firebase.auth(), db = firebase.firestore(), FV = firebase.firestore.FieldValue;
var ME = null, subs = [], badge = { dep: 0, wd: 0, chat: 0 };

function parseVideo(u){
  u = String(u || '').trim(); var m;
  if (/<iframe/i.test(u) && (m = u.match(/\ssrc=["']([^"']+)["']/i))) u = m[1].replace(/&amp;/g, '&');
  if (u.indexOf('//') === 0) u = 'https:' + u;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([\w-]{11})/i)))
    return { p:'youtube', embed:'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&playsinline=1', thumb:'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg' };
  if ((m = u.match(/vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)(?:\/([a-z0-9]+))?/i)))
    return { p:'vimeo', embed:'https://player.vimeo.com/video/' + m[1] + '?autoplay=1' + (m[2] ? '&h=' + m[2] : ''), thumb:'' };
  if ((m = u.match(/(?:dailymotion\.com\/(?:embed\/)?video\/|dai\.ly\/)([a-z0-9]+)/i)))
    return { p:'dailymotion', embed:'https://www.dailymotion.com/embed/video/' + m[1] + '?autoplay=1', thumb:'https://www.dailymotion.com/thumbnail/video/' + m[1] };
  if ((m = u.match(/streamable\.com\/(?:e\/|o\/)?([a-z0-9]+)/i)))
    return { p:'streamable', embed:'https://streamable.com/e/' + m[1] + '?autoplay=1', thumb:'' };
  if ((m = u.match(/tiktok\.com\/@[\w.\-]+\/video\/(\d+)/i)))
    return { p:'tiktok', embed:'https://www.tiktok.com/embed/v2/' + m[1], thumb:'' };
  if ((m = u.match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/i)))
    return { p:'instagram', embed:'https://www.instagram.com/p/' + m[1] + '/embed', thumb:'' };
  if ((m = u.match(/archive\.org\/(?:details|embed)\/([^\/?#]+)/i)))
    return { p:'archive', embed:'https://archive.org/embed/' + m[1], thumb:'https://archive.org/services/img/' + m[1] };
  if (/drive\.google\.com/.test(u) && ((m = u.match(/\/d\/([\w-]+)/)) || (m = u.match(/[?&]id=([\w-]+)/))))
    return { p:'drive', embed:'https://drive.google.com/file/d/' + m[1] + '/preview', thumb:'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w640' };
  if (/facebook\.com|fb\.watch|fb\.com/.test(u))
    return { p:'facebook', embed:'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(u) + '&show_text=false&t=0', thumb:'' };
  if (/tera|1024tera|freeterabox|4funbox|mirrobox|nephobox|momerybox/i.test(u) && ((m = u.match(/\/s\/1?([\w-]+)/)) || (m = u.match(/surl=([\w-]+)/))))
    return { p:'terabox', embed:'https://www.terabox.com/sharing/embed?surl=' + m[1] + '&autoplay=true&mute=false', thumb:'' };
  if (/dropbox\.com/i.test(u)) {
    var d = u.replace(/[?&]dl=[01]/i, '').replace(/[?&]raw=1/i, '');
    d = d + (d.indexOf('?') > -1 ? '&' : '?') + 'raw=1';
    return { p:'direct', embed:d, thumb:'' };
  }
  if (/\.(mp4|webm|mov|m4v|ogv|ogg|m3u8|mkv)(\?|#|$)/i.test(u)) return { p:'direct', embed:u, thumb:'' };
  return { p:'other', embed:u, thumb:'' };
}


$('#lf').onsubmit = function(e){
  e.preventDefault(); $('#lerr').textContent = '';
  auth.signInWithEmailAndPassword($('#le').value.trim(), $('#lp').value).catch(function(){ $('#lerr').textContent = 'Wrong email or password'; });
};


var TABS = [['dash','📊','Dashboard'],['videos','🎬','Videos'],['dep','⬇️','Deposits'],['wd','⬆️','Withdrawals'],['users','👥','Users'],['notify','🔔','Notifications'],['chat','💬','Live chat'],['settings','⚙️','Settings']];
var cur = 'dash';
function buildNav(){
  $('#side').innerHTML = '<div class="logo">▶ TopReelz</div>' + TABS.map(function(t){
    var b = badge[t[0]] ? '<span class="bg">' + badge[t[0]] + '</span>' : '';
    return '<button data-t="' + t[0] + '" class="' + (t[0] === cur ? 'on' : '') + '" type="button">' + t[1] + ' ' + t[2] + b + '</button>';
  }).join('') + '<button id="out" type="button">🚪 Log out</button>';
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
  var v = $('#view'); v.innerHTML = '<p class="mut">Loading...</p>';
  ({ dash: vDash, videos: vVideos, dep: vDep, wd: vWd, users: vUsers, notify: vNotify, chat: vChat, settings: vSettings })[t](v);
}


function vDash(v){
  Promise.all([db.collection('videos').get(), db.collection('users').limit(1000).get(), db.collection('deposits').where('status', '==', 'approved').get(), db.collection('purchases').get()]).then(function(r){
    var dep = 0; r[2].forEach(function(d){ dep += +d.data().amount || 0; });
    var sales = 0; r[3].forEach(function(d){ sales += +d.data().price || 0; });
    v.innerHTML = '<h2>📊 Dashboard</h2><div class="stats">' +
      [['Videos', r[0].size], ['Users', r[1].size], ['Total deposits', money(dep)], ['Video sales', money(sales) + ' (' + r[3].size + ' sold)']].map(function(x){ return '<div class="stat"><span class="mut sm">' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('') +
      '</div><div class="note" style="margin-top:16px">Pending deposits: ' + badge.dep + ' · Pending withdrawals: ' + badge.wd + ' · Unread chats: ' + badge.chat + '</div>';
  }).catch(function(e){ v.innerHTML = '<p>Failed to load: ' + esc(e.message) + '</p>'; });
  }
            
