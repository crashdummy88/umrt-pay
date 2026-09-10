/**
 * Square Web Payments — client only tokenizes.
 * Charge happens at POST /api/create-payment (Pages Function).
 * Public config from GET /api/config (appId + locationId + env). Never returns access token.
 */
const statusEl = document.getElementById('payment-status');
const form = document.getElementById('payment-form');
const btn = document.getElementById('pay-button');

function setStatus(msg, kind) {
  statusEl.textContent = msg || '';
  statusEl.className = 'msg' + (kind ? ' ' + kind : '');
}

async function boot() {
  const cfgRes = await fetch('/api/config');
  if (!cfgRes.ok) {
    setStatus('Payment config unavailable. Set SQUARE_* env vars on Cloudflare Pages.', 'err');
    btn.disabled = true;
    return;
  }
  const cfg = await cfgRes.json();
  if (!window.Square) {
    setStatus('Square.js failed to load.', 'err');
    return;
  }
  const payments = window.Square.payments(cfg.applicationId, cfg.locationId);
  const card = await payments.card();
  await card.attach('#card-container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Processing…');
    btn.disabled = true;
    const amount = document.getElementById('amount').value;
    const note = document.getElementById('note').value;
    const email = document.getElementById('email').value;
    try {
      const result = await card.tokenizeize();
      if (result.status !== 'OK') {
        setStatus(result.errors?.map((x) => x.message).join(' ') || 'Card error', 'err');
        btn.disabled = false;
        return;
      }
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sourceId: result.token,
          amountDollars: amount,
          note,
          email,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(body.error || 'Payment failed', 'err');
        btn.disabled = false;
        return;
      }
      location.href = '/success/?id=' + encodeURIComponent(body.paymentId || '');
    } catch (err) {
      setStatus(err.message || 'Unexpected error', 'err');
      btn.disabled = false;
    }
  });
}

boot();
