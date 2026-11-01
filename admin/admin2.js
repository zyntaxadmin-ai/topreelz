'use strict';
/* ---------- ভিডিও ---------- */
function vVideos(v){
  v.innerHTML = '<h2>🎬 ভিডিও</h2><div class="card"><h3 id="vft" style="margin-top:0">➕ নতুন ভিডিও</h3><form id="vf">' +
    '<div class="g2"><label>টাইটেল<input id="vtitle" required></label>' +
    '<label>ভিডিও লিংক (Terabox / Google Drive / Facebook / সরাসরি mp4)<input id="vurl" required placeholder="https://..."></label>' +
    '<label>থাম্বনেইল ইমেজ লিংক (ঐচ্ছিক — না দিলে ভিডিও থেকেই থাম্বনেইল হবে)<input id="vthumb" placeholder="https://..."></label>' +
    '<label>সোর্স লিংক (ভিডিও যেখান থেকে নিয়েছেন, বাধ্যতামূলক)<input id="vsrc" required placeholder="https://..."></label><label>লাইসেন্স (বাধ্যতামূলক)<select id="vlic" required><option value="">-- বেছে নিন --</option><option>CC0 / Public Domain</option><option>Pexels License</option><option>Pixabay License</option><option>Mixkit License</option><option>CC BY (বাণিজ্যিক ব্যবহার অনুমোদিত)</option><option>ক্রিয়েটরের লিখিত অনুমতি</option><option>নিজের বানানো</option></select></label><label>ভিডিও সাইজ<select id="vratio"><option value="16/9">ল্যান্ডস্কেপ (১৬:৯)</option><option value="9/16">পোর্ট্রেট / Shorts (৯:১৬)</option></select></label>' +
    '<label>ধরন<select id="vtype"><option value="free">ফ্রি</option><option value="paid">পেইড (লক করা)</option></select></label>' +
    '<label id="vpw" hidden>প্রাইস (টাকা)<input id="vprice" type="number" min="1" step="1"></label></div>' +
    '<label>বর্ণনা (ঐচ্ছিক)<textarea id="vdesc" style="min-height:60px;font-family:inherit"></textarea></label>' +
    '<label class="chk"><input id="vhide" type="checkbox"> সাইটে লুকিয়ে রাখুন (Hidden)</label>' +
    '<p class="mut sm" id="vdet" style="margin-top:8px"></p>' +
    '<div class="row" style="margin-top:12px"><button class="btn" type="submit" id="vsave">💾 সেভ করুন</button><button class="btn gh" type="button" id="vcancel" hidden>বাতিল</button></div></form></div>' +
    '<div class="tbl" id="vlist"><p class="mut">লোড হচ্ছে...</p></div>';
  var editId = '';
  $('#vtype').onchange = function(){ $('#vpw').hidden = $('#vtype').value !== 'paid'; };
  $('#vurl').oninput = function(){ var i = parseVideo($('#vurl').value); $('#vdet').textContent = $('#vurl').value ? 'প্ল্যাটফর্ম: ' + i.p : ''; };
  function reset(){ editId = ''; $('#vf').reset(); $('#vpw').hidden = true; $('#vft').textContent = '➕ নতুন ভিডিও'; $('#vcancel').hidden = true; $('#vdet').textContent = ''; }
  $('#vcancel').onclick = reset;
  $('#vf').onsubmit = function(e){
    e.preventDefault();
    var url = $('#vurl').value.trim(), paid = $('#vtype').value === 'paid', price = parseFloat($('#vprice').value) || 0;
    if (/youtu\.be|youtube\.com/i.test(url)) { toast('YouTube লিংক সাপোর্টেড নয়। Drive, Terabox, Facebook বা mp4 লিংক দিন'); return; }
    if (!/^https?:\/\//i.test($('#vsrc').value.trim())) { toast('সোর্স লিংক সঠিক দিন (https://...)'); return; }
    if (paid && price <= 0) { toast('পেইড ভিডিওর প্রাইস দিন'); return; }
    var info = parseVideo(url), id = editId || db.collection('videos').doc().id;
    var data = { title: $('#vtitle').value.trim(), platform: info.p, thumb: $('#vthumb').value.trim(), thumbAuto: info.thumb || '', ratio: $('#vratio').value,
                 license: $('#vlic').value, srcLink: $('#vsrc').value.trim(), paid: paid, price: paid ? price : 0, desc: $('#vdesc').value.trim(), hidden: $('#vhide').checked };
    if (!editId) { data.createdAt = FV.serverTimestamp(); data.views = 0; }
    data.url = paid ? FV.delete() : url;
    $('#vsave').disabled = true;
    var p = paid ? db.doc('videos/' + id + '/private/src').set({ url: url }) : db.doc('videos/' + id + '/private/src').delete().catch(function(){});
    p.then(function(){ return db.doc('videos/' + id).set(data, { merge: true }); }).then(function(){ toast('সেভ হয়েছে ✓'); reset(); }).catch(function(er){ toast('সমস্যা: ' + er.message); }).then(function(){ $('#vsave').disabled = false; });
  };
  viewSubs.push(db.collection('videos').orderBy('createdAt', 'desc').onSnapshot(function(qs){
    var L = $('#vlist'); if (!L) return;
    if (qs.empty) { L.innerHTML = '<p class="mut">এখনো কোনো ভিডিও নেই</p>'; return; }
    L.innerHTML = ''; var cache = {};
    qs.forEach(function(d){
      var x = d.data(); cache[d.id] = x; var t = x.thumb || x.thumbAuto;
      var el = document.createElement('div'); el.className = 'it';
      el.innerHTML = (t ? '<img referrerpolicy="no-referrer" src="' + esc(t) + '" alt="">' : '<div class="tp">🎬</div>') +
        '<div class="inf"><b>' + esc(x.title) + (x.hidden ? ' 🙈' : '') + '</b><span class="pill ' + (x.paid ? 'p' : 'f') + '">' + (x.paid ? '🔒 ' + money(x.price) : 'FREE') + '</span> <span class="mut sm">' + esc(x.platform) + ' · 👁 ' + (x.views || 0) + '</span></div>' +
        '<button class="btn gh s" data-a="e" type="button">✏️ এডিট</button><button class="btn gh s" data-a="h" type="button">' + (x.hidden ? '👁 দেখান' : '🙈 লুকান') + '</button><button class="btn bad s" data-a="d" type="button">🗑</button>';
      el.onclick = function(ev){
        var a = ev.target.closest('[data-a]'); if (!a) return; a = a.getAttribute('data-a');
        if (a === 'd') { if (confirm('ভিডিওটি মুছে ফেলবেন?')) db.doc('videos/' + d.id + '/private/src').delete().catch(function(){}).then(function(){ return db.doc('videos/' + d.id).delete(); }); }
        if (a === 'h') db.doc('videos/' + d.id).update({ hidden: !x.hidden });
        if (a === 'e') {
          editId = d.id; $('#vft').textContent = '✏️ এডিট: ' + x.title; $('#vcancel').hidden = false;
          $('#vtitle').value = x.title || ''; $('#vthumb').value = x.thumb || ''; $('#vlic').value = x.license || ''; $('#vsrc').value = x.srcLink || ''; $('#vratio').value = x.ratio || '16/9';
          $('#vtype').value = x.paid ? 'paid' : 'free'; $('#vpw').hidden = !x.paid; $('#vprice').value = x.price || ''; $('#vdesc').value = x.desc || ''; $('#vhide').checked = !!x.hidden;
          if (x.paid) db.doc('videos/' + d.id + '/private/src').get().then(function(s){ $('#vurl').value = s.exists ? s.data().url : ''; }); else $('#vurl').value = x.url || '';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      L.appendChild(el);
    });
  }, function(e){ var L = $('#vlist'); if (L) L.innerHTML = '<p>' + esc(e.message) + '</p>'; }));
}

/* ---------- ডিপোজিট ---------- */
function vDep(v){
  v.innerHTML = '<h2>⬇️ ডিপোজিট রিকোয়েস্ট</h2><div class="tbl" id="dl"></div>';
  viewSubs.push(db.collection('deposits').orderBy('at', 'desc').limit(100).onSnapshot(function(qs){
    var L = $('#dl'); if (!L) return; L.innerHTML = qs.empty ? '<p class="mut">কিছু নেই</p>' : '';
    qs.forEach(function(d){
      var x = d.data(), el = document.createElement('div'); el.className = 'it';
      el.innerHTML = '<div class="inf"><b>' + money(x.amount) + ' · ' + esc(x.method) + '</b><span class="mut sm">TrxID: <b style="color:var(--tx)">' + esc(x.trx) + '</b></span><br><span class="mut sm">' + esc(x.email) + ' · ' + fdate(x.at) + '</span></div><span class="pill ' + x.status + '">' + x.status + '</span>' +
        (x.status === 'pending' ? '<button class="btn ok s" data-a="ok" type="button">✅ অনুমোদন</button><button class="btn bad s" data-a="no" type="button">❌ বাতিল</button>' : '');
      el.onclick = function(ev){
        var a = ev.target.closest('[data-a]'); if (!a) return; a = a.getAttribute('data-a');
        var ref = db.doc('deposits/' + d.id);
        db.runTransaction(function(t){
          return t.get(ref).then(function(s){
            if (s.data().status !== 'pending') throw new Error('আগেই প্রসেস হয়েছে');
            t.update(ref, { status: a === 'ok' ? 'approved' : 'rejected', by: ME.email });
            if (a === 'ok') t.update(db.doc('users/' + x.uid), { balance: FV.increment(+x.amount) });
            t.set(db.collection('notifications').doc(), { to: x.uid, title: a === 'ok' ? '✅ ডিপোজিট সফল' : '❌ ডিপোজিট বাতিল', body: a === 'ok' ? money(x.amount) + ' আপনার ব্যালেন্সে যোগ হয়েছে।' : 'Transaction ID যাচাই করা যায়নি (' + x.trx + ')।', at: FV.serverTimestamp() });
          });
        }).then(function(){ toast('হয়েছে ✓'); }).catch(function(er){ toast(er.message); });
      };
      L.appendChild(el);
    });
  }));
}

/* ---------- উইথড্র ---------- */
function vWd(v){
  v.innerHTML = '<h2>⬆️ উইথড্র রিকোয়েস্ট</h2><div class="note">রিকোয়েস্টের সময়ই ইউজারের ব্যালেন্স থেকে টাকা কাটা হয়েছে। টাকা পাঠিয়ে "পাঠানো হয়েছে" চাপুন। বাতিল করলে টাকা ফেরত যাবে।</div><div class="tbl" id="wl"></div>';
  viewSubs.push(db.collection('withdrawals').orderBy('at', 'desc').limit(100).onSnapshot(function(qs){
    var L = $('#wl'); if (!L) return; L.innerHTML = qs.empty ? '<p class="mut">কিছু নেই</p>' : '';
    qs.forEach(function(d){
      var x = d.data(), el = document.createElement('div'); el.className = 'it';
      el.innerHTML = '<div class="inf"><b>' + money(x.amount) + ' · ' + esc(x.method) + '</b><span class="mut sm">নম্বর: <b style="color:var(--tx)">' + esc(x.number) + '</b></span><br><span class="mut sm">' + esc(x.email) + ' · ' + fdate(x.at) + '</span></div><span class="pill ' + x.status + '">' + x.status + '</span>' +
        (x.status === 'pending' ? '<button class="btn ok s" data-a="ok" type="button">✅ পাঠানো হয়েছে</button><button class="btn bad s" data-a="no" type="button">❌ বাতিল (ফেরত)</button>' : '');
      el.onclick = function(ev){
        var a = ev.target.closest('[data-a]'); if (!a) return; a = a.getAttribute('data-a');
        var ref = db.doc('withdrawals/' + d.id);
        db.runTransaction(function(t){
          return t.get(ref).then(function(s){
            if (s.data().status !== 'pending') throw new Error('আগেই প্রসেস হয়েছে');
            t.update(ref, { status: a === 'ok' ? 'paid' : 'rejected', by: ME.email });
            if (a === 'no') t.update(db.doc('users/' + x.uid), { balance: FV.increment(+x.amount) });
            t.set(db.collection('notifications').doc(), { to: x.uid, title: a === 'ok' ? '✅ উইথড্র সম্পন্ন' : '❌ উইথড্র বাতিল', body: a === 'ok' ? money(x.amount) + ' আপনার ' + x.method + ' নম্বরে পাঠানো হয়েছে।' : money(x.amount) + ' আপনার ব্যালেন্সে ফেরত দেওয়া হয়েছে।', at: FV.serverTimestamp() });
          });
        }).then(function(){ toast('হয়েছে ✓'); }).catch(function(er){ toast(er.message); });
      };
      L.appendChild(el);
    });
  }));
      }
      
