# sosu Widget Development Guide

This guide will help you create custom widgets for sosu's now-playing overlay system.

## 📁 Folder Structure

Each widget theme should be in its own folder:

```
widgets/
├── your-theme-name/
│   ├── index.html        (required)
│   └── metadata.json     (required)
```

## 📄 metadata.json Format

Create a `metadata.json` file with theme information:

```json
{
  "name": "Your Theme Name",
  "version": "1.0",
  "author": "Your Name",
  "resolution": "750x250",
  "authorLinks": "https://github.com/yourusername"
}
```

**Fields:**
- `name`: Display name shown in theme manager
- `version`: Theme version
- `author`: Your name or username
- `resolution`: Recommended OBS browser source size
- `authorLinks`: Link to your GitHub/website (optional)

## 🎨 Creating index.html

Your widget connects to sosu via WebSocket and receives real-time music data.

### Basic Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Now Playing - Your Theme</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: transparent;
      color: #fff;
    }
    /* Your styles here */
  </style>
</head>
<body>
  <div id="waiting">Waiting for music...</div>
  <div id="container" style="display: none;">
    <div id="album-art">🎵</div>
    <div id="title">Song Title</div>
    <div id="artist">Artist Name</div>
    <div id="time">0:00 / 0:00</div>
  </div>

  <script>
    let ws;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_DELAY = 10000;
    let lastImageFile = null;
    let isShowingContent = false;
    
    function connect() {
      ws = new WebSocket('ws://' + window.location.host);
      
      ws.onopen = () => {
        console.log('[Your Theme] Connected');
        reconnectAttempts = 0;
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // No song playing
        if (!data || !data.title) {
          if (isShowingContent) {
            document.getElementById('waiting').style.display = 'block';
            document.getElementById('container').style.display = 'none';
            isShowingContent = false;
          }
          return;
        }
        
        // Show content
        if (!isShowingContent) {
          document.getElementById('waiting').style.display = 'none';
          document.getElementById('container').style.display = 'block';
          isShowingContent = true;
        }
        
        // Update song info
        document.getElementById('title').textContent = data.title || 'Unknown';
        document.getElementById('artist').textContent = data.artist || 'Unknown Artist';
        
        // Update album art (only when changed to prevent flickering)
        const albumArt = document.getElementById('album-art');
        if (data.imageFile !== lastImageFile) {
          lastImageFile = data.imageFile;
          if (data.imageFile) {
            albumArt.innerHTML = '<img src="/image?t=' + Date.now() + '" alt="Album Art">';
          } else {
            albumArt.innerHTML = '🎵';
          }
        }
        
        // Update time
        if (data.currentTime !== undefined && data.duration) {
          const formatTime = (s) => {
            const mins = Math.floor(s / 60);
            const secs = Math.floor(s % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
          };
          document.getElementById('time').textContent = 
            formatTime(data.currentTime) + ' / ' + formatTime(data.duration);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[Your Theme] WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('[Your Theme] Disconnected, reconnecting...');
        reconnectAttempts++;
        const delay = Math.min(1000 * reconnectAttempts, MAX_RECONNECT_DELAY);
        setTimeout(connect, delay);
      };
    }
    
    connect();
  </script>
</body>
</html>
```

## 📡 WebSocket Data Format

The server sends JSON data every second:

```javascript
{
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "currentTime": 45.5,      // seconds
  "duration": 180.0,        // seconds
  "imageFile": "path.jpg",  // null if no album art
  "isPlaying": true
}
```

**Important Notes:**
- Data is sent even when values don't change
- `imageFile` can be `null` if no album art available
- Album art accessible via `/image` endpoint
- All fields might be missing - always check before using

## 🖼️ Album Art

To display album art:

```javascript
if (data.imageFile) {
  // Add timestamp to prevent caching
  albumArt.innerHTML = '<img src="/image?t=' + Date.now() + '" alt="Album Art">';
} else {
  // Fallback when no image
  albumArt.innerHTML = '🎵';
}
```

**Best Practice:** Only update when `imageFile` changes to prevent flickering:

```javascript
let lastImageFile = null;

if (data.imageFile !== lastImageFile) {
  lastImageFile = data.imageFile;
  // Update image
}
```

## 🎯 Best Practices

### 1. Prevent Flickering
Track state and only update DOM when values actually change:

```javascript
let isShowingContent = false;

if (!isShowingContent) {
  // Show widget only once
  element.style.display = 'block';
  isShowingContent = true;
}
```

### 2. Connection Handling
Implement exponential backoff for reconnection:

```javascript
reconnectAttempts++;
const delay = Math.min(1000 * reconnectAttempts, MAX_RECONNECT_DELAY);
setTimeout(connect, delay);
```

Reset counter on successful connection:

```javascript
ws.onopen = () => {
  reconnectAttempts = 0;
};
```

### 3. Error Handling
Always implement `onerror` handler:

```javascript
ws.onerror = (error) => {
  console.error('[Theme] WebSocket error:', error);
};
```

### 4. Transparent Background
For OBS overlays, use transparent background:

```css
body {
  background: transparent;
}
```

### 5. Responsive Design
Consider different OBS browser source sizes:

```css
.container {
  max-width: 750px;
  padding: 20px;
}
```

## 🚀 Testing Your Widget

1. Place your theme folder in `widgets/`
2. Restart sosu app (themes auto-copy to AppData)
3. Open Widget Server in Settings
4. Visit `http://localhost:3737/themes`
5. Preview and test your theme

## 📋 Available Endpoints

- `ws://localhost:3737` - WebSocket for real-time data
- `http://localhost:3737/widget?theme=your-theme` - Widget URL for OBS
- `http://localhost:3737/image` - Current album art
- `http://localhost:3737/json` - Current song data (JSON)
- `http://localhost:3737/status` - Server status

## 💡 Example Themes

Check out the bundled themes for inspiration:

- **default** - Full-featured with progress bar and controls
- **minimal** - Clean and simple design
- **neon** - Cyberpunk style with glow effects

## 🔧 Troubleshooting

**Widget not showing up?**
- Check `metadata.json` is valid JSON
- Ensure `index.html` exists
- Restart sosu app to sync themes

**Album art not loading?**
- Check `/image` endpoint returns data
- Verify `data.imageFile` is not null
- Add timestamp to prevent caching: `/image?t=${Date.now()}`

**WebSocket disconnecting?**
- Implement reconnection logic with backoff
- Check console for error messages
- Verify server is running on port 3737

**Widget flickering?**
- Only update DOM when values change
- Track `lastImageFile` to prevent image reloads
- Use `isShowingContent` flag for display toggling

## 📦 Sharing Your Theme

To share your theme:

1. Zip your theme folder
2. Include both `index.html` and `metadata.json`
3. Share with installation instructions:
   - Extract to `AppData/Local/sosu/widgets/` folder
   - Or place in project `widgets/` folder before building

---

**Happy Widget Creating! 🎨**

For questions or issues, visit: https://github.com/Adivise/sosu
