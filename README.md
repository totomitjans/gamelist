# gamelist

A game buying tracker.

## PSN trophy activity

The PSN activity widget uses Sony's PSN API through a Cloudflare Worker secret called `PSN_NPSSO`.

To set it up:

1. Log into PlayStation in your browser:
   https://www.playstation.com/
2. In the same browser, open:
   https://ca.account.sony.com/api/v1/ssocookie
3. Copy only the long `npsso` token value from the JSON response.
4. From this project folder, run:

```bash
npx wrangler secret put PSN_NPSSO
```

5. Paste the token when Wrangler asks for it.
6. Redeploy if needed:

```bash
npx wrangler deploy
```

Treat the NPSSO token like a password. Do not commit it, paste it in chat, or put it in `wrangler.toml`. If the widget says the token needs refreshing, repeat the same steps and overwrite the secret.

## Playasia prices

Playasia blocks normal Worker-side scraping, so production price fetching should use Playasia's affiliate/API credentials. Set both secrets in Cloudflare:

```bash
npx wrangler secret put PLAYASIA_USER_ID
npx wrangler secret put PLAYASIA_API_KEY
npx wrangler deploy
```

Without those secrets, the app still links to the Playasia search page, but prices may show as unavailable.

## Google Calendar preorder events

When a game is newly marked as preordered and has a release date, the Worker can automatically create an all-day Google Calendar event named `Preorder Game Name`.

Set up a Google Cloud service account with Google Calendar API access, then share the target calendar with the service account email with permission to make changes. Set these Cloudflare secrets:

```bash
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
npx wrangler secret put GOOGLE_PRIVATE_KEY
npx wrangler secret put GOOGLE_CALENDAR_ID
npx wrangler deploy
```

`GOOGLE_CALENDAR_ID` can be your calendar ID from Google Calendar settings. The private key should be the `private_key` value from the service account JSON. Do not commit it.
