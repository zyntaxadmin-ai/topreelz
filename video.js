/* TopReelz: সব ধরনের ভিডিও লিংক সাপোর্ট (YouTube, Vimeo, Drive, Terabox, mp4, m3u8 ...)। app3.js এর পরে লোড হয়। */
parseVideo = function (u) {
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
};

(function () {
  try {
    var X = { youtube:'▶️', vimeo:'🎥', dailymotion:'🎥', streamable:'🎥', tiktok:'🎵', instagram:'📷', archive:'🏛' };
    for (var k in X) PICON[k] = X[k];
  } catch (e) {}
})();

/* m3u8 (HLS) প্লেয়ার: যে ব্রাউজারে নিজে চলে না সেখানে hls.js লোড হয় */
(function () {
  var s = null;
  function loadHls(cb) {
    if (window.Hls) { cb(); return; }
    if (!s) { s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js'; document.head.appendChild(s); }
    s.addEventListener('load', cb);
  }
  function attach(v) {
    if (v.__hls) return;
    var src = v.getAttribute('src') || '';
    if (!/\.m3u8(\?|#|$)/i.test(src)) return;
    v.__hls = 1;
    if (v.canPlayType('application/vnd.apple.mpegurl')) return;
    loadHls(function () {
      if (window.Hls && window.Hls.isSupported()) {
        var h = new window.Hls(); h.loadSource(src); h.attachMedia(v);
        try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
      }
    });
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      for (var i = 0; i < m.addedNodes.length; i++) {
        var n = m.addedNodes[i];
        if (n.nodeType !== 1) continue;
        if (n.tagName === 'VIDEO') attach(n);
        else if (n.querySelectorAll) { var vs = n.querySelectorAll('video'); for (var j = 0; j < vs.length; j++) attach(vs[j]); }
      }
    });
  }).observe(document.body, { childList: true, subtree: true });
})();
  
