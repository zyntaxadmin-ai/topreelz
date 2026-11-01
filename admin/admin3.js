'use strict';
/* ---------- ইউজার ---------- */
function vUsers(v){
  v.innerHTML = '<h2>👥 ইউজার</h2><input id="uq" placeholder="ইমেইল বা নাম দিয়ে খুঁজুন..." style="margin-bottom:12px"><div class="tbl" id="ul"></div>';
  var all = [];
  function draw(){
    var q = $('#uq').value.trim().toLowerCase(), L = $('#ul');
    var list = all.filter(function(u){ return !q || (u.email + ' ' + u.name).toLowerCase().indexOf(q) > -1; });
    L.innerHTML = list.length ? '' : '<p class="mut">কেউ নেই</p>';
    list.forEach(function(u){
      var el = document.createElement('div'); el.className = 'it';
      el.innerHTML = '<div class="inf"><b>' + esc(u.name || u.email) + '</b><span class="mut sm">' + esc(u.email) + '</span><br><span class="mut sm">UID: ' + esc(u.id) + '</span></div><b style="color:var(--ac)">' + money(u.balance) + '</b><button class="btn gh s" type="button">± ব্যালেন্স</button>';
      $('button', el).onclick = function(){
        var n = prompt('কত টাকা যোগ করবেন? (বিয়োগ করতে মাইনাস দিন, যেমন -50)', '0'); n = parseFloat(n);
        if (!n) return;
        db.doc('users/' + u.id).update({ balance: FV.increment(n) }).then(function(){ u.balance = (+u.balance || 0) + n; draw(); toast('ব্যালেন্স আপডেট ✓'); }).catch(function(e){ toast(e.message); });
      };
      L.appendChild(el);
    });
  }
  $('#uq').oninput = draw;
  db.collection('users').orderBy('createdAt', 'desc').limit(500).get().then(function(qs){ qs.forEach(function(d){ var x = d.data(); x.id = d.id; all.push(x); }); draw(); });
}

/* ---------- নোটিফিকেশন ---------- */
function vNotify(v){
  v.innerHTML = '<h2>🔔 নোটিফিকেশন পাঠান</h2><div class="card"><form id="nf"><label>কাকে<select id="nto"><option value="all">সবাইকে</option><option value="uid">নির্দিষ্ট ইউজার (UID)</option></select></label>' +
    '<label id="nuw" hidden>ইউজারের UID<input id="nuid"></label><label>টাইটেল<input id="ntitle" required></label><label>মেসেজ<textarea id="nbody" required style="font-family:inherit"></textarea></label>' +
    '<button class="btn" style="margin-top:12px" type="submit">📨 পাঠান</button></form></div><h3>সাম্প্রতিক</h3><div class="tbl" id="nl"></div>';
  $('#nto').onchange = function(){ $('#nuw').hidden = $('#nto').value !== 'uid'; };
  $('#nf').onsubmit = function(e){
    e.preventDefault();
    var to = $('#nto').value === 'all' ? 'all' : $('#nuid').value.trim(); if (!to) { toast('UID দিন'); return; }
    db.collection('notifications').add({ to: to, title: $('#ntitle').value.trim(), body: $('#nbody').value.trim(), at: FV.serverTimestamp() }).then(function(){ toast('পাঠানো হয়েছে ✓'); $('#nf').reset(); $('#nuw').hidden = true; }).catch(function(er){ toast(er.message); });
  };
  viewSubs.push(db.collection('notifications').orderBy('at', 'desc').limit(30).onSnapshot(function(qs){
    var L = $('#nl'); if (!L) return; L.innerHTML = qs.empty ? '<p class="mut">কিছু নেই</p>' : '';
    qs.forEach(function(d){ var x = d.data(), el = document.createElement('div'); el.className = 'it';
      el.innerHTML = '<div class="inf"><b>' + esc(x.title) + '</b><span class="mut sm">' + esc(x.body) + '</span><br><span class="mut sm">→ ' + (x.to === 'all' ? 'সবাই' : esc(x.to)) + ' · ' + fdate(x.at) + '</span></div><button class="btn bad s" type="button">🗑</button>';
      $('button', el).onclick = function(){ d.ref.delete(); }; L.appendChild(el); });
  }));
}

/* ---------- লাইভ চ্যাট ---------- */
function vChat(v){
  v.innerHTML = '<h2>💬 লাইভ চ্যাট</h2><div class="chat"><div class="cl" id="cl"></div><div><p class="mut" id="ch">বাম পাশ থেকে একজন বেছে নিন</p><div class="cm" id="cm" hidden></div><form class="row" id="cf" style="margin-top:8px" hidden><input id="ci" placeholder="উত্তর লিখুন..." style="flex:1" autocomplete="off"><button class="btn" type="submit">পাঠান</button></form></div></div>';
  var sel = '', msgUnsub = null;
  viewSubs.push(function(){ if (msgUnsub) msgUnsub(); });
  viewSubs.push(db.collection('chats').orderBy('lastAt', 'desc').limit(60).onSnapshot(function(qs){
    var L = $('#cl'); if (!L) return; L.innerHTML = qs.empty ? '<p class="mut">কোনো চ্যাট নেই</p>' : '';
    qs.forEach(function(d){
      var x = d.data(), b = document.createElement('button'); b.type = 'button'; if (d.id === sel) b.className = 'on';
      b.innerHTML = '<b class="' + (x.unreadAdmin ? 'un' : '') + '">' + (x.unreadAdmin ? '● ' : '') + esc(x.name || x.email || d.id) + '</b><br><span class="mut sm">' + esc((x.last || '').slice(0, 40)) + '</span>';
      b.onclick = function(){ open(d.id, x); };
      L.appendChild(b);
    });
  }));
  function open(uid, info){
    sel = uid; if (msgUnsub) msgUnsub();
    $('#ch').textContent = (info.name || '') + ' · ' + (info.email || uid); $('#cm').hidden = false; $('#cf').hidden = false;
    db.doc('chats/' + uid).set({ unreadAdmin: false }, { merge: true });
    msgUnsub = db.collection('chats/' + uid + '/msgs').orderBy('at').onSnapshot(function(qs){
      var c = $('#cm'); if (!c) return; c.innerHTML = '';
      qs.forEach(function(d){ var x = d.data(), m = document.createElement('div'); m.className = 'm ' + (x.from === 'admin' ? 'a' : 'u'); m.textContent = x.text; c.appendChild(m); });
      c.scrollTop = c.scrollHeight;
      db.doc('chats/' + uid).set({ unreadAdmin: false }, { merge: true });
    });
    $('#cf').onsubmit = function(e){
      e.preventDefault(); var t = $('#ci').value.trim(); if (!t) return; $('#ci').value = '';
      db.collection('chats/' + uid + '/msgs').add({ from: 'admin', text: t, at: FV.serverTimestamp() })
        .then(function(){ return db.doc('chats/' + uid).set({ last: '✓ ' + t, lastAt: FV.serverTimestamp(), unreadUser: true, unreadAdmin: false }, { merge: true }); }).catch(function(er){ toast(er.message); });
    };
  }
}

/* ---------- সেটিংস ---------- */
var FIELDS = [
  ['সাইট', [['siteName','সাইটের নাম','text'],['logo','লোগো ইমেজ লিংক (ঐচ্ছিক)','text'],['heroTitle','হিরো টাইটেল','text'],['heroText','হিরো বর্ণনা','text'],['announce','ঘোষণা (উপরে দেখাবে, ঐচ্ছিক)','text'],['facebook','Facebook লিংক','text'],['telegram','Telegram লিংক','text'],['youtube','YouTube লিংক','text'],['whatsapp','WhatsApp নম্বর (দেশের কোড সহ)','text']]],
  ['পেমেন্ট', [['payment.bkash','bKash নম্বর','text'],['payment.nagad','Nagad নম্বর','text'],['payment.minDeposit','ন্যূনতম ডিপোজিট','number'],['payment.minWithdraw','ন্যূনতম উইথড্র','number']]],
  ['ভিডিও চালুর আগের ভেরিফাই', [['verify.enabled','ভেরিফাই চালু','check'],['verify.url','ভেরিফাই লিংক (ক্লিক করলে এই লিংক খুলবে)','text'],['verify.seconds','অপেক্ষার সময় (সেকেন্ড)','number'],['verify.title','ভেরিফাই বক্সের লেখা','text'],['verify.label','বাটনের লেখা','text']]],
  ['বিজ্ঞাপন', [['ads.enabled','সব বিজ্ঞাপন চালু','check'],['ads.feedEvery','কয়টি ভিডিও পর পর ফিড অ্যাড','number'],['ads.top','Top (হোমপেজের উপরে)','area'],['ads.feed','Feed (ভিডিওর মাঝে)','area'],['ads.player','Player (প্লেয়ারের নিচে)','area'],['ads.bottom','Bottom (পেজের নিচে)','area'],['ads.sticky','Sticky (নিচে ভাসমান)','area']]]
];
function getPath(o, p){ return p.split('.').reduce(function(a, k){ return a == null ? undefined : a[k]; }, o); }
function setPath(o, p, val){ var k = p.split('.'), c = o; k.slice(0, -1).forEach(function(x){ c = c[x] = c[x] || {}; }); c[k[k.length - 1]] = val; }
function vSettings(v){
  db.doc('settings/site').get().then(function(s){
    var d = s.exists ? s.data() : {};
    if (getPath(d, 'verify.url') === undefined) setPath(d, 'verify.url', '');
    if (getPath(d, 'verify.seconds') === undefined) setPath(d, 'verify.seconds', 5);
    if (getPath(d, 'verify.enabled') === undefined) setPath(d, 'verify.enabled', false);
    if (getPath(d, 'verify.label') === undefined) setPath(d, 'verify.label', 'ভেরিফাই করুন');
    v.innerHTML = '<h2>⚙️ সেটিংস</h2><form id="sf">' + FIELDS.map(function(g){
      return '<div class="card"><h3 style="margin-top:0">' + g[0] + '</h3><div class="' + (g[1].some(function(f){ return f[2] === 'area'; }) ? '' : 'g2') + '">' + g[1].map(function(f){
        var val = getPath(d, f[0]);
        if (f[2] === 'check') return '<label class="chk"><input type="checkbox" data-p="' + f[0] + '"' + (val ? ' checked' : '') + '> ' + f[1] + '</label>';
        if (f[2] === 'area') return '<label>' + f[1] + '<textarea data-p="' + f[0] + '" placeholder="অ্যাড কোড (script / html) এখানে পেস্ট করুন">' + esc(val || '') + '</textarea></label>';
        return '<label>' + f[1] + '<input data-p="' + f[0] + '" data-n="' + (f[2] === 'number' ? 1 : 0) + '" value="' + esc(val == null ? '' : val) + '"></label>';
      }).join('') + '</div></div>';
    }).join('') + '<button class="btn" type="submit">💾 সেটিংস সেভ করুন</button></form>';
    $('#sf').onsubmit = function(e){
      e.preventDefault(); var out = {};
      Array.prototype.forEach.call($('#sf').querySelectorAll('[data-p]'), function(el){
        var val = el.type === 'checkbox' ? el.checked : (el.getAttribute('data-n') === '1' ? (parseFloat(el.value) || 0) : el.value.trim());
        setPath(out, el.getAttribute('data-p'), val);
      });
      db.doc('settings/site').set(out, { merge: true }).then(function(){ toast('সেভ হয়েছে ✓'); }).catch(function(er){ toast(er.message); });
    };
  });
}

/* ---------- শুরু ---------- */
auth.onAuthStateChanged(function(u){
  subs.forEach(function(s){ s(); }); subs = [];
  if (!u) { $('#login').hidden = false; $('#app').hidden = true; return; }
  db.doc('admins/' + u.uid).get().then(function(s){
    if (!s.exists) { $('#lerr').textContent = 'আপনি অ্যাডমিন নন'; auth.signOut(); return; }
    ME = u; $('#login').hidden = true; $('#app').hidden = false; buildNav(); watchBadges(); go('dash');
  }).catch(function(){ $('#lerr').textContent = 'অনুমতি নেই'; auth.signOut(); });
});
                 
