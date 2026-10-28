# SRC website + ARES'26

This project now has two parts:

- **`/site`** – the new SRC homepage (plain HTML/CSS, no build step). This is what
  visitors see at the root domain (`/`).
- **`/ares26`** – the existing ARES'26 registration app (unchanged, except
  `vite.config.js` now builds to `/ares26/` instead of `/`).

## Building

```bash
chmod +x build.sh
./build.sh
```

This installs the ARES'26 app's dependencies, builds it into `dist/ares26`,
then copies the SRC homepage into `dist/`. The result:

```
dist/
  index.html        -> yoursite.com/
  style.css
  assets/
  ares26/
    index.html       -> yoursite.com/ares26/
    assets/...
```

## Deploying

Upload the whole `dist/` folder to your host (Vercel, Netlify, GitHub Pages,
your own server, etc.) as a static site. No server-side routing/rewrites are
needed — ARES'26 uses hash-based routing internally (`#register`, `#abstracts`,
etc.), so `/ares26/` only ever needs to serve `ares26/index.html`.

On Netlify/Vercel: set the build command to `./build.sh` and the publish
directory to `dist`.

Remember ARES'26 still needs its Supabase environment variables
(see `ares26/.env.example`) set in your hosting provider's environment
settings, same as before.

## Editing the homepage

Edit `site/index.html` and `site/style.css` directly — it's a static page,
so changes show up immediately on rebuild/redeploy, no npm install needed.
