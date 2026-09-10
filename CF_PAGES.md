# Cloudflare Pages — umrt-pay (secure Square)

## Connect
1. Workers & Pages → Create → Pages → Connect to Git → `crashdummy88/umrt-pay`
2. Framework preset: **None** · Build command: empty · Output directory: `/`
3. Deploy → tip `https://umrt-pay.pages.dev` (name may vary)

## Environment variables (Production + Preview)
Set in Pages → Settings → Environment variables (**encrypted** for the token):

| Name | Where used | Notes |
|------|------------|-------|
| `SQUARE_APPLICATION_ID` | `/api/config` (public) | Sandbox or prod app id |
| `SQUARE_LOCATION_ID` | config + create-payment | From Square Dashboard |
| `SQUARE_ACCESS_TOKEN` | **Functions only** | Secret — never commit |
| `SQUARE_ENVIRONMENT` | both | `sandbox` (default) or `production` |

## Client SDK
- Soft default script: `https://sandbox.web.squarecdn.com/v1/square.js`
- For production, switch pay page script to `https://web.squarecdn.com/v1/square.js` when `SQUARE_ENVIRONMENT=production`

## Never
- Commit access tokens
- Put `SQUARE_ACCESS_TOKEN` in HTML/JS assets
- Attach to `unitedmobilerv.com` until Matt reopens domain overlay
