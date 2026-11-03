'use strict';

function vUsers(v){
  v.innerHTML = '<h2>👥 Users</h2><input id="uq" placeholder="Search by email or name..." style="margin-bottom:12px"><div class="tbl" id="ul"></div>';
  var all = [];
  function draw(){
    var q = $('#uq').value.trim().toLowerCase(), L = $('#ul');
    var list = all.filter(function(u){ return !q || (u.email + ' ' + u.name).toLowerCase().indexOf(q) > -1; });
    L.innerHTML = list.length ? '' : '<p class="mut">No users</p>';
    list.forEach(function(u){
      var el = document.createElement('div'); el.className = 'it';
      el.innerHTML = '<div class="inf"><b>' + esc(u.name || u.email) + '</b><span class="mut sm">' + esc(u.email) + '</span><br><span class="mut sm">UID: ' + esc(u.id) + '</span></div><b style="color:var(--ac)">' + money(u.balance) + '</b><button class="btn gh s" type="button">± Balance</button>';
      $('button', el).onclick = function(){
        var n = prompt('How much to add? (use minus to subtract, e.g. -50)', '0'); n = parseFloat(n);
        if (!n) return;
        db.doc('users/' + u.id).update({ balance: FV.increment(n) }).then(function(){ u.balance = (+u.balance || 0) + n; draw(); toast('Balance updated ✓'); }).catch(function(e){ toast(e.message); });
      };
      L.appendChild(el);
    });
  }
  $('#uq').oninput = draw;
  db.collection('users').orderBy('createdAt', 'desc').limit(500).get().then(function(qs){ qs.forEach(function(d){ var x = d.data(); x.id = d.id; all.push(x); }); draw(); });
}


function vNotify(v){
  v.innerHTML = '<h2>🔔 Send notification</h2><div class="card"><form id="nf"><label>To<select id="nto"><option value="all">Everyone</option><option value="uid">Specific user (UID)</option></select></label>' +
    '<label id="nuw" hidden>User UID<input id="nuid"></label><label>Title<input id="ntitle" required></label><label>Message<textarea id="nbody" required style="font-family:inherit"></textarea></label>' +
    '<button class="btn" style="margin-top:12px" type="submit">📨 Send</button></form></div><h3>Recent</h3><div class="tbl" id="nl"></div>';
  $('#nto').onchange = function(){ $('#nuw').hidden = $('#nto').value !== 'uid'; };
  $('#nf').onsubmit = function(e){
    e.preventDefault();
    var to = $('#nto').value === 'all' ? 'all' : $('#nuid').value.trim(); if (!to) { toast('Enter UID'); return; }
    db.collection('notifications').add({ to: to, title: $('#ntitle').value.trim(), body: $('#nbody').value.trim(), at: FV.serverTimestamp() }).then(function(){ toast('Sent ✓'); $('#nf').reset(); $('#nuw').hidden = true; }).catch(function(er){ toast(er.message); });
  };
  viewSubs.push(db.collection('notifications').orderBy('at', 'desc').limit(30).onSnapshot(function(qs){
    var L = $('#nl'); if (!L) return; L.innerHTML = qs.empty ? '<p class="mut">Nothing here</p>' : '';
    qs.forEach(function(d){ var x = d.data(), el = document.createElement('div'); el.className = 'it';
      el.innerHTML = '<div class="inf"><b>' + esc(x.title) + '</b><span class="mut sm">' + esc(x.body) + '</span><br><span class="mut sm">→ ' + (x.to === 'all' ? 'Everyone' : esc(x.to)) + ' · ' + fdate(x.at) + '</span></div><button class="btn bad s" type="button">🗑</button>';
      $('button', el).onclick = function(){ d.ref.delete(); }; L.appendChild(el); });
  }));
}


function vChat(v){
  v.innerHTML = '<h2>💬 Live chat</h2><div class="chat"><div class="cl" id="cl"></div><div><p class="mut" id="ch">Pick a user from the left</p><div class="cm" id="cm" hidden></div><form class="row" id="cf" style="margin-top:8px" hidden><input id="ci" placeholder="Type a reply..." style="flex:1" autocomplete="off"><button class="btn" type="submit">Send</button></form></div></div>';
  var sel = '', msgUnsub = null;
  viewSubs.push(function(){ if (msgUnsub) msgUnsub(); });
  viewSubs.push(db.collection('chats').orderBy('lastAt', 'desc').limit(60).onSnapshot(function(qs){
    var L = $('#cl'); if (!L) return; L.innerHTML = qs.empty ? '<p class="mut">No chats</p>' : '';
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


var FIELDS = [
  ['Site', [['siteName','Site name','text'],['logo','Logo image link (optional)','text'],['heroTitle','Hero title','text'],['heroText','Hero text','text'],['announce','Announcement (shown at top, optional)','text'],['facebook','Facebook link','text'],['telegram','Telegram link','text'],['youtube','YouTube link','text'],['whatsapp','WhatsApp number (with country code)','text']]],
  ['Payment', [['payment.bkash','bKash number','text'],['payment.nagad','Nagad number','text'],['payment.minDeposit','Minimum deposit','number'],['payment.minWithdraw','Minimum withdraw','number']]],
  ['Verify step before video', [['verify.enabled','Verify enabled','check'],['verify.url','Verify link (opens when clicked)','text'],['verify.seconds','Wait time (seconds)','number'],['verify.title','Verify box text','text'],['verify.label','Button text','text']]],
  ['Ads', [['ads.enabled','Ads enabled','check'],['ads.feedEvery','Show a feed ad after every N videos','number'],['ads.top','Top (above homepage)','area'],['ads.feed','Feed (between videos)','area'],['ads.player','Player (below player)','area'],['ads.bottom','Bottom (page bottom)','area'],['ads.sticky','Sticky (floating bottom)','area']]]
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
    v.innerHTML = '<h2>⚙️ Settings</h2><form id="sf">' + FIELDS.map(function(g){
      return '<div class="card"><h3 style="margin-top:0">' + g[0] + '</h3><div class="' + (g[1].some(function(f){ return f[2] === 'area'; }) ? '' : 'g2') + '">' + g[1].map(function(f){
        var val = getPath(d, f[0]);
        if (f[2] === 'check') return '<label class="chk"><input type="checkbox" data-p="' + f[0] + '"' + (val ? ' checked' : '') + '> ' + f[1] + '</label>';
        if (f[2] === 'area') return '<label>' + f[1] + '<textarea data-p="' + f[0] + '" placeholder="Paste ad code (script / html) here">' + esc(val || '') + '</textarea></label>';
        return '<label>' + f[1] + '<input data-p="' + f[0] + '" data-n="' + (f[2] === 'number' ? 1 : 0) + '" value="' + esc(val == null ? '' : val) + '"></label>';
      }).join('') + '</div></div>';
    }).join('') + '<button class="btn" type="submit">💾 Save settings</button></form>';
    $('#sf').onsubmit = function(e){
      e.preventDefault(); var out = {};
      Array.prototype.forEach.call($('#sf').querySelectorAll('[data-p]'), function(el){
        var val = el.type === 'checkbox' ? el.checked : (el.getAttribute('data-n') === '1' ? (parseFloat(el.value) || 0) : el.value.trim());
        setPath(out, el.getAttribute('data-p'), val);
      });
      db.doc('settings/site').set(out, { merge: true }).then(function(){ toast('Saved ✓'); }).catch(function(er){ toast(er.message); });
    };
  });
}


auth.onAuthStateChanged(function(u){
  subs.forEach(function(s){ s(); }); subs = [];
  if (!u) { $('#login').hidden = false; $('#app').hidden = true; return; }
  db.doc('admins/' + u.uid).get().then(function(s){
    if (!s.exists) { $('#lerr').textContent = 'You are not an admin'; auth.signOut(); return; }
    ME = u; $('#login').hidden = true; $('#app').hidden = false; buildNav(); watchBadges(); go('dash');
  }).catch(function(){ $('#lerr').textContent = 'Permission denied'; auth.signOut(); });
});
        
