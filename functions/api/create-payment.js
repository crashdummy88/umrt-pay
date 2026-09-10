/**
 * Server-side Square Payment — access token from CF env only.
 * Docs: https://developer.squareup.com/reference/square/payments-api/create-payment
 */
function corsHeaders(origin) {
  return {
    'content-type': 'application/json',
    'cache-control': 'no-store',
  };
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const token = env.SQUARE_ACCESS_TOKEN;
  const environment = (env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase();
  if (!token) {
    return Response.json({ error: 'SQUARE_ACCESS_TOKEN not configured' }, { status: 503, headers: corsHeaders() });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders() });
  }

  const sourceId = body.sourceId;
  const amountDollars = Number(body.amountDollars);
  const note = String(body.note || '').slice(0, 120);
  const email = String(body.email || '').slice(0, 120);

  if (!sourceId || !Number.isFinite(amountDollars) || amountDollars < 1) {
    return Response.json({ error: 'sourceId and amountDollars (>=1) required' }, { status: 400, headers: corsHeaders() });
  }

  // Square expects amount in smallest currency unit (cents)
  const amountCents = Math.round(amountDollars * 100);
  if (amountCents > 50000000) {
    return Response.json({ error: 'Amount too large' }, { status: 400, headers: corsHeaders() });
  }

  const base =
    environment === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

  const idempotencyKey = crypto.randomUUID();
  const payload = {
    source_id: sourceId,
    idempotency_key: idempotencyKey,
    amount_money: { amount: amountCents, currency: 'USD' },
    autocomplete: true,
    location_id: env.SQUARE_LOCATION_ID,
    note: note || 'UMRT soft pay',
  };
  if (email) {
    payload.buyer_email_address = email;
  }

  const sq = await fetch(`${base}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify(payload),
  });

  const data = await sq.json().catch(() => ({}));
  if (!sq.ok) {
    const msg =
      data?.errors?.map((e) => e.detail || e.code).join('; ') ||
      'Square payment failed';
    return Response.json({ error: msg }, { status: 402, headers: corsHeaders() });
  }

  return Response.json(
    {
      ok: true,
      paymentId: data.payment?.id,
      status: data.payment?.status,
      receiptUrl: data.payment?.receipt_url,
    },
    { headers: corsHeaders() }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    },
  });
}
