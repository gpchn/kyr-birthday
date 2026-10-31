/* ============================================================
   孔樱燃 · 十八岁生日快乐
   ============================================================ */
'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------
   飘落的花瓣 & 愿望彩带
   手机端：降低分辨率与粒子数、限制 30fps，并缓存花瓣精灵
   ------------------------------------------------------------ */
(function petals(){
  const canvas = document.getElementById('petals');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const isMobile = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
  const isLowPower = isMobile && (
    (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
    (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4)
  );
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
  const COLORS = ['#f6c3cf', '#f0aebf', '#f9d8e0', '#eeb3c0'];
  const SPRITE = 32;
  const SPRITE_SCALE = 2;
  const FRAME_TIME = isLowPower ? 1000 / 24 : isMobile ? 1000 / 30 : 0;
  const BURST_COUNT = isLowPower ? 14 : isMobile ? 18 : 38;

  let width = 0;
  let height = 0;
  let petalsList = [];
  let bursts = [];
  let rafId = 0;
  let lastTime = 0;
  let running = false;

  /* 把花瓣预渲染成小图，避免每帧重复构建贝塞尔路径 */
  function makeSprite(color){
    const sprite = document.createElement('canvas');
    sprite.width = SPRITE * SPRITE_SCALE;
    sprite.height = SPRITE * SPRITE_SCALE;
    const g = sprite.getContext('2d');
    if (!g) return sprite;

    g.scale(SPRITE_SCALE, SPRITE_SCALE);
    g.translate(SPRITE / 2, SPRITE / 2);
    const s = SPRITE / 2;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, -s);
    g.bezierCurveTo(s * .95, -s * .5, s * .8, s * .55, 0, s);
    g.bezierCurveTo(-s * .8, s * .55, -s * .95, -s * .5, 0, -s);
    g.closePath();
    g.fill();
    return sprite;
  }

  const sprites = COLORS.map(makeSprite);

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
      color: (Math.random() * sprites.length) | 0,
      alpha: .32 + Math.random() * .4
    };
  }

  function seed(){
    const count = isLowPower ? 8 : isMobile ? 12 : Math.min(28, Math.max(12, Math.round(width / 22)));
    petalsList = Array.from({ length: count }, () => makePetal(true));
  }

  function drawPetal(p){
    const size = p.size * 2;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.drawImage(sprites[p.color], -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function burst(x, y){
    if (prefersReducedMotion) return;
    for (let i = 0; i < BURST_COUNT; i++){
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
        color: (Math.random() * sprites.length) | 0,
        alpha: .5 + Math.random() * .45,
        life: 1
      });
    }
  }

  function frame(now){
    if (!running) return;
    rafId = requestAnimationFrame(frame);

    const elapsed = lastTime ? now - lastTime : (FRAME_TIME || 16.667);
    if (FRAME_TIME && elapsed < FRAME_TIME) return;

    const delta = Math.min(elapsed / 16.667, 2.5);
    lastTime = now;
    ctx.clearRect(0, 0, width, height);

    for (const p of petalsList){
      p.y += p.speed * delta;
      p.sway += p.swaySpeed * delta;
      p.x += Math.sin(p.sway) * p.swayAmp * .35 * delta;
      p.rotation += p.spin * delta;
      if (p.y > height + 24){ p.y = -24; p.x = Math.random() * width; }
      if (p.x < -24) p.x = width + 12;
      else if (p.x > width + 24) p.x = -12;
      drawPetal(p);
    }

    for (let i = bursts.length - 1; i >= 0; i--){
      const b = bursts[i];
      const damping = Math.pow(.985, delta);
      b.vx *= damping;
      b.vy = b.vy * damping + b.gravity * delta;
      b.x += b.vx * delta;
      b.y += b.vy * delta;
      b.rotation += b.spin * delta;
      b.life -= .009 * delta;
      if (b.life <= 0 || b.y > height + 40){
        bursts.splice(i, 1);
        continue;
      }

      const size = b.size * 2;
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life) * b.alpha;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);
      ctx.drawImage(sprites[b.color], -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  function resizeCanvas(){
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function start(){
    cancelAnimationFrame(rafId);
    running = false;
    resizeCanvas();
    seed();
    bursts.length = 0;
    if (prefersReducedMotion) return;

    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  }

  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  window.addEventListener('resize', () => {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    const widthChanged = nextWidth !== lastWidth;
    const heightChangedALot = Math.abs(nextHeight - lastHeight) > 120;
    lastWidth = nextWidth;
    lastHeight = nextHeight;

    /* 手机地址栏伸缩带来的轻微高度变化，不重新初始化花瓣 */
    if (isMobile && !widthChanged && !heightChangedALot) return;

    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(start, 180);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden){
      cancelAnimationFrame(rafId);
      rafId = 0;
      running = false;
    } else if (!prefersReducedMotion && !running){
      lastTime = 0;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
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
