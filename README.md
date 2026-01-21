# sosu Widget Development Guide

Build, preview, and share custom now-playing widgets for sosu.

## Project layout

```
widgets/
  your-theme/
    index.html      # required
    metadata.json   # required
```

## metadata.json schema

```json
{
  "name": "Your Theme Name",
  "version": "1.0.0",
  "author": "Your Name",
  "resolution": "750x250",
  "authorLinks": "https://github.com/yourusername"
}
```

- `name`: Display name in the theme manager
- `version`: Semver-ish string; bump when you change visuals/UX
- `author`: Your credit
- `resolution`: Recommended OBS browser source size
- `authorLinks`: Optional profile/portfolio URL

## Live data contract

WebSocket `ws://localhost:3737` sends JSON roughly every second:

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

Album art is served at `/image`; append `?t=${Date.now()}` to avoid caching.

## Starter template (minimal wiring)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Now Playing - Your Theme</title>
  <style>
    body { margin: 0; font-family: 'Inter','Segoe UI',sans-serif; background: transparent; color: #fff; }
  </style>
</head>
<body>
  <div id="waiting">Waiting for music...</div>
  <div id="container" style="display:none;">
    <div id="album-art">🎵</div>
    <div id="title">Song Title</div>
    <div id="artist">Artist Name</div>
    <div id="time">0:00 / 0:00</div>
  </div>

  <script>
    let ws; let tries = 0; const MAX = 10000;
    let lastImage = null; let showing = false;

    function fmt(s){ const m=Math.floor(s/60); const ss=Math.floor(s%60); return m+":"+(ss<10?"0":"")+ss; }

    function render(data){
      if(!data || !data.title){
        if(showing){ waiting.style.display='block'; container.style.display='none'; showing=false; }
        return;
      }
      if(!showing){ waiting.style.display='none'; container.style.display='block'; showing=true; }
      title.textContent = data.title || 'Unknown';
      artist.textContent = data.artist || 'Unknown Artist';
      if(data.currentTime !== undefined && data.duration){ time.textContent = fmt(data.currentTime)+' / '+fmt(data.duration); }
      if(data.imageFile !== lastImage){ lastImage = data.imageFile; albumArt.innerHTML = data.imageFile ? '<img src="/image?t='+Date.now()+'" alt="Album Art">' : '🎵'; }
    }

    function connect(){
      ws = new WebSocket('ws://'+window.location.host);
      ws.onopen = () => { tries = 0; };
      ws.onmessage = (e) => render(JSON.parse(e.data));
      ws.onerror = console.error;
      ws.onclose = () => { tries++; setTimeout(connect, Math.min(1000*tries, MAX)); };
    }
    connect();
  </script>
</body>
</html>
```

## Best practices

- Prevent flicker: only swap album art when `imageFile` changes; toggle visibility once.
- Be cache-safe: add a timestamp query to `/image`.
- Recover cleanly: reconnect with backoff and reset the counter on `onopen`.
- Keep it transparent: set `body { background: transparent; }` for OBS.
- Right-size: match your layout to `resolution` so users can copy-paste into OBS.

## Testing checklist

- Theme folder has both `index.html` and `metadata.json` and valid JSON.
- Open `http://localhost:3737/themes` to preview; verify album art, text overflow, and paused states.
- Resize the OBS/browser source to your advertised `resolution` to confirm fit.

## Publishing to the sosu-widgets repo

1) Place your theme under `widgets/your-theme/` with `index.html` and `metadata.json`.
2) Bump `version` whenever visuals/UX change so users see the Update button.
3) Commit and open a PR; include a screenshot and the recommended resolution.

Happy building! 🎨
