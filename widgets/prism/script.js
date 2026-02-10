let ws;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 10000;
let lastImageFile = null;
let isShowingContent = false;

function connect() {
  ws = new WebSocket('ws://' + window.location.host);

  ws.onopen = () => {
    reconnectAttempts = 0;
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (!data || !data.title) {
      if (isShowingContent) {
        document.getElementById('waiting').style.display = 'block';
        document.getElementById('container').style.display = 'none';
        isShowingContent = false;
      }
      return;
    }

    if (!isShowingContent) {
      document.getElementById('waiting').style.display = 'none';
      document.getElementById('container').style.display = 'flex';
      isShowingContent = true;
    }

    document.getElementById('title').textContent = data.title || 'Unknown';
    document.getElementById('artist').textContent = data.artist || 'Unknown Artist';

    const albumArt = document.getElementById('album-art');
    if (data.imageFile !== lastImageFile) {
      lastImageFile = data.imageFile;
      if (data.imageFile) {
        albumArt.innerHTML = '<img src="/image?t=' + Date.now() + '" alt="Album Art">';
      } else {
        albumArt.innerHTML = '◇';
      }
    }

    const formatTime = (s) => {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };

    if (data.currentTime !== undefined && data.duration) {
      document.getElementById('time').textContent =
        formatTime(data.currentTime) + ' / ' + formatTime(data.duration);
      const pct = Math.max(0, Math.min(100, (data.currentTime / data.duration) * 100));
      document.getElementById('progress-bar').style.width = pct + '%';
    }
  };

  ws.onerror = (error) => {
    console.error('[Prism Theme] WebSocket error:', error);
  };

  ws.onclose = () => {
    reconnectAttempts++;
    const delay = Math.min(1000 * reconnectAttempts, MAX_RECONNECT_DELAY);
    setTimeout(connect, delay);
  };
}

connect();
