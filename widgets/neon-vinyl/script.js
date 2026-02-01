(function(){
  const host = window.location.host;
  let ws; let tries = 0; const MAX=10000;
  let lastImage = null; let playing = false;

  const art = document.getElementById('art');
  const titleEl = document.getElementById('title');
  const artistEl = document.getElementById('artist');
  const timeEl = document.getElementById('time');
  const container = document.querySelector('.widget');
  const vinyl = document.querySelector('.vinyl');
  const canvas = document.getElementById('ring');
  const ctx = canvas.getContext('2d');

  canvas.width = 420; canvas.height = 420;
  const cx = canvas.width/2, cy = canvas.height/2, radius = 170;

  function fmt(s){ const m=Math.floor(s/60); const ss=Math.floor(s%60); return m+":"+(ss<10?"0":"")+ss }

  function seedFrom(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); } return Math.abs(h)%100000 }

  function drawRing(time, seed){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const bands = 72; // points
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate((time%30)/30 * Math.PI*2);

    for(let i=0;i<bands;i++){
      const a = (i/bands)*Math.PI*2;
      const noise = (Math.sin(a*12 + seed*0.0003 + time*0.6) + Math.cos(a*7 + time*0.9*seed*0.0001))/2;
      const h = 8 + Math.abs(noise)*28;
      const x1 = Math.cos(a)*(radius-h);
      const y1 = Math.sin(a)*(radius-h);
      const x2 = Math.cos(a)*(radius+h);
      const y2 = Math.sin(a)*(radius+h);
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      const grad = ctx.createLinearGradient(x1,y1,x2,y2);
      grad.addColorStop(0,'rgba(125,249,255,0.02)');
      grad.addColorStop(1,'rgba(255,92,168,0.45)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  function render(d){
    if(!d || !d.title){ titleEl.textContent='—'; artistEl.textContent=''; timeEl.textContent='waiting'; container.classList.remove('playing'); container.classList.add('paused'); return }
    titleEl.textContent = d.title || 'Unknown';
    artistEl.textContent = d.artist || ''; 
    timeEl.textContent = (d.currentTime !== undefined && d.duration) ? fmt(d.currentTime)+' / '+fmt(d.duration) : '';
    playing = !d.paused;
    container.classList.toggle('playing', playing);

    if(d.imageFile !== lastImage){ lastImage = d.imageFile; if(d.imageFile){ art.src = '/image?t='+Date.now(); art.style.display='block' } else { art.style.display='none' }}

    // seed by title+artist for deterministic waveform
    const seed = seedFrom((d.title||'') + '|' + (d.artist||''));
    drawRing(d.currentTime || (Date.now()/1000), seed);
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
})();