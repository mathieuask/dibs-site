// Le formulaire poste vers la fonction Supabase « support » : aucune adresse personnelle publiée sur le site.
const SUPPORT_ENDPOINT = 'SUPPORT_ENDPOINT';

const form = document.getElementById('contact-form');
const status = document.getElementById('status');

function say(text) { status.textContent = text; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const email = String(data.email || '').trim();
  const message = String(data.message || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return say('Enter a valid email so we can answer you.');
  if (message.length < 10) return say('Tell us a bit more in your message.');
  if (data.website) return say('Thanks, we got your message.');

  const button = form.querySelector('button');
  button.disabled = true;
  say('Sending...');
  try {
    const res = await fetch(SUPPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subject: data.subject, message, page: location.pathname }),
    });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    say('Thanks, we got your message. We will answer by email.');
  } catch {
    say('That did not go through. Try again in a moment.');
  } finally {
    button.disabled = false;
  }
});
