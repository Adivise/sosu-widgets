(function(){
  function init(){
    const host = window.location.host;
    let ws; let tries = 0; const MAX=10000;
    let lastImage = null; let playing = false;

    const art = document.getElementById('art');
    const titleEl = document.getElementById('title');
    const artistEl = document.getElementById('artist');
    const timeEl = document.getElementById('time');
    const container = document.querySelector('.widget');
    const vinyl = document.querySelector('.vinyl');

    let canvas = document.getElementById('canvas');
    let ctx = canvas ? canvas.getContext('2d') : null;

    function fmt(s){ const m=Math.floor(s/60); const ss=Math.floor(s%60); return m+":"+(ss<10?"0":"")+ss }

    function render(d){
      if(!d || !d.title){ titleEl.textContent='—'; artistEl.textContent=''; timeEl.textContent='waiting'; container.classList.remove('playing'); container.classList.add('paused'); return }
      titleEl.textContent = d.title || 'Unknown';
      artistEl.textContent = d.artist || ''; 
      timeEl.textContent = (d.currentTime !== undefined && d.duration) ? fmt(d.currentTime)+' / '+fmt(d.duration) : '';
      playing = !d.paused;
      container.classList.toggle('playing', playing);

      if(d.imageFile !== lastImage){ lastImage = d.imageFile; if(d.imageFile){ art.src = '/image?t='+Date.now(); art.style.display='block' } else { art.style.display='none' }}
    }

    function connect(){
      ws = new WebSocket('ws://'+host);
      ws.onopen = ()=>{ tries=0; };
      ws.onmessage = e => { try{ render(JSON.parse(e.data)); } catch(e){} };
      ws.onclose = ()=>{ tries++; setTimeout(connect, Math.min(2000*tries, MAX)); };
      ws.onerror = ()=>{};
    }
    connect();

    // subtle rotation animation when playing
    let rot = 0; function anim(){ requestAnimationFrame(anim); if(playing) rot += 0.0025; vinyl.style.transform = 'rotate('+rot+'turn)'; }
    anim();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();