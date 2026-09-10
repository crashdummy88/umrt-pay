/**
 * Public Square config only — never expose SQUARE_ACCESS_TOKEN.
 */
export async function onRequestGet(context) {
  const env = context.env;
  const applicationId = env.SQUARE_APPLICATION_ID;
  const locationId = env.SQUARE_LOCATION_ID;
  const environment = (env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase();
  if (!applicationId || !locationId) {
    return Response.json(
      { error: 'Missing SQUARE_APPLICATION_ID or SQUARE_LOCATION_ID' },
      { status: 503 }
    );
  }
  return Response.json({ applicationId, locationId, environment });
}
