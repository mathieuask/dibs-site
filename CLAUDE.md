# Site Dibs (statique, Vercel)

En ligne : https://playdibs.vercel.app (projet Vercel `playdibs`). Pages : accueil, privacy, terms, support (FAQ et
formulaire), delete-account, 404, `/app` (lien de bio : envoie chaque téléphone sur son store), `/j/CODE` (invitation). HTML et CSS à la main, aucune
dépendance, couleurs et police de l'app (`app/src/ui/theme.ts`). Textes en anglais US, sans emoji ni tiret cadratin.

## Harnais
- `./verify.sh` : liens et ancres internes, repères non remplacés (`SUPPORT_ENDPOINT` dans contact.js), emoji, tirets
  cadratins, poids < 2 Mo. Vert obligatoire avant tout déploiement.
- Aperçu local : configuration « site » de `~/Desktop/ember/.claude/launch.json` (port 8840, URL propres comme Vercel).

## Français
- Pages françaises dans `fr/` (accueil, aide, suppression, confidentialité, conditions), liens depuis la racine
  (`/fr/privacy`, `/img/...`). `/app` et `/j` sont communes : chaque texte porte sa version dans `data-fr`, et
  `DIBS.t(en, fr)` pour les textes posés en JavaScript.
- Langue (`DIBS.lang` dans `go.js`) : chemin `/fr`, puis `?lang=`, puis le choix gardé (lien « Français » / « English »,
  `data-lang`), puis la langue du téléphone. L'accueil anglais renvoie vers `/fr` un navigateur en français.
- Une page anglaise et sa traduction changent dans le même commit ; la version française fait foi en France.

## Liens et analytique (`go.js`)
- `DIBS.ios` : fiche App Store (le lien public TestFlight a été fermé le 08/10 ; la fiche s'ouvre à la sortie).
  `DIBS.android` vide = « Android soon ». `DIBS.amplitudeKey` vide = aucun envoi.
- Analytique : API HTTP d'Amplitude (projet Dibs, org de Sofia), un identifiant par chargement de page, aucun cookie
  ni stockage. Événements : `site_viewed`, `store_redirect` {store}, `invite_viewed`, `invite_cta` {action}, toujours
  avec `page`, `source` (`?s=`, `utm_source` ou domaine d'origine) et `device` (ios, android, desktop).
- Lien universel : `.well-known/apple-app-site-association` (équipe 9HZ6856XDA) ouvre l'app sur `/j/*`, `/j?c=` et
  `/app` si elle est installée ; la page ne s'affiche qu'aux autres. `vercel.json` redirige `/j/:code` vers `/j?c=:code` (une réécriture vers `j.html` ou `/j` donne 404 sur Vercel avec cleanUrls, testé le 07/10).
- QR de `/app?s=qr` : `img/qr-app.svg`, généré avec le paquet `qrcode` de l'app (à refaire si le domaine change).

## Déployer
1. Remplacer le repère par l'URL de la fonction Supabase « support » :
   `sed -i '' "s#'SUPPORT_ENDPOINT'#'https://<ref>.supabase.co/functions/v1/support'#" contact.js`
2. `./verify.sh`
3. Le connecteur Vercel refuse la création et l'envoi (403) : on envoie depuis la session Vercel de Chrome
   (`fetch('/api/v13/deployments?teamId=team_sQifnHccwlfcSHCCAjGXid87', { method: 'POST' ... })`, fichiers de
   `git ls-files` sauf CLAUDE.md et verify.sh, `name: 'playdibs'`, `target: 'production'`), ou
   `npx vercel@latest deploy --prod --yes` après `npx vercel@latest login`.

## Contrat du formulaire
POST JSON `{ email, subject, message, page }` vers la fonction ; réponse 2xx si reçu. La fonction doit accepter
l'origine du site (CORS), sans jeton (verify_jwt désactivé), et limiter le débit.

## Contenu à garder vrai
La politique de confidentialité et la page de suppression décrivent le comportement du serveur : suppression des
preuves et du profil, « Deleted player » dans les parties des autres, signalements gardés
12 mois. Toute différence côté serveur se corrige ici le même jour.
