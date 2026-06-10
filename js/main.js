/* ============================================================
   YANDÊ · interações e animações
   GSAP + ScrollTrigger + Lenis (CDN) · canvas autoral
   Conceito: "O Mergulho" — entrada de tinta, plâncton vivo,
   HUD de profundidade e contadores dinâmicos.
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  // Decisão de produto (Matheus, 2026-06-10): ignorar o "reduzir movimento"
  // do SO. Windows/Android em economia de energia ligam esse sinal e o site
  // inteiro parecia morto. A experiência renderiza completa sempre; quem não
  // sustenta os frames cai no modo leve via watchdog, não via sinal do SO.
  const reduceMotion = false;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // js-anima esconde [data-reveal] até a animação revelar. Só pode entrar
  // se GSAP+ScrollTrigger realmente carregaram (CDN bloqueada em redes
  // corporativas não pode deixar o conteúdo invisível para sempre).
  if (window.gsap && window.ScrollTrigger) document.body.classList.add('js-anima');

  /* ===== Modo leve: dispositivos fracos ganham o site sem custo de GPU.
     Detecção estática (núcleos/memória) + watchdog de FPS em runtime. ===== */
  const estado = {
    leve:
      /[?&]leve=1/.test(location.search) ||
      (navigator.hardwareConcurrency || 8) <= 4 ||
      (navigator.deviceMemory || 8) <= 4,
  };
  function ativarModoLeve() {
    if (estado.leve) return aplicarModoLeve();
    estado.leve = true;
    aplicarModoLeve();
    if (lenis) { lenis.destroy(); lenis = null; }
  }
  function aplicarModoLeve() {
    document.body.classList.add('modo-leve');
  }
  if (estado.leve) aplicarModoLeve();

  /* ===== Entrada: o sonar do Yan =====
     O símbolo emerge, dois anéis de sonar se expandem e a tela
     sobe revelando o hero, que assenta com um leve zoom.
     Sem barra de carregamento: nunca prende o visitante. */
  const tinta = $('#tinta');
  let entrou = false;
  function finalizarEntrada() {
    if (entrou) return;
    entrou = true;
    document.body.removeAttribute('data-entrando');
    introHero();
  }
  function entradaCinematica() {
    if (reduceMotion || estado.leve || !window.gsap) {
      tinta.classList.add('tinta--saiu');
      finalizarEntrada();
      setTimeout(() => tinta.remove(), 600);
      return;
    }
    const aneis = $$('.tinta__anel', tinta);
    const tl = gsap.timeline({ onComplete: () => tinta.remove() });
    tl.fromTo('.tinta__simbolo', { opacity: 0, scale: 0.86 },
        { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' })
      .to('.tinta__glow', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.05)
      .fromTo('.tinta__tag', { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.4)
      .fromTo(aneis[0], { scale: 0.35, opacity: 0.85 },
        { scale: 2.7, opacity: 0, duration: 1.05, ease: 'power2.out' }, 0.35)
      .fromTo(aneis[1], { scale: 0.35, opacity: 0.7 },
        { scale: 3.3, opacity: 0, duration: 1.15, ease: 'power2.out' }, 0.55)
      .to(['.tinta__simbolo', '.tinta__tag'],
        { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in' }, 1.3)
      .to('.tinta__glow', { opacity: 0, duration: 0.35 }, 1.3)
      .add(finalizarEntrada, 1.42)
      .to(tinta, { yPercent: -100, duration: 0.85, ease: 'power3.inOut' }, 1.42)
      .fromTo('.hero__inner', { scale: 1.035, transformOrigin: '50% 60%' },
        { scale: 1, duration: 1.3, ease: 'power2.out', clearProps: 'all' }, 1.5);
  }
  entradaCinematica();
  setTimeout(() => { // teto de segurança: nada prende o visitante
    if (document.body.hasAttribute('data-entrando')) {
      finalizarEntrada();
      tinta.remove();
    }
  }, 4000);

  /* ===== Lenis + GSAP ===== */
  let lenis = null;
  function prepararScroll() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (!reduceMotion && !estado.leve && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    titulosCineticos();
    citacoes();
    reveals();
    faixas();
    contadores();
    porqueTilt();
    if (!estado.leve) {
      parallax();
      heroSaida();
      abismoZoom();
    }
  }

  /* ===== Títulos cinéticos: máscara que sobe ===== */
  function titulosCineticos() {
    $$('.section__title').forEach((el) => {
      el.removeAttribute('data-reveal');
      if (reduceMotion) return;
      const inner = document.createElement('span');
      inner.className = 'titulo-inner';
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add('titulo-cinetico');
      gsap.fromTo(inner, { yPercent: 115 }, {
        yPercent: 0,
        duration: 1.05,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });
  }

  /* ===== Hero afunda ao sair de cena (profundidade no scroll) ===== */
  function heroSaida() {
    if (reduceMotion) return;
    gsap.to('.hero__inner', {
      yPercent: -7,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 38%', scrub: 0.5 },
    });
  }

  /* ===== Hero: entrada ===== */
  function introHero() {
    const linhas = $$('.hero__line');
    if (reduceMotion || !window.gsap) {
      linhas.forEach((l) => (l.style.opacity = 1));
      return;
    }
    linhas.forEach((linha) => {
      const inner = document.createElement('span');
      inner.style.display = 'inline-block';
      inner.style.willChange = 'transform';
      while (linha.firstChild) inner.appendChild(linha.firstChild);
      linha.appendChild(inner);
    });
    gsap.fromTo(
      '.hero__line > span',
      { yPercent: 112 },
      { yPercent: 0, duration: 1.15, stagger: 0.14, ease: 'power4.out', delay: 0.12 }
    );
    gsap.fromTo(
      '.hero__eyebrow',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );
    gsap.fromTo(
      '.hero__marca',
      { opacity: 0, scale: 0.9 },
      { opacity: 0.16, scale: 1, duration: 1.6, ease: 'power2.out', delay: 0.2 }
    );
  }

  /* ===== Reveals genéricos ===== */
  function reveals() {
    $$('[data-reveal]').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        translate: '0 0',
        duration: reduceMotion ? 0.001 : 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  }

  /* ===== Citações: palavras acendendo no scroll ===== */
  function palavrasAcendem(alvo, inicio, fim) {
    if (!alvo) return;
    alvo.removeAttribute('data-reveal');
    const nos = [];
    const varre = (node) => {
      [...node.childNodes].forEach((filho) => {
        if (filho.nodeType === 3) {
          const frag = document.createDocumentFragment();
          filho.textContent.split(/(\s+)/).forEach((parte) => {
            if (!parte) return;
            if (/^\s+$/.test(parte)) frag.appendChild(document.createTextNode(parte));
            else {
              const s = document.createElement('span');
              s.className = 'palavra';
              s.textContent = parte;
              frag.appendChild(s);
              nos.push(s);
            }
          });
          node.replaceChild(frag, filho);
        } else if (filho.nodeType === 1) varre(filho);
      });
    };
    varre(alvo);
    gsap.to(nos, {
      opacity: 1,
      stagger: 0.06,
      ease: 'none',
      scrollTrigger: {
        trigger: alvo,
        start: inicio,
        end: fim,
        scrub: reduceMotion ? false : 0.6,
      },
    });
  }
  function citacoes() {
    palavrasAcendem($('#manifestoStatement'), 'top 82%', 'bottom 45%');
    palavrasAcendem($('.ativo__quote p'), 'top 84%', 'bottom 52%');
  }

  /* ===== Abismo: zoom progressivo (beat cinematográfico) ===== */
  function abismoZoom() {
    if (reduceMotion) return;
    gsap.fromTo('.abismo__bg', { scale: 1.18 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: '#abismo', start: 'top bottom', end: 'bottom top', scrub: 0.5 },
    });
  }

  /* ===== Yan pseudo-3D: tilt + parallax interno + brilho ===== */
  function porqueTilt() {
    const fig = $('.porque__yan');
    if (!fig || reduceMotion || !finePointer) return;
    const img = $('img', fig);
    const brilho = $('.porque__brilho', fig);
    gsap.set(fig, { transformPerspective: 900 });
    const rX = gsap.quickTo(fig, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const rY = gsap.quickTo(fig, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const iX = gsap.quickTo(img, 'xPercent', { duration: 0.8, ease: 'power3.out' });
    const iY = gsap.quickTo(img, 'yPercent', { duration: 0.8, ease: 'power3.out' });
    fig.addEventListener('pointermove', (e) => {
      const r = fig.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rY(px * 9);
      rX(-py * 8);
      iX(-px * 3.5);
      iY(-py * 3.5);
      brilho.style.opacity = 1;
      brilho.style.setProperty('--bx', (px * 100 + 50) + '%');
      brilho.style.setProperty('--by', (py * 100 + 50) + '%');
    });
    fig.addEventListener('pointerleave', () => {
      rX(0); rY(0); iX(0); iY(0);
      brilho.style.opacity = 0;
    });
  }

  /* ===== Faixas diagonais (marquee duplo, sentidos opostos) ===== */
  function faixas() {
    rolarFaixa($('#faixaNeon'), 30, -1);
    rolarFaixa($('#faixaEscura'), 46, 1);
  }
  function rolarFaixa(track, duracao, direcao) {
    if (!track) return;
    const originais = [...track.children];
    for (let c = 0; c < 2; c++) originais.forEach((n) => track.appendChild(n.cloneNode(true)));
    if (reduceMotion) return;
    const largura = track.scrollWidth / 3;
    const de = direcao < 0 ? 0 : -largura;
    const para = direcao < 0 ? -largura : 0;
    gsap.fromTo(track, { x: de }, { x: para, duration: duracao, ease: 'none', repeat: -1 });
  }

  /* ===== Contadores dinâmicos ===== */
  function contadores() {
    $$('[data-conta]').forEach((el) => {
      const fim = parseInt(el.dataset.conta, 10);
      const pre = el.dataset.prefixo || '';
      const suf = el.dataset.sufixo || '';
      const obj = { v: 0 };
      const render = () => (el.textContent = pre + Math.round(obj.v) + suf);
      if (reduceMotion) {
        obj.v = fim;
        render();
        return;
      }
      gsap.to(obj, {
        v: fim,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: render,
        onComplete: render,
      });
    });
  }

  /* ===== Parallax ===== */
  function parallax() {
    if (reduceMotion) return;
    $$('[data-parallax]').forEach((el) => {
      const forca = parseFloat(el.dataset.parallax || 0.15);
      gsap.to(el, {
        yPercent: -36 * forca * 10,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.4,
        },
      });
    });
    $$('[data-parallax-bg]').forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -9 },
        {
          yPercent: 9,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.4,
          },
        }
      );
    });
  }

  /* ===== HUD de profundidade ===== */
  const PROF_MAX = 1800;
  const profValor = $('#profValor');
  const profMarcador = $('#profMarcador');
  function profundidade() {
    if (!profValor) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const metros = Math.round(p * PROF_MAX);
    profValor.textContent = metros === 0 ? '0m' : '−' + metros.toLocaleString('pt-BR') + 'm';
    profMarcador.style.top = (p * 100).toFixed(2) + '%';
  }

  /* ===== Nav: sólida + esconde ao descer ===== */
  const nav = $('#nav');
  let ultimoY = 0;
  function aoRolar(y) {
    nav.classList.toggle('nav--solida', y > 40);
    const menuAberto = $('#menuMobile').classList.contains('menu--aberto');
    if (!menuAberto) {
      nav.classList.toggle('nav--oculta', y > ultimoY && y > 320);
    }
    ultimoY = y;
  }
  window.addEventListener('scroll', () => {
    aoRolar(window.scrollY);
    profundidade();
  }, { passive: true });
  window.addEventListener('resize', profundidade);
  profundidade();

  /* ===== Menu mobile ===== */
  const burger = $('#burger');
  const menu = $('#menuMobile');
  $$('.menu__links a').forEach((a, i) => {
    a.style.transitionDelay = 0.06 * i + 0.15 + 's';
  });
  function alternarMenu(forcaFechar) {
    const abrir = forcaFechar === true ? false : !menu.classList.contains('menu--aberto');
    if (!abrir && menu.contains(document.activeElement)) document.activeElement.blur();
    menu.classList.toggle('menu--aberto', abrir);
    menu.setAttribute('aria-hidden', String(!abrir));
    menu.toggleAttribute('inert', !abrir);
    burger.setAttribute('aria-expanded', String(abrir));
    burger.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = abrir ? 'hidden' : '';
    document.body.classList.toggle('com-menu', abrir);
    if (lenis) abrir ? lenis.stop() : lenis.start();
    if (abrir) nav.classList.remove('nav--oculta');
  }
  burger.addEventListener('click', () => alternarMenu());
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('menu--aberto')) alternarMenu(true);
  });

  /* ===== Âncoras suaves ===== */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const alvo = $(id);
      if (!alvo) return;
      e.preventDefault();
      alternarMenu(true);
      if (lenis) lenis.scrollTo(alvo, { offset: -16, duration: 1.4 });
      else alvo.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ===== Serviço clicado pré-marca o chip do formulário ===== */
  $$('.servico__row').forEach((row) => {
    row.addEventListener('click', () => {
      const nome = row.dataset.servico;
      const chip = $(`.form__chips input[value="${nome}"]`);
      if (chip) {
        chip.checked = true;
        atualizarPreview();
      }
    });
  });

  /* ===== Cursor custom ===== */
  if (finePointer && !reduceMotion) {
    const cursor = $('#cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });
    (function anima() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(anima);
    })();
    $$('a, button, label, input, textarea').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('cursor--ativo'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('cursor--ativo'));
    });
  }

  /* ===== Botões magnéticos ===== */
  if (finePointer && !reduceMotion) {
    $$('[data-magnetic]').forEach((el) => {
      const forca = 0.32;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * forca}px, ${y * forca}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = 'translate(0, 0)';
        setTimeout(() => (el.style.transition = ''), 500);
      });
    });
  }

  /* ===== Canvas: tentáculos vivos no hero ===== */
  function tentaculos() {
    const canvas = $('#tentaculos');
    if (!canvas || reduceMotion || estado.leve) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, visivel = true, t = 0;
    let alvoX = 0.5, alvoY = 0.5, ponteiroX = 0.5, ponteiroY = 0.5;

    const NEON = { r: 55, g: 241, b: 166 };
    const JADE = { r: 29, g: 181, b: 120 };
    const CURVAS = 6;

    function medir() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    medir();
    window.addEventListener('resize', medir);

    window.addEventListener('pointermove', (e) => {
      alvoX = e.clientX / window.innerWidth;
      alvoY = e.clientY / window.innerHeight;
    }, { passive: true });

    const io = new IntersectionObserver(([ent]) => (visivel = ent.isIntersecting));
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => {
      visivel = !document.hidden && visivel;
    });

    function desenha() {
      if (estado.leve) return;
      requestAnimationFrame(desenha);
      if (!visivel) return;
      t += 0.0042;
      ponteiroX += (alvoX - ponteiroX) * 0.03;
      ponteiroY += (alvoY - ponteiroY) * 0.03;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < CURVAS; i++) {
        const fase = (i / CURVAS) * Math.PI * 2;
        const cor = i % 2 ? NEON : JADE;
        const yBase = h * (0.22 + 0.6 * (i / (CURVAS - 1)));
        const amp = h * (0.05 + 0.045 * Math.sin(t * 0.7 + fase));
        const desvioMouse = (ponteiroY - 0.5) * h * 0.16;

        ctx.beginPath();
        const passos = 22;
        for (let p = 0; p <= passos; p++) {
          const fx = p / passos;
          const x = fx * w * 1.06 - w * 0.03;
          const onda =
            Math.sin(fx * 4.2 + t * 1.6 + fase) * amp +
            Math.sin(fx * 9 - t * 1.1 + fase * 2) * amp * 0.35;
          const puxa =
            Math.exp(-(((fx - ponteiroX) * 2.4) ** 2)) * desvioMouse;
          const y = yBase + onda + puxa;
          p === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const alfa = 0.05 + 0.035 * Math.sin(t * 1.3 + fase);
        ctx.strokeStyle = `rgba(${cor.r}, ${cor.g}, ${cor.b}, ${alfa})`;
        ctx.lineWidth = 1.4 + i * 0.5;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    desenha();
  }

  /* ===== Canvas: plâncton vivo + fio do mergulho ===== */
  function plancton() {
    const canvas = $('#plancton');
    if (!canvas || reduceMotion || estado.leve) return;
    const ctx = canvas.getContext('2d');
    // 1.5 basta para brilhos suaves e corta ~44% do custo de rasterização em retina
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w, h, t = 0;
    let alvoX = 0.5, alvoY = 0.5, ponteiroX = 0.5, ponteiroY = 0.5;
    const mobile = window.innerWidth < 769;
    const QTD = mobile ? 26 : 78;
    const graos = [];

    function medir() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    medir();
    window.addEventListener('resize', () => { medir(); construirFio(); });

    // sprite de brilho radial pré-renderizado: drawImage é muito mais
    // barato que criar um createRadialGradient a cada frame
    const brilhoSprite = document.createElement('canvas');
    brilhoSprite.width = 128;
    brilhoSprite.height = 128;
    {
      const c = brilhoSprite.getContext('2d');
      const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(55, 241, 166, 1)');
      g.addColorStop(0.55, 'rgba(55, 241, 166, 0.25)');
      g.addColorStop(1, 'rgba(55, 241, 166, 0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    }

    /* --- Fio do mergulho: uma linha de luz que costura as seções.
       Pontos em espaço de documento (x em fração da largura, y em px);
       a cabeça viaja com o scroll e se inclina na direção do ponteiro. --- */
    let fioPts = [];
    let fioDocH = 0;
    const catmull = (a, b, c, d, u) =>
      0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    function construirFio() {
      const ancoras = [];
      const add = (sel, fx, fy) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const r = el.getBoundingClientRect();
        ancoras.push({ x: fx, y: r.top + window.scrollY + r.height * fy });
      };
      add('#hero', 0.72, 0.42);
      add('#hero', 0.55, 0.96);
      add('#estudio', 0.06, 0.5);
      add('#porque', 0.94, 0.42);
      add('#servicos', 0.05, 0.5);
      add('#trabalhos', 0.95, 0.45);
      add('#ativo', 0.5, 0.6);
      add('#processo', 0.06, 0.55);
      add('#para-quem', 0.94, 0.5);
      add('#abismo', 0.5, 0.5);
      add('#time', 0.06, 0.45);
      add('#local', 0.94, 0.5);
      add('#contato', 0.07, 0.5);
      add('.footer', 0.5, 0.75);
      fioPts = [];
      if (ancoras.length < 4) return;
      for (let i = 0; i < ancoras.length - 1; i++) {
        const p0 = ancoras[Math.max(0, i - 1)];
        const p1 = ancoras[i];
        const p2 = ancoras[i + 1];
        const p3 = ancoras[Math.min(ancoras.length - 1, i + 2)];
        for (let j = 0; j < 40; j++) {
          const u = j / 40;
          fioPts.push({
            x: catmull(p0.x, p1.x, p2.x, p3.x, u),
            y: catmull(p0.y, p1.y, p2.y, p3.y, u),
          });
        }
      }
      fioDocH = document.documentElement.scrollHeight;
    }
    construirFio();

    /* Índice fracionário + suavização: a cabeça desliza pela curva
       em vez de pular de ponto em ponto (era a causa do movimento travado). */
    let headSuave = -1;
    function pontoFio(i, head, cauda) {
      const i0 = Math.max(0, Math.floor(i));
      const i1 = Math.min(fioPts.length - 1, i0 + 1);
      const f = i - i0;
      const px = fioPts[i0].x + (fioPts[i1].x - fioPts[i0].x) * f;
      const py = fioPts[i0].y + (fioPts[i1].y - fioPts[i0].y) * f;
      const perto = 1 - Math.min(1, Math.abs(head - i) / cauda);
      const onda = Math.sin(t * 1.1 + py * 0.004) * (mobile ? 7 : 14);
      const puxa = (ponteiroX - 0.5) * w * 0.07 * perto;
      return { x: px * w + onda + puxa, y: py - window.scrollY };
    }
    function desenharFio() {
      if (!fioPts.length) return;
      if (document.documentElement.scrollHeight !== fioDocH) construirFio();
      const headDocY = window.scrollY + h * 0.55;
      let alvo = fioPts.length - 1;
      for (let i = 1; i < fioPts.length; i++) {
        if (fioPts[i].y >= headDocY) {
          const y0 = fioPts[i - 1].y;
          const y1 = fioPts[i].y;
          alvo = i - 1 + (y1 > y0 ? (headDocY - y0) / (y1 - y0) : 0);
          break;
        }
      }
      if (headSuave < 0) headSuave = alvo;
      headSuave += (alvo - headSuave) * 0.09;
      const head = headSuave;
      const cauda = 170;
      if (head < 2) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const a = pontoFio(Math.max(0, head - cauda), head, cauda);
      const b = pontoFio(head, head, cauda);
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, 'rgba(55, 241, 166, 0)');
      grad.addColorStop(1, 'rgba(55, 241, 166, 0.5)');
      for (const passe of [
        { w: mobile ? 4 : 7, estilo: 'rgba(55, 241, 166, 0.05)', passo: 2 },
        { w: mobile ? 1.2 : 1.7, estilo: grad, passo: 1 },
      ]) {
        ctx.beginPath();
        let comecou = false;
        for (let k = 0; k <= cauda; k += passe.passo) {
          const i = head - cauda + k;
          if (i < 0) continue;
          const p = pontoFio(i, head, cauda);
          if (p.y < -120 || p.y > h + 120) { comecou = false; continue; }
          comecou ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), comecou = true);
        }
        ctx.strokeStyle = passe.estilo;
        ctx.lineWidth = passe.w;
        ctx.stroke();
      }
      if (b.y > -40 && b.y < h + 40) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(brilhoSprite, b.x - 26, b.y - 26, 52, 52);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
      }
      ctx.restore();
    }

    for (let i = 0; i < QTD; i++) {
      graos.push({
        x: Math.random(),
        y: Math.random(),
        prof: 0.3 + Math.random() * 0.7,          // camada: quanto maior, mais perto
        r: 0.5 + Math.random() * 1.7,
        vy: 0.00006 + Math.random() * 0.00018,    // sobe devagar, como neve marinha
        fase: Math.random() * Math.PI * 2,
        neon: Math.random() < 0.18,
      });
    }

    if (finePointer) {
      window.addEventListener('pointermove', (e) => {
        alvoX = e.clientX / window.innerWidth;
        alvoY = e.clientY / window.innerHeight;
      }, { passive: true });
    }

    let tAnterior = 0;
    let quadrosTotal = 0;
    let quadrosLentos = 0;
    function desenha(agora) {
      if (estado.leve) { ctx.clearRect(0, 0, w, h); return; }
      requestAnimationFrame(desenha);
      if (document.hidden) { tAnterior = 0; return; }
      // watchdog: se a máquina não sustenta ~36fps por 2s, liga o modo leve
      if (tAnterior) {
        quadrosTotal++;
        if (agora - tAnterior > 28) quadrosLentos++;
        if (quadrosTotal >= 120) {
          if (quadrosLentos > 70) { ativarModoLeve(); return; }
          quadrosTotal = 0;
          quadrosLentos = 0;
        }
      }
      tAnterior = agora;
      t += 0.012;
      ponteiroX += (alvoX - ponteiroX) * 0.025;
      ponteiroY += (alvoY - ponteiroY) * 0.025;
      ctx.clearRect(0, 0, w, h);

      for (const g of graos) {
        g.y -= g.vy * (0.6 + g.prof);
        if (g.y < -0.02) { g.y = 1.02; g.x = Math.random(); }
        const ondula = Math.sin(t * 0.6 + g.fase) * 0.004 * g.prof;
        const desvioX = (ponteiroX - 0.5) * 0.05 * g.prof;
        const desvioY = (ponteiroY - 0.5) * 0.035 * g.prof;
        const x = (g.x + ondula + desvioX) * w;
        const y = (g.y + desvioY) * h;
        const alfa = (g.neon ? 0.2 : 0.1) * g.prof * (0.65 + 0.35 * Math.sin(t + g.fase * 3));
        ctx.beginPath();
        ctx.arc(x, y, g.r * g.prof, 0, Math.PI * 2);
        ctx.fillStyle = g.neon
          ? `rgba(55, 241, 166, ${alfa})`
          : `rgba(255, 255, 255, ${alfa * 0.8})`;
        ctx.fill();
      }

      // lanterna: um facho suave que acompanha o ponteiro
      if (finePointer) {
        const lx = ponteiroX * w;
        const ly = ponteiroY * h;
        const raio = 280;
        ctx.globalAlpha = 0.055;
        ctx.drawImage(brilhoSprite, lx - raio, ly - raio, raio * 2, raio * 2);
        ctx.globalAlpha = 1;
      }

      desenharFio();
    }
    desenha();
  }

  /* ===== Formulário → WhatsApp ===== */
  const NUMERO = '5575998615843';
  const form = $('#formWhats');
  const balao = $('#previewBalao');
  const erro = $('#formErro');

  function montarMensagem() {
    const nome = $('#fNome').value.trim();
    const empresa = $('#fEmpresa').value.trim();
    const servicos = $$('.form__chips input:checked').map((c) => c.value);
    const msg = $('#fMsg').value.trim();

    let texto = 'Olá, Yandê! ';
    texto += nome ? `Sou ${nome}` : 'Vim pelo site';
    if (empresa) texto += `, da ${empresa}`;
    texto += '.';
    texto += `\nQuero conversar sobre: ${servicos.length ? servicos.join(' + ') : 'um projeto'}.`;
    if (msg) texto += `\n${msg}`;
    return texto;
  }

  function atualizarPreview() {
    balao.textContent = montarMensagem();
  }
  form.addEventListener('input', () => {
    erro.hidden = true;
    atualizarPreview();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = $('#fNome').value.trim();
    if (!nome) {
      erro.hidden = false;
      $('#fNome').focus();
      return;
    }
    const url = `https://wa.me/${NUMERO}?text=${encodeURIComponent(montarMensagem())}`;
    window.open(url, '_blank', 'noopener');
  });

  /* ===== Boot ===== */
  window.addEventListener('load', () => {
    prepararScroll();
    tentaculos();
    plancton();
  });
})();
