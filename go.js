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
      event_properties: Object.assign({ page: location.pathname, source: DIBS.source, device: DIBS.platform }, props || {})
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
