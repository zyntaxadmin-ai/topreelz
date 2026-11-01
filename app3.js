'use strict';
/* ---------- ভিডিও প্লেয়ার পেজ ---------- */
var gateDone = {}, curId = '';
function route(force){
  var m = location.hash.match(/^#v=([\w-]+)/);
  if (!m) { var o = D.getElementById('pgv'); if (o) o.remove(); curId = ''; D.body.style.overflow = ''; return; }
  if (!force && curId === m[1] && D.getElementById('pgv')) return;
  openVideo(m[1]);
}
window.addEventListener('hashchange', function(){ route(); });

function openVideo(id){
  curId = id;
  var old = D.getElementById('pgv'); if (old) old.remove();
  D.body.style.overflow = 'hidden';
  var pg = D.createElement('div'); pg.className = 'pg'; pg.id = 'pgv';
  pg.innerHTML = '<div class="top"><button class="ib" id="pback" type="button">← ফিরুন</button><b id="ptt"></b></div><div class="pw"><div class="stage" id="stg"><div class="ov"><div class="spin"></div></div></div><div id="pinfo"></div></div>';
  $('#root').appendChild(pg);
  $('#pback', pg).onclick = function(){ if (history.length > 1 && /#v=/.test(location.hash)) { history.back(); setTimeout(function(){ if (/#v=/.test(location.hash)) location.hash = ''; }, 150); } else location.hash = ''; };
  var vp = S.byId[id] ? Promise.resolve(S.byId[id]) : db.doc('videos/' + id).get().then(function(s){ if (!s.exists) return null; var v = s.data(); v.id = s.id; return v; });
  vp.then(function(v){
    if (!v || v.hidden || v.platform === 'youtube') { $('#stg', pg).innerHTML = '<div class="ov"><div class="ic">😕</div><p>ভিডিওটি পাওয়া যায়নি</p></div>'; return; }
    renderPlayer(pg, v);
  }).catch(function(){ $('#stg', pg).innerHTML = '<div class="ov"><p>লোড করা যায়নি</p></div>'; });
}

function renderPlayer(pg, v){
  var stg = $('#stg', pg), pt = v.ratio === '9/16';
  if (pt) stg.className = 'stage pt';
  $('#ptt', pg).textContent = v.title;
  var u = encodeURIComponent(location.origin + '/#v=' + v.id), t = encodeURIComponent(v.title);
  $('#pinfo', pg).innerHTML = '<h1 class="ptitle">' + esc(v.title) + '</h1><div class="meta"><span>' + (v.paid ? '🔒 পেইড ' + money(v.price) : '🆓 ফ্রি') + '</span><span>' + (PICON[v.platform] || '') + ' ' + esc(v.platform || '') + '</span>' + (v.views ? '<span>👁 ' + bn(v.views) + ' ভিউ</span>' : '') + '</div>' +
    (v.desc ? '<p class="mut" style="margin-top:10px;white-space:pre-line">' + esc(v.desc) + '</p>' : '') +
    (v.license ? '<p class="mut sm" style="margin-top:8px">📄 লাইসেন্স: ' + esc(v.license) + (/^https?:\/\//i.test(v.srcLink || '') ? ' · <a href="' + esc(v.srcLink) + '" target="_blank" rel="noopener nofollow" style="color:var(--ac);text-decoration:underline">সোর্স</a>' : '') + '</p>' : '') +
    '<div id="padp"></div><div class="shr"><b>শেয়ার:</b><a style="background:#1877f2" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '">Facebook</a><a style="background:#25d366" target="_blank" rel="noopener" href="https://wa.me/?text=' + t + '%20' + u + '">WhatsApp</a><a style="background:#229ed9" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + u + '&text=' + t + '">Telegram</a><button style="background:#2a2a36" id="pcp" type="button">Copy Link</button></div><div id="padb"></div>';
  $('#pcp', pg).onclick = function(){ copy(location.origin + '/#v=' + v.id); };
  putAd('#padp', 'player'); putAd('#padb', 'bottom');
  var bg = v.thumb || v.thumbAuto;

  function lockedView(){
    var P = S.set.payment || {};
    stg.innerHTML = (bg ? '<img referrerpolicy="no-referrer" src="' + esc(bg) + '" alt="" style="filter:blur(6px) brightness(.5)">' : '') +
      '<div class="ov"><div class="ic">🔒</div><b class="serif" style="color:var(--ac);letter-spacing:2px">পেইড ভিডিও</b><div class="cnt">' + money(v.price) + '</div>' +
      (S.user ? '<p class="mut sm">আপনার ব্যালেন্স: ' + money(S.prof && S.prof.balance) + '</p><button class="btn" id="buy" type="button">🔓 ' + money(v.price) + ' দিয়ে আনলক করুন</button><button class="btn gh" id="addm" type="button">💰 ব্যালেন্স যোগ করুন</button>'
                : '<p class="mut sm">আনলক করতে লগইন করুন</p><button class="btn" id="lg" type="button">লগইন / অ্যাকাউন্ট</button>') + '</div>';
    var b = $('#buy', stg), l = $('#lg', stg), a = $('#addm', stg);
    if (l) l.onclick = authModal;
    if (a) a.onclick = function(){ walletModal('dep'); };
    if (b) b.onclick = function(){
      var bal = (S.prof && S.prof.balance) || 0;
      if (bal < v.price) { toast('ব্যালেন্স কম, আগে ডিপোজিট করুন'); walletModal('dep'); return; }
      if (!confirm(money(v.price) + ' কেটে ভিডিও আনলক করবেন?')) return;
      b.disabled = true;
      var bt = db.batch();
      bt.update(db.doc('users/' + S.user.uid), { balance: FV.increment(-v.price) });
      bt.set(db.doc('purchases/' + S.user.uid + '_' + v.id), { uid: S.user.uid, vid: v.id, title: v.title, price: v.price, at: FV.serverTimestamp() });
      bt.commit().then(function(){ toast('আনলক হয়েছে ✓ 🎉'); gateView(); }).catch(function(){ b.disabled = false; toast('কেনা যায়নি, আবার চেষ্টা করুন'); });
    };
  }

  function gateView(){
    var V = S.set.verify || {};
    if (V.enabled === false || !V.url || gateDone[v.id]) { play(); return; }
    var secs = +V.seconds || 5;
    stg.innerHTML = (bg ? '<img referrerpolicy="no-referrer" src="' + esc(bg) + '" alt="" style="filter:brightness(.45)">' : '') +
      '<div class="ov"><div class="ic">🛡️</div><b class="serif" style="font-size:1.15rem">' + esc(V.title || 'ভিডিও চালু করতে ভেরিফাই করুন') + '</b>' +
      '<p class="mut sm">বাটনে ক্লিক করলে স্পন্সর পেজ খুলবে, ' + bn(secs) + ' সেকেন্ড পর ভিডিও চালু হবে।</p><button class="btn" id="vf" type="button">✅ ' + esc(V.label || 'ভেরিফাই করুন') + '</button></div>';
    $('#vf', stg).onclick = function(){
      try { window.open(V.url, '_blank', 'noopener'); } catch(e) {}
      var left = secs;
      stg.innerHTML = (bg ? '<img referrerpolicy="no-referrer" src="' + esc(bg) + '" alt="" style="filter:brightness(.4)">' : '') +
        '<div class="ov"><div class="cnt" id="cd">' + bn(left) + '</div><p class="mut">অপেক্ষা করুন...</p></div>';
      var iv = setInterval(function(){
        if (!stg.isConnected) { clearInterval(iv); return; }
        left--;
        if (left > 0) { var c = $('#cd', stg); if (c) c.textContent = bn(left); return; }
        clearInterval(iv); gateDone[v.id] = 1;
        stg.innerHTML = (bg ? '<img referrerpolicy="no-referrer" src="' + esc(bg) + '" alt="" style="filter:brightness(.5)">' : '') + '<div class="ov"><div class="ic">✅</div><p>ভেরিফাই সম্পন্ন</p><button class="btn" id="go" type="button">▶ ভিডিও চালান</button></div>';
        $('#go', stg).onclick = play;
      }, 1000);
    };
  }

  function embedHtml(url){
    var i = parseVideo(url);
    if (i.p === 'direct') return '<video src="' + esc(i.embed) + '" controls autoplay playsinline controlsList="nodownload"></video>';
    return '<iframe src="' + esc(i.embed) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>';
  }
  function play(){
    stg.innerHTML = '<div class="ov"><div class="spin"></div></div>';
    var up = v.paid ? db.doc('videos/' + v.id + '/private/src').get().then(function(s){ return s.exists ? s.data().url : ''; }) : Promise.resolve(v.url);
    up.then(function(url){
      if (!url) { stg.innerHTML = '<div class="ov"><div class="ic">⚠️</div><p>ভিডিও লিংক পাওয়া যায়নি</p></div>'; return; }
      stg.innerHTML = embedHtml(url);
      if (!stg.dataset.v) { stg.dataset.v = '1'; db.doc('videos/' + v.id).update({ views: FV.increment(1) }).catch(function(){}); }
    }).catch(function(){ lockedView(); toast('আনলক করা নেই'); });
  }

  if (!v.paid) { gateView(); return; }
  if (!S.user) { lockedView(); return; }
  db.doc('purchases/' + S.user.uid + '_' + v.id).get().then(function(s){ if (s.exists) gateView(); else lockedView(); }).catch(function(){ lockedView(); });
}

/* ---------- লাইভ চ্যাট ---------- */
var chatUnsub = null, chatBox = null;
function watchChat(){
  if (!S.user) return;
  unsubs.push(db.doc('chats/' + S.user.uid).onSnapshot(function(s){
    var d = s.exists && s.data().unreadUser && !S.chatOpen;
    $('#fdot').style.display = d ? '' : 'none';
  }, function(){}));
}
function openChat(){
  if (!S.user) { authModal(); return; }
  if (chatBox) { closeChat(); return; }
  S.chatOpen = true; $('#fdot').style.display = 'none';
  var c = D.createElement('div'); c.className = 'chat';
  c.innerHTML = '<div class="h"><span>💬 লাইভ চ্যাট</span><button type="button" id="cx">✕</button></div><div class="ms" id="cms"><div class="m a">হ্যালো! কীভাবে সাহায্য করতে পারি?</div></div><form id="cf"><input id="ci" placeholder="মেসেজ লিখুন..." autocomplete="off"><button type="submit">পাঠান</button></form>';
  D.body.appendChild(c); chatBox = c;
  $('#cx', c).onclick = closeChat;
  var uid = S.user.uid, ref = db.doc('chats/' + uid);
  ref.set({ unreadUser: false }, { merge: true }).catch(function(){});
  chatUnsub = ref.collection('msgs').orderBy('at').onSnapshot(function(qs){
    var h = '<div class="m a">হ্যালো! কীভাবে সাহায্য করতে পারি?</div>';
    qs.forEach(function(d){ var x = d.data(); h += '<div class="m ' + (x.from === 'user' ? 'u' : 'a') + '">' + esc(x.text) + '</div>'; });
    var ms = $('#cms', c); if (!ms) return; ms.innerHTML = h; ms.scrollTop = ms.scrollHeight;
    ref.set({ unreadUser: false }, { merge: true }).catch(function(){});
  }, function(){});
  $('#cf', c).onsubmit = function(e){
    e.preventDefault();
    var i = $('#ci', c), t = i.value.trim(); if (!t) return; i.value = '';
    ref.set({ name: S.user.displayName || (S.prof && S.prof.name) || '', email: S.user.email || '', last: t, lastAt: FV.serverTimestamp(), unreadAdmin: true }, { merge: true })
      .then(function(){ return ref.collection('msgs').add({ from: 'user', text: t, at: FV.serverTimestamp() }); }).catch(function(){ toast('পাঠানো যায়নি'); });
  };
}
function closeChat(){
  S.chatOpen = false;
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  if (chatBox) { chatBox.remove(); chatBox = null; }
}
$('#fab').onclick = openChat;

/* ---------- শুরু ---------- */
auth.onAuthStateChanged(function(u){
  clearSubs(); S.user = u; S.prof = null; S.notesMe = [];
  $('#blog').style.display = u ? 'none' : ''; $('#bwal').style.display = (WALLET_ON && u) ? '' : 'none';
  if (u) {
    var ref = db.doc('users/' + u.uid);
    ref.get().then(function(s){
      if (!s.exists) return ref.set({ email: u.email || '', name: u.displayName || '', balance: 0, createdAt: FV.serverTimestamp() });
    }).catch(function(){}).then(function(){
      unsubs.push(ref.onSnapshot(function(s){ S.prof = s.exists ? s.data() : { balance: 0 }; $('#balv').textContent = money(S.prof.balance); }, function(){}));
    });
    unsubs.push(db.collection('notifications').where('to', '==', u.uid).onSnapshot(function(qs){ S.notesMe = qs.docs.map(function(d){ return d.data(); }); mergeNotes(); }, function(){}));
    watchChat();
  } else { $('#balv').textContent = money(0); mergeNotes(); }
  if (D.getElementById('pgv')) route(true);
});
db.collection('notifications').where('to', '==', 'all').onSnapshot(function(qs){ S.notesAll = qs.docs.map(function(d){ return d.data(); }); mergeNotes(); }, function(){});
loadAll();
