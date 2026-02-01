<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=SOSU-Widgets&fontSize=80&fontAlignY=35&animation=twinkling&fontColor=gradient"/>
</p>

Create attractive, OBS-ready now-playing widgets for SOSU. This guide explains the theme layout, required metadata, live data contract, a minimal starter template, best practices, and publishing steps.

---

## Project layout

Each theme is a folder under `widgets/`:

```
widgets/
  your-theme/
    index.html      # required (entry point)
    metadata.json   # required (theme info)
    assets/         # optional images, css, js
```

Keep your theme self-contained and avoid external dependencies so previews and the theme manager work offline.

---

## metadata.json (required)

Example:

```json
{
  "name": "Your Theme Name",
  "version": "1.0.0",
  "author": "Your Name",
  "resolution": "750x250",
  "authorLinks": "https://github.com/yourusername",
  "description": "Short one-liner about the theme"
}
```

Fields:
- `name` — Display name in the theme manager
- `version` — Bump this on visual/UX changes so users can update
- `author` — Your credit
- `resolution` — Recommended OBS/browser source size (width x height)
- `authorLinks` — Optional profile/portfolio URL
- `description` — Optional short description shown in preview

Validation note: the theme manager will reject invalid JSON or if `index.html` is missing.

---

## Live data contract (WebSocket)

The widget server broadcasts a JSON payload (approx. once per second) over the WebSocket connection to supply "now playing" data:

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "duration": 180.0,
  "currentTime": 45.5,
  "imageFile": "path-or-null",
  "paused": false
}
```

- `imageFile`: file path served at `/image` (use `?t=TIMESTAMP` when loading to avoid caching).
- Treat fields as optional; always use sensible fallbacks when values are missing.

---

## Minimal starter template

A small, resilient template that handles reconnect/backoff and avoids flicker:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Now Playing — Theme</title>
  <style>
    html,body { height:100%; margin:0; background:transparent; font-family:Inter,Segoe UI,Arial,sans-serif; color:#fff }
    #waiting { padding:12px; }
    #container { display:none; padding:8px; }
    img.album { width:80px; height:80px; object-fit:cover; border-radius:6px }
  </style>
</head>
<body>
  <div id="waiting">Waiting for music...</div>
  <div id="container">
    <img id="art" class="album" src="" alt="cover" style="display:none" />
    <div id="meta">
      <div id="title">—</div>
      <div id="artist">—</div>
      <div id="time">0:00 / 0:00</div>
    </div>
  </div>

  <script>
    // Simple reconnect/backoff
    const host = window.location.host;
    let ws, tries = 0, lastImage = null, visible = false;

    function fmt(s){ const m=Math.floor(s/60); const ss=Math.floor(s%60); return m+":"+(ss<10?"0":"")+ss }

    function render(d){
      if(!d || !d.title){ if(visible){ document.getElementById('waiting').style.display='block'; document.getElementById('container').style.display='none'; visible=false } return }
      document.getElementById('waiting').style.display='none'; document.getElementById('container').style.display='flex'; visible=true;
      document.getElementById('title').textContent = d.title || 'Unknown';
      document.getElementById('artist').textContent = d.artist || ''; 
      if(d.duration) document.getElementById('time').textContent = fmt(d.currentTime||0)+' / '+fmt(d.duration);
      if(d.imageFile !== lastImage){ lastImage = d.imageFile; const art = document.getElementById('art'); if(d.imageFile){ art.src = '/image?t='+Date.now(); art.style.display='block' } else { art.style.display='none' } }
    }

    function connect(){
      ws = new WebSocket('ws://'+host);
      ws.onopen = () => { tries = 0 };
      ws.onmessage = e => { try { render(JSON.parse(e.data)); } catch(e){} };
      ws.onclose = () => { tries++; setTimeout(connect, Math.min(2000 * tries, 10000)); };
      ws.onerror = () => {};
    }
    connect();
  </script>
</body>
</html>
```

---

## Best practices

- Avoid flicker: only update the DOM or swap album art when the underlying value changes.
- Be cache-safe: always request album art with a timestamp (`/image?t=${Date.now()}`) to avoid stale images.
- Handle missing data gracefully: show placeholders when fields are absent.
- Transparent backgrounds work best for OBS overlays — prefer `background: transparent`.
- Match your layout to the advertised `resolution` for predictable results in OBS.

---

## Preview & testing checklist

- Ensure `index.html` and `metadata.json` exist and JSON is valid.
- Open `http://localhost:3737/themes` to preview your theme and check:
  - Album art loads and updates (no flicker)
  - Text truncation/overflow is handled
  - Paused state looks correct
  - Layout fits in your declared `resolution`

---

## Publishing to the sosu-widgets repo

1. Add your theme under `widgets/your-theme/` with `index.html`, `metadata.json`, and assets.
2. Bump `version` whenever you change visuals or UX so users can update.
3. Create a PR with a screenshot and the recommended `resolution`.

We’ll review and merge usable themes into the official collection — thank you for contributing!

---

## Licence & contact

- Add your author/credit in `metadata.json`.
- If you have security concerns or need to contact the project maintainers, use the main project's `SECURITY.md` or open an issue.

Happy building! 🎨
