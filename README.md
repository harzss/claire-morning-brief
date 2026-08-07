# Claire's Morning Signals

Private-by-link daily technology briefing published at [brief.clairesparlor.com](https://brief.clairesparlor.com).

## Structure

- `/` is the generated archive homepage with the latest issue and all dated issues.
- `/YYYY/` and `/YYYY/MM/` are generated year and month archive pages.
- `/YYYY/MM/DD/` is a permanent issue URL.
- `/YYYY/MM/DD/og.png` is the immutable Feishu and social link-preview image for that issue.
- Legacy `/YYYY-MM-DD/` links permanently redirect to the hierarchical URL.
- Pages use `noindex,nofollow,noarchive`; this prevents indexing but is not authentication.
- `robots.txt` allows preview crawlers to read those page-level directives and Open Graph metadata.

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
