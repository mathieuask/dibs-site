# Site Dibs (statique, Vercel)

Pages : accueil, privacy, terms, support (FAQ et formulaire), delete-account, 404. HTML et CSS à la main, aucune
dépendance, couleurs et police de l'app (`app/src/ui/theme.ts`). Textes en anglais US, sans emoji ni tiret cadratin.

## Harnais
- `./verify.sh` : liens et ancres internes, repères non remplacés (`SUPPORT_ENDPOINT` dans contact.js), emoji, tirets
  cadratins, poids < 2 Mo. Vert obligatoire avant tout déploiement.
- Aperçu local : configuration « site » de `~/Desktop/ember/.claude/launch.json` (port 8840, URL propres comme Vercel).

## Déployer
1. Remplacer le repère par l'URL de la fonction Supabase « support » :
   `sed -i '' "s#'SUPPORT_ENDPOINT'#'https://<ref>.supabase.co/functions/v1/support'#" contact.js`
2. `./verify.sh`
3. `npx vercel@latest deploy --prod --yes` depuis ce dossier (après `npx vercel@latest login`), ou le connecteur
   Vercel avec les fichiers listés par `git ls-files`.

## Contrat du formulaire
POST JSON `{ email, subject, message, page }` vers la fonction ; réponse 2xx si reçu. La fonction doit accepter
l'origine du site (CORS), sans jeton (verify_jwt désactivé), et limiter le débit.

## Contenu à garder vrai
La politique de confidentialité et la page de suppression décrivent le comportement du serveur : suppression des
preuves et du profil, « Deleted player » dans les parties des autres, révocation du jeton Apple, signalements gardés
12 mois. Toute différence côté serveur se corrige ici le même jour.
