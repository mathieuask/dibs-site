// Redirections vers les stores et comptage des visites, partagés par toutes les pages.
// Tant que l'app attend l'examen Apple, l'iPhone part sur TestFlight ; à la sortie, mettre l'URL App Store.
var DIBS = {
  ios: 'https://testflight.apple.com/join/5t5MherJ',
  appStore: 'https://apps.apple.com/app/id6818491717',
  android: '',
  amplitudeKey: '714c457181a563948cb6208c09b9fdf6'
};

DIBS.platform = (function () {
  var ua = navigator.userAgent;
  // iPadOS se présente comme un Mac : le nombre de points de contact le trahit.
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
})();

DIBS.param = function (name) {
  return new URLSearchParams(location.search).get(name) || '';
};

// Langue : /fr, ?lang=, choix fait sur le site (gardé si le navigateur le permet), sinon la langue du téléphone.
DIBS.lang = (function () {
  if (/^\/fr(\/|$)/.test(location.pathname)) return 'fr';
  var asked = DIBS.param('lang');
  if (asked === 'fr' || asked === 'en') return asked;
  var saved = null;
  try { saved = localStorage.getItem('dibs-lang'); } catch (e) { saved = null; }
  if (saved === 'fr' || saved === 'en') return saved;
  return /^fr\b/i.test(navigator.language || '') ? 'fr' : 'en';
})();

DIBS.t = function (en, fr) { return DIBS.lang === 'fr' ? fr : en; };

DIBS.remember = function (lang) {
  try { localStorage.setItem('dibs-lang', lang); } catch (e) { /* navigation privée : le choix vaut pour cette page */ }
};

// Pages communes aux deux langues (/app, /j) : chaque texte porte sa version française dans data-fr.
DIBS.translate = function () {
  if (DIBS.lang !== 'fr') return;
  document.documentElement.lang = 'fr';
  document.querySelectorAll('[data-fr]').forEach(function (el) { el.textContent = el.getAttribute('data-fr'); });
};

DIBS.source = DIBS.param('s') || DIBS.param('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'direct');

// Un identifiant par chargement de page, jamais stocké : pas de cookie, pas de suivi d'une visite à l'autre.
DIBS.device = 'web-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

// Envoie l'événement à Amplitude et rend la main au plus tard après 600 ms, pour ne jamais bloquer une redirection.
DIBS.track = function (event, props) {
  if (!DIBS.amplitudeKey) return Promise.resolve();
  var body = JSON.stringify({
    api_key: DIBS.amplitudeKey,
    events: [{
      device_id: DIBS.device, event_type: event, platform: 'Web', ip: '$remote',
      event_properties: Object.assign({ page: location.pathname, source: DIBS.source, device: DIBS.platform, lang: DIBS.lang }, props || {})
    }]
  });
  var sent = fetch('https://api2.amplitude.com/2/httpapi', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true
  }).catch(function () {});
  return Promise.race([sent, new Promise(function (r) { setTimeout(r, 600); })]);
};

DIBS.storeUrl = function () {
  if (DIBS.platform === 'ios') return DIBS.ios;
  if (DIBS.platform === 'android') return DIBS.android;
  return DIBS.ios;
};

DIBS.storeName = function () {
  if (DIBS.platform === 'android') return DIBS.android ? 'play' : 'none';
  return DIBS.ios.indexOf('testflight') >= 0 ? 'testflight' : 'app_store';
};

DIBS.go = function (url, event, props) {
  DIBS.track(event, props).then(function () { location.href = url; });
};

// Un lien « Français » ou « English » garde le choix pour les prochaines visites.
document.addEventListener('click', function (e) {
  var a = e.target.closest ? e.target.closest('[data-lang]') : null;
  if (a) DIBS.remember(a.getAttribute('data-lang'));
});
