// Outreach alerts for visitors who arrived on one of Daniel's outreach links.
// Same code as the portfolio's assets/site.js (repo daniesul/portfolio); keep them in step.
(function () {
  // Outreach alerts (same code in the portfolio's assets/site.js and in each
  // demo's public/outreach.js; keep them in step). Only for visitors who
  // arrived on one of Daniel's outreach links: utm_campaign starting
  // "job-search" (account = utm_source, channel = utm_medium), or
  // utm_medium=outreach (account = utm_campaign, channel = utm_content).
  // The account and channel are kept for 90 days in one first-party cookie
  // shared by danielsullivanportfolio.com and its demo subdomains, so return
  // visits and clicks into a demo count as the same visitor. Each page view
  // and tracked action sends a short message (account, channel, page path,
  // event name, short label, random visit id, visit number, device type) to
  // Daniel's Google Apps Script, which logs it in his Sheet and emails him.
  // Nothing is stored or sent for other visitors.
  function makeOutreach(fallbackHost) {
    var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwLhK6nIz1CdeQ29we-Oz0sSbVp3EQD4uchY_9UlGWwgmvZTFYt_HBQNsx5gUOpdDU3aw/exec';
    var KEY = 'ds_outreach', VISIT_GAP = 30 * 60 * 1000, KEEP = 90 * 24 * 60 * 60 * 1000;
    var noop = function () {};
    var prod = /(^|\.)danielsullivanportfolio\.com$/.test(location.hostname);
    function read() {
      try {
        var m = document.cookie.match(/(?:^|;\s*)ds_outreach=([^;]*)/);
        if (m) return JSON.parse(decodeURIComponent(m[1]));
        var old = localStorage.getItem(KEY); // where the first version kept it
        return old ? JSON.parse(old) : null;
      } catch (err) { return null; }
    }
    function save(r) {
      try {
        document.cookie = KEY + '=' + encodeURIComponent(JSON.stringify(r)) + '; Max-Age=' + KEEP / 1000 +
          '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '') +
          (prod ? '; Domain=danielsullivanportfolio.com' : '');
        localStorage.removeItem(KEY);
      } catch (err) {}
    }
    var rec, now = Date.now();
    try {
      var q = new URLSearchParams(location.search);
      var tag = function (v) { v = (v || '').trim().toLowerCase(); return /^[a-z0-9][a-z0-9._-]{0,79}$/.test(v) ? v : ''; };
      rec = read();
      if (rec && now - rec.last > KEEP) rec = null;
      var med = tag(q.get('utm_medium')), cmp = tag(q.get('utm_campaign')), src = tag(q.get('utm_source'));
      var hit = null;
      if (/^job-search/.test(cmp) && src) hit = { account: src, channel: med, from: cmp };
      else if (med === 'outreach' && cmp) hit = { account: cmp, channel: tag(q.get('utm_content')), from: src };
      if (hit && (!rec || rec.campaign !== hit.account || rec.content !== hit.channel)) {
        rec = { campaign: hit.account, content: hit.channel, source: hit.from, visits: 0, last: 0 };
      }
      if (!rec) return noop;
      if (!rec.visitId || now - rec.last > VISIT_GAP) {
        rec.visits = (rec.visits || 0) + 1;
        rec.visitId = Math.random().toString(36).slice(2, 10) + now.toString(36);
      }
      rec.last = now;
      save(rec);
    } catch (err) { return noop; } // storage blocked or unreadable: send nothing

    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    var device = !coarse ? 'desktop' : (Math.min(screen.width, screen.height) >= 600 ? 'tablet' : 'mobile');

    function send(event, detail) {
      var stored = read();
      if (stored && stored.visitId === rec.visitId) { stored.last = Date.now(); save(stored); }
      var body = JSON.stringify({
        medium: 'outreach', campaign: rec.campaign, content: rec.content, source: rec.source,
        visit_id: rec.visitId, visit_number: rec.visits, event: event,
        host: prod ? location.hostname : fallbackHost, path: location.pathname,
        detail: detail || '', device: device,
        test: !prod // preview deployments send marked test messages
      });
      if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body))) {
        fetch(ENDPOINT, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }).catch(noop);
      }
    }
    send('page_view');
    return function (event, params) {
      params = params || {};
      send(event, String(params.item_name || params.section_name || params.link_text || ''));
    };
  }
  window.dsOutreach = makeOutreach('pipeline.danielsullivanportfolio.com');
})();
