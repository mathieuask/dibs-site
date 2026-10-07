// Le formulaire poste vers la fonction Supabase « support » : aucune adresse personnelle publiée sur le site.
const SUPPORT_ENDPOINT = 'https://dxcbvkqdpnodcqwebvcp.supabase.co/functions/v1/support';

const form = document.getElementById('contact-form');
const status = document.getElementById('status');

// Messages dans la langue de la page (fr/support ou support).
const fr = document.documentElement.lang === 'fr';
function say(en, frText) { status.textContent = fr ? frText : en; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const email = String(data.email || '').trim();
  const message = String(data.message || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say('Enter a valid email so we can answer you.', 'Entrez un e-mail valide pour que nous puissions vous répondre.');
  if (message.length < 10) return say('Tell us a bit more in your message.', 'Dites-nous en un peu plus dans votre message.');
  if (data.website) return say('Thanks, we got your message.', 'Merci, nous avons bien reçu votre message.');

  const button = form.querySelector('button');
  button.disabled = true;
  say('Sending...', 'Envoi...');
  try {
    const res = await fetch(SUPPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subject: data.subject, message, page: location.pathname }),
    });
    if (res.status === 429) return say('Too many messages. Try again in an hour.', 'Trop de messages. Réessayez dans une heure.');
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    say('Thanks, we got your message. We will answer by email.', 'Merci, nous avons bien reçu votre message. Nous vous répondrons par e-mail.');
  } catch {
    say('That did not go through. Try again in a moment.', 'L\'envoi a échoué. Réessayez dans un instant.');
  } finally {
    button.disabled = false;
  }
});
