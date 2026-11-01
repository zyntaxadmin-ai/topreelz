'use strict';
$('#blog').onclick = authModal;

function clearSubs(){ unsubs.forEach(function(u){ try { u(); } catch(e) {} }); unsubs = []; }

/* ---------- নোটিফিকেশন ---------- */
function mergeNotes(){
  S.notes = S.notesAll.concat(S.notesMe).sort(function(a, b){ return (b.at ? b.at.seconds : 0) - (a.at ? a.at.seconds : 0); });
  var seen = 0; try { seen = +localStorage.getItem('vn_seen') || 0; } catch(e) {}
  var n = S.notes.filter(function(x){ return x.at && x.at.seconds * 1000 > seen; }).length;
  var b = $('#bnote'), d = $('.dot', b); if (d) d.remove();
  if (n) b.insertAdjacentHTML('beforeend', '<span class="dot">' + bn(n) + '</span>');
}
$('#bnote').onclick = function(){
  modal('<h3>🔔 নোটিফিকেশন</h3>' + (S.notes.length ? S.notes.slice(0, 30).map(function(n){
    return '<div class="li"><div class="t"><b>' + esc(n.title) + '</b><span class="mut sm">' + fdate(n.at) + '</span></div><div class="mut">' + esc(n.body) + '</div></div>'; }).join('') : '<p class="mut">কোনো নোটিফিকেশন নেই</p>'));
  try { localStorage.setItem('vn_seen', String(Date.now())); } catch(e) {}
  mergeNotes();
};

/* ---------- ওয়ালেট ---------- */
function walletModal(tab){
  if (!S.user) { authModal(); return; }
  var P = S.set.payment || {}, minD = +P.minDeposit || 10, minW = +P.minWithdraw || 50;
  var m = modal('<h3>💰 আমার ওয়ালেট</h3><div class="bal"><span class="mut sm">বর্তমান ব্যালেন্স</span><b id="wb">' + money(S.prof && S.prof.balance) + '</b></div>' +
    '<div class="tabs"><button data-t="dep" type="button">ডিপোজিট</button><button data-t="wd" type="button">উইথড্র</button><button data-t="his" type="button">হিস্ট্রি</button></div><div id="wbody"></div>' +
    '<button class="btn gh" id="wout" type="button">লগআউট</button>', true);
  var live = setInterval(function(){ if (!m.isConnected) { clearInterval(live); return; } var e = $('#wb', m); if (e) e.textContent = money(S.prof && S.prof.balance); }, 800);
  function show(t){
    Array.prototype.forEach.call(m.querySelectorAll('.tabs button'), function(b){ b.classList.toggle('on', b.getAttribute('data-t') === t); });
    var w = $('#wbody', m);
    if (t === 'dep') {
      w.innerHTML = '<p class="mut sm">নিচের নম্বরে Send Money করে Transaction ID দিন। অ্যাডমিন যাচাই করলে ব্যালেন্সে টাকা যোগ হবে।</p>' +
        (P.bkash ? '<div class="num"><b>bKash</b><span>' + esc(P.bkash) + '</span><button data-c="' + esc(P.bkash) + '" type="button">কপি</button></div>' : '') +
        (P.nagad ? '<div class="num"><b>Nagad</b><span>' + esc(P.nagad) + '</span><button data-c="' + esc(P.nagad) + '" type="button">কপি</button></div>' : '') +
        '<label>মাধ্যম<select id="dm"><option>bKash</option><option>Nagad</option></select></label>' +
        '<label>টাকার পরিমাণ (ন্যূনতম ' + money(minD) + ')<input id="da" type="number" inputmode="decimal"></label>' +
        '<label>Transaction ID<input id="dt" autocomplete="off"></label><button class="btn" id="dgo" type="button">ডিপোজিট রিকোয়েস্ট পাঠান</button>';
      $('#dgo', m).onclick = function(){
        var a = parseFloat($('#da', m).value), t = $('#dt', m).value.trim();
        if (!(a >= minD)) { toast('ন্যূনতম ' + money(minD)); return; }
        if (!t) { toast('Transaction ID দিন'); return; }
        db.collection('deposits').add({ uid: S.user.uid, email: S.user.email || '', method: $('#dm', m).value, trx: t, amount: a, status: 'pending', at: FV.serverTimestamp() })
          .then(function(){ toast('রিকোয়েস্ট গেছে ✓ অ্যাডমিন যাচাই করবেন'); show('his'); }).catch(function(){ toast('পাঠানো যায়নি'); });
      };
    } else if (t === 'wd') {
      w.innerHTML = '<p class="mut sm">রিকোয়েস্ট দিলে টাকা ব্যালেন্স থেকে কেটে নেওয়া হবে, অ্যাডমিন পাঠিয়ে দেবেন। বাতিল হলে ফেরত পাবেন।</p>' +
        '<label>মাধ্যম<select id="wm"><option>bKash</option><option>Nagad</option></select></label>' +
        '<label>আপনার নম্বর<input id="wn" inputmode="tel" placeholder="01XXXXXXXXX"></label>' +
        '<label>টাকার পরিমাণ (ন্যূনতম ' + money(minW) + ')<input id="wa" type="number" inputmode="decimal"></label><button class="btn" id="wgo" type="button">উইথড্র রিকোয়েস্ট পাঠান</button>';
      $('#wgo', m).onclick = function(){
        var a = parseFloat($('#wa', m).value), n = $('#wn', m).value.trim(), bal = (S.prof && S.prof.balance) || 0;
        if (!(a >= minW)) { toast('ন্যূনতম ' + money(minW)); return; }
        if (a > bal) { toast('ব্যালেন্স কম'); return; }
        if (!/^\d{11}$/.test(n.replace(/\D/g, ''))) { toast('সঠিক নম্বর দিন'); return; }
        var b = db.batch();
        b.update(db.doc('users/' + S.user.uid), { balance: FV.increment(-a) });
        b.set(db.collection('withdrawals').doc(), { uid: S.user.uid, email: S.user.email || '', method: $('#wm', m).value, number: n, amount: a, status: 'pending', at: FV.serverTimestamp() });
        b.commit().then(function(){ toast('উইথড্র রিকোয়েস্ট গেছে ✓'); show('his'); }).catch(function(){ toast('পাঠানো যায়নি'); });
      };
    } else {
      w.innerHTML = '<p class="mut">লোড হচ্ছে...</p>';
      var uid = S.user.uid;
      Promise.all([db.collection('deposits').where('uid', '==', uid).get(), db.collection('withdrawals').where('uid', '==', uid).get(), db.collection('purchases').where('uid', '==', uid).get()]).then(function(r){
        var rows = [];
        r[0].forEach(function(d){ var x = d.data(); rows.push({ at: x.at, h: '⬇️ ডিপোজিট ' + money(x.amount) + ' (' + esc(x.method) + ')', st: x.status }); });
        r[1].forEach(function(d){ var x = d.data(); rows.push({ at: x.at, h: '⬆️ উইথড্র ' + money(x.amount) + ' (' + esc(x.method) + ')', st: x.status }); });
        r[2].forEach(function(d){ var x = d.data(); rows.push({ at: x.at, h: '🎬 ' + esc(x.title || 'ভিডিও') + ' — ' + money(x.price), st: 'bought' }); });
        rows.sort(function(a, b){ return (b.at ? b.at.seconds : 0) - (a.at ? a.at.seconds : 0); });
        var L = { pending: 'অপেক্ষমাণ', approved: 'সফল', paid: 'পাঠানো হয়েছে', rejected: 'বাতিল', bought: 'কেনা' };
        w.innerHTML = rows.length ? rows.slice(0, 40).map(function(x){ return '<div class="li"><div class="t"><span>' + x.h + '</span><span class="st ' + x.st + '">' + L[x.st] + '</span></div><div class="mut sm">' + fdate(x.at) + '</div></div>'; }).join('') : '<p class="mut" style="margin-top:8px">কোনো লেনদেন নেই</p>';
      }).catch(function(){ w.innerHTML = '<p class="mut">হিস্ট্রি লোড হয়নি</p>'; });
    }
  }
  m.addEventListener('click', function(e){
    var t = e.target.closest('.tabs button'); if (t) show(t.getAttribute('data-t'));
    var c = e.target.closest('[data-c]'); if (c) copy(c.getAttribute('data-c'));
  });
  $('#wout', m).onclick = function(){ auth.signOut(); m.remove(); };
  show(tab || 'dep');
}
$('#bwal').onclick = function(){ walletModal('dep'); };
    
