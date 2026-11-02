/* TopReelz: বাংলা / English টগল। app3.js এর পরে লোড হয়। */
(function () {
  var LANG = 'bn';
  try { LANG = localStorage.getItem('lang') === 'en' ? 'en' : 'bn'; } catch (e) {}
  window.LANG = LANG;

  function setLang(l) { try { localStorage.setItem('lang', l); } catch (e) {} location.reload(); }

  /* হেডারে টগল বাটন */
  var wrap = document.querySelector('.hd .wrap');
  if (wrap) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ib'; b.id = 'blang';
    b.textContent = LANG === 'en' ? 'বাং' : 'EN';
    b.setAttribute('aria-label', LANG === 'en' ? 'বাংলায় দেখুন' : 'View in English');
    b.onclick = function () { setLang(LANG === 'en' ? 'bn' : 'en'); };
    var login = document.getElementById('blog');
    wrap.insertBefore(b, login || null);
  }
  if (LANG !== 'en') return;

  document.documentElement.lang = 'en';

  /* সংখ্যা ও তারিখ ইংরেজিতে */
  try { bn = function (n) { return String(n); }; } catch (e) {}
  try {
    fdate = function (ts) {
      try {
        var d = ts && ts.toDate ? ts.toDate() : new Date();
        return d.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
      } catch (e) { return ''; }
    };
  } catch (e) {}

  var P = {
    'নিচের নম্বরে Send Money করে Transaction ID দিন। অ্যাডমিন যাচাই করলে ব্যালেন্সে টাকা যোগ হবে।': 'Send Money to the number below and enter the Transaction ID. Your balance will be updated after admin verification.',
    'রিকোয়েস্ট দিলে টাকা ব্যালেন্স থেকে কেটে নেওয়া হবে, অ্যাডমিন পাঠিয়ে দেবেন। বাতিল হলে ফেরত পাবেন।': 'The amount is deducted from your balance when you request. Admin will send it. If cancelled, you get it back.',
    'বাটনে ক্লিক করলে স্পন্সর পেজ খুলবে,': 'Tap the button to open the sponsor page,',
    'সেকেন্ড পর ভিডিও চালু হবে।': 'seconds later the video will start.',
    'সেটিংস ও ভিডিও লোড করা যায়নি': 'Could not load settings and videos',
    'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর দিন': 'Password must be at least 6 characters',
    'পপআপ বন্ধ হয়েছে, আবার চেষ্টা করুন': 'Popup closed, please try again',
    'ব্যালেন্স কম, আগে ডিপোজিট করুন': 'Low balance, please deposit first',
    'কেনা যায়নি, আবার চেষ্টা করুন': 'Purchase failed, please try again',
    'হ্যালো! কীভাবে সাহায্য করতে পারি?': 'Hello! How can we help you?',
    'কেটে ভিডিও আনলক করবেন?': 'will be deducted. Unlock this video?',
    'ভিডিও চালু করতে ভেরিফাই করুন': 'Verify to start the video',
    'ইমেইল বা পাসওয়ার্ড ভুল': 'Wrong email or password',
    'এই ইমেইল আগে থেকেই আছে': 'This email is already registered',
    'কোনো ভিডিও পাওয়া যায়নি': 'No videos found',
    'ভিডিও লোড করা যায়নি': 'Could not load videos',
    'ভিডিও লিংক পাওয়া যায়নি': 'Video link not found',
    'ভিডিওটি পাওয়া যায়নি': 'Video not found',
    'ইমেইল ও পাসওয়ার্ড দিন': 'Enter email and password',
    'আনলক করতে লগইন করুন': 'Log in to unlock',
    'উইথড্র রিকোয়েস্ট পাঠান': 'Send withdraw request',
    'ডিপোজিট রিকোয়েস্ট পাঠান': 'Send deposit request',
    'উইথড্র রিকোয়েস্ট গেছে': 'Withdraw request sent',
    'প্রকৃতি ও প্রাণীর সেরা ভিডিও, এক জায়গায়।': 'The best nature and animal videos, in one place.',
    'নতুন নতুন ভিডিও প্রতিদিন, সব ফ্রি।': 'New videos every day, all free.',
    'টাকার পরিমাণ (ন্যূনতম': 'Amount (minimum',
    'কোনো নোটিফিকেশন নেই': 'No notifications',
    'কোনো লেনদেন নেই': 'No transactions',
    'হিস্ট্রি লোড হয়নি': 'History not loaded',
    'আবার চেষ্টা করুন': 'Try again',
    'অ্যাডমিন যাচাই করবেন': 'Admin will verify',
    'ব্যালেন্স যোগ করুন': 'Add balance',
    'দিয়ে আনলক করুন': '· Unlock',
    'লগইন / অ্যাকাউন্ট': 'Login / Account',
    'সরাসরি': 'Direct',
    'সেরা ভিডিও,': 'Best videos,',
    'এক জায়গায়': 'in one place',
    'ইমেইল ঠিক নয়': 'Invalid email',
    'সমস্যা হয়েছে': 'Something went wrong',
    'নতুন অ্যাকাউন্ট': 'New account',
    'অ্যাকাউন্ট খুলুন': 'Create account',
    'আনলক হয়েছে': 'Unlocked',
    'আনলক করা নেই': 'Not unlocked',
    'ভেরিফাই সম্পন্ন': 'Verified',
    'ভেরিফাই করুন': 'Verify',
    'অপেক্ষা করুন...': 'Please wait...',
    'ভিডিও খুঁজুন...': 'Search videos...',
    'মেসেজ লিখুন...': 'Type a message...',
    'লোড হচ্ছে...': 'Loading...',
    'লোড করা যায়নি': 'Could not load',
    'সঠিক নম্বর দিন': 'Enter a valid number',
    'Transaction ID দিন': 'Enter Transaction ID',
    'রিকোয়েস্ট গেছে': 'Request sent',
    'পাঠানো যায়নি': 'Could not send',
    'পাঠানো হয়েছে': 'Sent',
    'বর্তমান ব্যালেন্স': 'Current balance',
    'আপনার ব্যালেন্স': 'Your balance',
    'আপনার নম্বর': 'Your number',
    'আমার ওয়ালেট': 'My wallet',
    'নোটিফিকেশন': 'Notifications',
    'ভিডিও চালান': 'Play video',
    'লগইন করুন': 'Log in',
    'কপি হয়েছে': 'Copied',
    'পেইড ভিডিও': 'Paid video',
    'লাইভ চ্যাট': 'Live chat',
    'ব্যালেন্স কম': 'Low balance',
    'অপেক্ষমাণ': 'Pending',
    'ডিপোজিট': 'Deposit',
    'উইথড্র': 'Withdraw',
    'ওয়ালেট': 'Wallet',
    'হিস্ট্রি': 'History',
    'লগআউট': 'Log out',
    'সব ভিডিও': 'All videos',
    'ন্যূনতম': 'Minimum',
    'মাধ্যম': 'Method',
    'পাসওয়ার্ড': 'Password',
    'অ্যাকাউন্ট': 'Account',
    'লাইসেন্স': 'License',
    'বিজ্ঞাপন': 'Advertisement',
    'ইমেইল': 'Email',
    'লগইন': 'Login',
    'পেইড': 'Paid',
    'ফ্রি': 'Free',
    'ভিউ': 'views',
    'সোর্স': 'Source',
    'শেয়ার': 'Share',
    'ফিরুন': 'Back',
    'বাতিল': 'Cancelled',
    'সফল': 'Approved',
    'কেনা': 'Purchased',
    'কপি': 'Copy',
    'পাঠান': 'Send'
  };
  var EXACT = { 'নাম': 'Name' };
  var keys = Object.keys(P).sort(function (a, b) { return b.length - a.length; });
  var BENGALI = /[\u0980-\u09FF]/;
  var SKIP = '.cap, .ptitle, #ann, .li .t b, .li > .mut, script, style, textarea';

  function tr(s) {
    var t = s.trim();
    if (EXACT[t]) return s.replace(t, EXACT[t]);
    for (var i = 0; i < keys.length; i++) {
      if (s.indexOf(keys[i]) > -1) s = s.split(keys[i]).join(P[keys[i]]);
    }
    return s;
  }
  function inSkip(n) {
    var el = n.nodeType === 1 ? n : n.parentElement;
    return el && el.closest && el.closest(SKIP);
  }
  function doText(n) {
    var v = n.nodeValue;
    if (!v || !BENGALI.test(v) || inSkip(n)) return;
    var r = tr(v);
    if (r !== v) n.nodeValue = r;
  }
  var ATTR = ['placeholder', 'title', 'aria-label'];
  function doEl(el) {
    if (el.nodeType !== 1) return;
    for (var i = 0; i < ATTR.length; i++) {
      var v = el.getAttribute(ATTR[i]);
      if (v && BENGALI.test(v)) { var r = tr(v); if (r !== v) el.setAttribute(ATTR[i], r); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }

  walk(document.body);
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]); }
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doEl(m.target);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
})();
    
