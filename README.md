# Claire's Morning Signals

Private-by-link daily technology briefing published at [brief.clairesparlor.com](https://brief.clairesparlor.com).

## Structure

- `/` redirects to the latest issue.
- `/YYYY-MM-DD/` is a permanent issue URL.
- `public/og.png` is the Feishu and social link-preview image.
- Pages use `noindex,nofollow,noarchive`; this prevents indexing but is not authentication.

## Automatic deployment

Cloudflare Workers Builds watches the `main` branch. Pushing a commit to
`main` automatically runs `npx wrangler deploy` and publishes the site.

## Local verification and manual deployment

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm deploy:dry-run
pnpm deploy
```
