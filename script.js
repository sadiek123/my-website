// Preloader logic
(function() {
  var preloader = document.getElementById('preloader');
  var video = document.getElementById('preloaderVideo');
  var prompt = document.getElementById('preloader-click-prompt');
  var whiteFade = document.getElementById('preloader-white-fade');
  
  if (!preloader || !video) return;

  // Add scroll lock
  document.body.classList.add('preloader-active');

  var started = false;
  var fadeStarted = false;
  var FADE_LEAD = 0.5; // fade begins this many seconds before video ends
  var FADE_TAIL = 0.5; // hold on white after video ends before dismiss

  function startWhiteFade() {
    if (fadeStarted) return;
    fadeStarted = true;
    if (whiteFade) whiteFade.classList.add('active');
    video.removeEventListener('timeupdate', onTimeUpdate);
  }

  function onTimeUpdate() {
    if (!video.duration || !isFinite(video.duration)) return;
    if (video.currentTime >= video.duration - FADE_LEAD) {
      startWhiteFade();
    }
  }

  function startVideo() {
    if (started) return;
    started = true;

    if (prompt) prompt.classList.add('fade-out');
    
    // Play background music on first interaction
    var bgMusic = document.getElementById('bgMusic');
    if (bgMusic) {
      bgMusic.volume = 0.6; // Set a pleasant default volume
      bgMusic.play().catch(function(e) { console.log("Audio autoplay prevented", e); });
    }

    video.play().catch(function(error) {
      console.error("Video play failed, skipping preloader: ", error);
      dismissPreloader();
    });
  }

  function dismissPreloader() {
    video.pause();
    preloader.classList.add('fade-out');
    document.body.classList.remove('preloader-active');

    // Notify Hero section to start
    var event = new CustomEvent('preloaderEnded');
    document.dispatchEvent(event);

    setTimeout(function() {
      preloader.remove();
    }, 1200);
  }

  function onVideoEnded() {
    var alreadyFading = fadeStarted;
    startWhiteFade();
    // Normal path: fade began 0.5s early; wait 0.5s more (1s total). Fallback: full 1s fade.
    var delay = alreadyFading ? FADE_TAIL : 1000;
    setTimeout(dismissPreloader, delay);
  }

  // Click anywhere on preloader to start video
  preloader.addEventListener('click', startVideo);

  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('ended', onVideoEnded);
})();

// Hero video -> reveal content when finished
(function(){
  var v = document.getElementById('heroVideo');
  var content = document.getElementById('heroContent');
  if(!v) return;
  function reveal(){
    if(content) content.classList.add('show');
  }
  
  function initHero() {
    v.play().catch(function(e) {
      console.log("Hero video autoplay blocked or paused: ", e);
    });
    reveal();
  }

  // If preloader exists, wait for it to complete. Otherwise start immediately.
  if (document.getElementById('preloader')) {
    document.addEventListener('preloaderEnded', initHero);
  } else {
    initHero();
  }
})();

// Countdown
(function(){
  var TARGET = new Date("2026-08-07T20:00:00+02:00").getTime();
  var els = {
    days: document.querySelector('[data-k="days"]'),
    hours: document.querySelector('[data-k="hours"]'),
    minutes: document.querySelector('[data-k="minutes"]'),
  };
  if (!els.days || !els.hours || !els.minutes) return;
  function pad(n){return String(n).padStart(2,'0');}
  function tick(){
    var d = Math.max(0, TARGET - Date.now());
    els.days.textContent    = pad(Math.floor(d/86400000));
    els.hours.textContent   = pad(Math.floor((d/3600000)%24));
    els.minutes.textContent = pad(Math.floor((d/60000)%60));
  }
  tick(); setInterval(tick, 1000);
})();

// Gallery slider
(function(){
  var images = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80"
  ];
  var slides = document.getElementById('slides');
  var dotsWrap = document.getElementById('dots');
  if(!slides) return;
  var idx = 0;
  images.forEach(function(src,i){
    var img = document.createElement('img');
    img.src = src; img.alt = 'Moment '+(i+1); img.loading = i===0?'eager':'lazy';
    if(i===0) img.classList.add('active');
    slides.appendChild(img);
    var b = document.createElement('button');
    b.setAttribute('aria-label','Go to slide '+(i+1));
    if(i===0) b.classList.add('active');
    b.addEventListener('click', function(){ go(i); });
    dotsWrap.appendChild(b);
  });
  var imgs = slides.querySelectorAll('img');
  var dots = dotsWrap.querySelectorAll('button');
  function go(n){
    if(n===idx) return;
    var dir = n>idx ? 1 : -1;
    imgs[idx].classList.remove('active');
    if(dir<0) imgs[idx].classList.add('prev'); else imgs[idx].classList.remove('prev');
    setTimeout(function(){ imgs[idx].classList.remove('prev'); idx=n;
      imgs[idx].classList.add('active');
      dots.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
    }, 10);
  }
  function step(d){ go((idx+d+images.length)%images.length); }
  document.querySelector('.slider .prev').addEventListener('click', function(){ step(-1); });
  document.querySelector('.slider .next').addEventListener('click', function(){ step(1); });
  setInterval(function(){ step(1); }, 6000);
})();

// In-view reveal
(function(){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '-60px' });
  document.querySelectorAll('.inview').forEach(function(el){ io.observe(el); });
})();

// Music Toggle Logic
(function() {
  var bgMusic = document.getElementById('bgMusic');
  var musicToggle = document.getElementById('musicToggle');
  
  if (!bgMusic || !musicToggle) return;

  musicToggle.addEventListener('click', function() {
    if (bgMusic.paused) {
      bgMusic.play();
      musicToggle.classList.remove('muted');
    } else {
      bgMusic.pause();
      musicToggle.classList.add('muted');
    }
  });
})();