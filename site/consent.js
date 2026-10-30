/*
 * Cookie / storage consent + consent-gated analytics (shared by the SRC site and ARES'26 app).
 *
 * - "Essential" (always on): the ARES'26 sign-in session that Supabase keeps in this browser's
 *   localStorage, and this consent choice itself. No consent needed; not used for tracking.
 * - "Analytics" (OFF until the visitor opts in): Vercel Web Analytics, which is cookieless and
 *   stores no personal identifiers. The script is not even requested before consent.
 * - Honours the browser's Global Privacy Control signal (treated as "reject").
 *
 * Public API:  window.srcConsent.open()      re-open preferences
 *              window.srcTrack(name, props)  custom event; no-op without analytics consent
 *              window.srcPageview(path)      virtual page view for hash-routed pages
 */
(function () {
  'use strict';
  var KEY = 'src_consent_v1', VERSION = 1;
  var gpc = !!(navigator.globalPrivacyControl);
  var loaded = false, el = null;

  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.v === VERSION ? v : null; } catch (e) { return null; }
  }
  function write(analytics) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, analytics: !!analytics, ts: new Date().toISOString() })); } catch (e) {}
  }
  function allowed() { var c = read(); return !!(c && c.analytics && !gpc); }

  function loadAnalytics() {
    if (loaded || !allowed()) return;
    loaded = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script');
    s.defer = true; s.src = '/_vercel/insights/script.js';
    s.onerror = function () { /* Web Analytics not enabled on the Vercel project: fail silently */ };
    document.head.appendChild(s);
  }

  window.srcTrack = function (name, props) {
    if (!allowed() || !window.va || !name) return;
    try { window.va('event', { name: String(name).slice(0, 40), data: props || undefined }); } catch (e) {}
  };
  var firstView = true;
  window.srcPageview = function (path) {
    if (firstView) { firstView = false; return; } // the script records the initial load itself
    if (!allowed() || !window.va) return;
    try { window.va('pageview', { route: path, path: path }); } catch (e) {}
  };

  // CTA clicks: any element with data-track="event_name"
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-track]');
    if (t) window.srcTrack(t.getAttribute('data-track'), { page: location.pathname + location.hash.split('?')[0] });
  }, true);

  function css() {
    if (document.getElementById('cc-css')) return;
    var l = document.createElement('link'); l.id = 'cc-css'; l.rel = 'stylesheet'; l.href = '/consent.css';
    document.head.appendChild(l);
  }
  function close() {
    if (el) { el.remove(); el = null; }
    document.body.classList.remove('consent-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
  }
  var lastFocus = null;
  function decide(a) { write(a); close(); if (a) loadAnalytics(); }

  function open(prefs) {
    css(); lastFocus = document.activeElement;
    if (el) el.remove();
    var cur = read();
    el = document.createElement('div'); el.className = 'cc';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:60'; // placed before consent.css loads, so it never flashes in the page flow or scrolls the page
    el.innerHTML =
      '<div class="cc-card" role="dialog" aria-modal="false" aria-labelledby="cc-t" aria-describedby="cc-d">' +
      '<h2 id="cc-t">Cookies &amp; privacy</h2>' +
      '<p id="cc-d">We use only what is needed to run this site and to let you sign in to ARES\u201926. ' +
      'With your permission we also use privacy-friendly analytics (page views and button clicks, no advertising, no cross-site tracking). ' +
      'See our <a href="/privacy">Privacy Policy</a>.' + (gpc ? ' Your browser\u2019s Global Privacy Control signal is on, so analytics stay off.' : '') + '</p>' +
      (prefs
        ? '<div class="cc-opt"><input type="checkbox" checked disabled id="cc-e"/><label for="cc-e"><b>Essential</b><span>Keeps you signed in to ARES\u201926 and remembers this choice. Always on.</span></label></div>' +
          '<div class="cc-opt"><input type="checkbox" id="cc-a"' + (cur && cur.analytics && !gpc ? ' checked' : '') + (gpc ? ' disabled' : '') + '/><label for="cc-a"><b>Analytics</b><span>Counts visits and clicks on key buttons so we can improve the site. Off by default.</span></label></div>' +
          '<div class="cc-row"><button type="button" class="cc-btn" id="cc-save">Save preferences</button><button type="button" class="cc-btn o" id="cc-cancel">Cancel</button></div>'
        : '<div class="cc-row"><button type="button" class="cc-btn" id="cc-acc"' + (gpc ? ' disabled' : '') + '>Accept analytics</button><button type="button" class="cc-btn" id="cc-rej">Reject non-essential</button><button type="button" class="cc-btn o" id="cc-pref">Preferences</button></div>') +
      '</div>';
    document.body.appendChild(el);
    document.body.classList.add('consent-open');
    var $ = function (id) { return el.querySelector('#' + id); };
    if (prefs) {
      $('cc-save').onclick = function () { decide(!gpc && $('cc-a').checked); };
      $('cc-cancel').onclick = function () { if (read()) close(); else open(false); };
      $('cc-a').focus({preventScroll:true});
    } else {
      $('cc-acc').onclick = function () { decide(true); };
      $('cc-rej').onclick = function () { decide(false); };
      $('cc-pref').onclick = function () { open(true); };
      $('cc-rej').focus({preventScroll:true});
    }
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape' && read()) close(); });
  }

  window.srcConsent = { open: function () { open(true); } };
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-cookie-settings]')) { e.preventDefault(); open(true); }
  });

  function init() { if (read()) loadAnalytics(); else open(false); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
