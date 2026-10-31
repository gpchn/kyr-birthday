/* ============================================================
   孔樱燃 · 十八岁生日快乐
   ============================================================ */
'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------
   飘落的花瓣 & 愿望彩带
   ------------------------------------------------------------ */
(function petals(){
  const canvas = document.getElementById('petals');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const COLORS = ['#f6c3cf', '#f0aebf', '#f9d8e0', '#eeb3c0'];
  let width = 0;
  let height = 0;
  let petalsList = [];
  let bursts = [];
  let rafId = 0;

  function petalPath(size){
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * .95, -size * .5, size * .8, size * .55, 0, size);
    ctx.bezierCurveTo(-size * .8, size * .55, -size * .95, -size * .5, 0, -size);
    ctx.closePath();
  }

  function makePetal(randomY){
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -20 - Math.random() * height * .3,
      size: 5 + Math.random() * 5,
      speed: .35 + Math.random() * .75,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: .008 + Math.random() * .012,
      swayAmp: .5 + Math.random() * 1.1,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - .5) * .02,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      alpha: .32 + Math.random() * .4
    };
  }

  function seed(){
    const count = Math.min(34, Math.max(12, Math.round(width / 19)));
    petalsList = Array.from({ length: count }, () => makePetal(true));
  }

  function drawPetal(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    petalPath(p.size);
    ctx.fill();
    ctx.restore();
  }

  function burst(x, y){
    if (prefersReducedMotion) return;
    for (let i = 0; i < 38; i++){
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 4.4;
      bursts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.4,
        gravity: .045 + Math.random() * .03,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * .26,
        size: 4 + Math.random() * 5,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: .5 + Math.random() * .45,
        life: 1
      });
    }
  }

  function frame(){
    ctx.clearRect(0, 0, width, height);

    for (const p of petalsList){
      p.y += p.speed;
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * p.swayAmp * .35;
      p.rotation += p.spin;
      if (p.y > height + 24){ p.y = -24; p.x = Math.random() * width; }
      if (p.x < -24) p.x = width + 12;
      else if (p.x > width + 24) p.x = -12;
      drawPetal(p);
    }

    for (let i = bursts.length - 1; i >= 0; i--){
      const b = bursts[i];
      b.vx *= .985;
      b.vy = b.vy * .985 + b.gravity;
      b.x += b.vx;
      b.y += b.vy;
      b.rotation += b.spin;
      b.life -= .009;
      if (b.life <= 0 || b.y > height + 40){
        bursts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);
      ctx.globalAlpha = Math.min(1, b.life) * b.alpha;
      ctx.fillStyle = b.color;
      petalPath(b.size);
      ctx.fill();
      ctx.restore();
    }

    rafId = requestAnimationFrame(frame);
  }

  function resizeCanvas(){
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function start(){
    cancelAnimationFrame(rafId);
    resizeCanvas();
    seed();
    if (!prefersReducedMotion) frame();
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(start, 180);
  });

  window.__petalBurst = burst;
  start();
})();

/* ------------------------------------------------------------
   吹蜡烛
   ------------------------------------------------------------ */
(function cake(){
  const cake = document.getElementById('cake');
  const candles = Array.from(document.querySelectorAll('.candle'));
  const stage = document.getElementById('cakeStage');
  const blowBtn = document.getElementById('blowBtn');
  const result = document.getElementById('wishResult');
  const relightBtn = document.getElementById('relightBtn');
  if (!cake || candles.length === 0) return;

  const positions = ['左边', '中间', '右边'];
  let isFinished = false;

  const litCandles = () => candles.filter((c) => !c.classList.contains('is-out'));

  function updateLabel(candle, index, out){
    candle.setAttribute('aria-label', `${positions[index]}的蜡烛，${out ? '已吹灭' : '点击吹灭'}`);
  }

  function finish(){
    if (isFinished) return;
    isFinished = true;
    blowBtn.hidden = true;
    result.hidden = false;

    const rect = stage.getBoundingClientRect();
    window.__petalBurst?.(
      rect.left + rect.width / 2,
      rect.top + rect.height * .42
    );

    window.setTimeout(() => {
      result.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest'
      });
    }, 180);
  }

  function blowOut(candle, index){
    if (candle.classList.contains('is-out')) return;
    candle.classList.add('is-out');
    candle.dataset.lit = 'false';
    updateLabel(candle, index, true);
    if (litCandles().length === 0) window.setTimeout(finish, 480);
  }

  candles.forEach((candle, index) => {
    candle.dataset.index = String(index);
    candle.addEventListener('click', () => blowOut(candle, index));
    candle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        blowOut(candle, index);
      }
    });
  });

  /* 点蛋糕空白处，也会依次吹灭下一根蜡烛 */
  cake.addEventListener('click', (event) => {
    if (event.target.closest('.candle')) return;
    const next = litCandles()[0];
    if (next) blowOut(next, Number(next.dataset.index));
  });

  blowBtn.addEventListener('click', () => {
    const next = litCandles()[0];
    if (next) blowOut(next, Number(next.dataset.index));
  });

  relightBtn.addEventListener('click', () => {
    isFinished = false;
    candles.forEach((candle, index) => {
      candle.classList.remove('is-out');
      candle.dataset.lit = 'true';
      updateLabel(candle, index, false);
    });
    result.hidden = true;
    blowBtn.hidden = false;
  });
})();

/* ------------------------------------------------------------
   滚动浮现
   ------------------------------------------------------------ */
(function reveal(){
  const items = Array.from(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)){
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

  items.forEach((item) => observer.observe(item));
})();

/* ------------------------------------------------------------
   BGM：bgm.mp3
   进入页面即尝试播放；受浏览器自动播放策略限制时，
   首次点击 / 触摸 / 按键页面任意位置会自动开始。
   ------------------------------------------------------------ */
(function music(){
  const audio = document.getElementById('bgm');
  const button = document.getElementById('soundBtn');
  if (!audio || !button) return;

  audio.volume = .65;
  let userPaused = false;
  let starting = null;

  function syncButton(playing){
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '暂停生日歌' : '播放生日歌');
  }

  function playNow(){
    if (userPaused) return Promise.resolve(false);

    let request;
    try{
      request = audio.play();
    }catch (error){
      return Promise.resolve(false);
    }

    return Promise.resolve(request)
      .then(() => true)
      .catch(() => false);
  }

  function tryPlay(){
    if (userPaused) return Promise.resolve(false);
    if (starting) return starting;

    starting = playNow().then((ok) => {
      starting = null;
      return ok;
    });

    return starting;
  }

  function unlock(event){
    if (event && event.target && event.target.closest && event.target.closest('#soundBtn')) return;
    /* 手势内直接重新调用 play，避免复用到上一次被拦截的请求 */
    playNow().then((ok) => {
      if (ok) removeUnlock();
    });
  }

  function removeUnlock(){
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('click', unlock, true);
    document.removeEventListener('keydown', unlock, true);
  }

  /* 自动播放尝试：加载、可播放、回到页面时都试一次 */
  tryPlay();
  audio.addEventListener('canplay', () => { if (!userPaused) tryPlay(); }, { once: true });
  window.addEventListener('load', () => { if (!userPaused) tryPlay(); }, { once: true });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && !userPaused) tryPlay();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !userPaused) tryPlay();
  });

  /* 微信内置浏览器：通过 WeixinJSBridge 争取自动播放 */
  function wechatPlay(){
    if (window.WeixinJSBridge && typeof window.WeixinJSBridge.invoke === 'function'){
      window.WeixinJSBridge.invoke('getNetworkType', {}, () => {
        playNow().then((ok) => { if (ok) removeUnlock(); });
      });
    } else {
      playNow();
    }
  }
  if (window.WeixinJSBridge){
    wechatPlay();
  } else {
    document.addEventListener('WeixinJSBridgeReady', wechatPlay, false);
  }

  /* 浏览器拦截时，首次交互即开始 */
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('click', unlock, true);
  document.addEventListener('keydown', unlock, true);

  button.addEventListener('click', async () => {
    if (audio.paused){
      userPaused = false;
      const ok = await playNow();
      if (!ok) syncButton(false);
    } else {
      userPaused = true;
      audio.pause();
    }
  });

  audio.addEventListener('play', () => syncButton(true));
  audio.addEventListener('pause', () => syncButton(false));
  audio.addEventListener('error', () => {
    button.classList.add('is-error');
    button.disabled = true;
    button.setAttribute('aria-label', '背景音乐暂不可用');
  });

  syncButton(!audio.paused);
})();
