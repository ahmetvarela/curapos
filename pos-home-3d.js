// pos-home-3d.js
'use strict';

(function () {
  const page = document.getElementById('posPage');

  const visualZone = document.getElementById('visualZone');
  const posTerminal = document.getElementById('posTerminal');

  const cubeVisualArea = document.getElementById('cubeVisualArea');
  const cubeWrap = document.getElementById('cubeWrap');
  const cubeInner = cubeWrap ? cubeWrap.querySelector('.cube') : null;

  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  const isLocalFile = window.location.protocol === 'file:';

  const isTouchDevice = window.matchMedia &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const isSmallScreen = window.matchMedia &&
    window.matchMedia('(max-width: 780px)').matches;

  const isPhone = window.matchMedia &&
    window.matchMedia('(max-width: 620px)').matches;

  let localMessageTimeoutId = null;

  function createParticles() {
    if (!page) return;

    const existingParticles = page.querySelectorAll('.pos-particle');

    if (existingParticles.length > 0) return;

    const totalParticles = isPhone ? 16 : isSmallScreen ? 22 : 65;

    for (let i = 0; i < totalParticles; i += 1) {
      const particle = document.createElement('span');

      particle.className = 'pos-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = `${Math.random() * -180}px`;
      particle.style.animationDuration = `${6 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * 8}s`;

      page.appendChild(particle);
    }
  }

  function setup3DMouseMove() {
    if (isTouchDevice) return;

    document.addEventListener('mousemove', function (event) {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;

      if (visualZone) {
        visualZone.style.transform = `
          rotateY(${x * 4}deg)
          rotateX(${-y * 4}deg)
        `;
      }

      if (posTerminal) {
        posTerminal.style.transform = `
          rotateX(${y * 10}deg)
          rotateY(${x * 16}deg)
        `;
      }

      if (cubeVisualArea) {
        cubeVisualArea.style.transform = `
          rotateY(${x * 3}deg)
          rotateX(${-y * 3}deg)
        `;
      }

      if (cubeInner) {
        cubeInner.style.transform = `
          rotateX(${y * 10}deg)
          rotateY(${x * 14}deg)
        `;
      }
    });

    document.addEventListener('mouseleave', function () {
      if (visualZone) {
        visualZone.style.transform = 'rotateY(0deg) rotateX(0deg)';
      }

      if (posTerminal) {
        posTerminal.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }

      if (cubeVisualArea) {
        cubeVisualArea.style.transform = 'rotateY(0deg) rotateX(0deg)';
      }

      if (cubeInner) {
        cubeInner.style.transform = 'rotateX(0deg) rotateY(0deg)';
      }
    });
  }

  function setupMobileLogo() {
    const logo3d = document.querySelector('.logo-3d');
    const topbar = document.querySelector('.topbar');
    const visualZoneHome = logo3d ? logo3d.parentNode : null;

    const socialLinks = document.querySelector('.social-links');
    const heroContent = document.querySelector('.hero-content');
    const heroBadge = heroContent ? heroContent.querySelector('.badge') : null;

    if (!topbar || !menuToggle) return;

    const mq = window.matchMedia('(max-width: 780px)');

    function placeElements() {
      if (mq.matches) {
        if (logo3d && visualZoneHome) {
          topbar.insertBefore(logo3d, menuToggle);
        }

        if (socialLinks && heroBadge) {
          heroContent.insertBefore(socialLinks, heroBadge);
        }
      } else {
        if (logo3d && visualZoneHome && logo3d.parentNode !== visualZoneHome) {
          visualZoneHome.insertBefore(logo3d, visualZoneHome.firstChild);
        }

        if (socialLinks && socialLinks.parentNode !== topbar) {
          topbar.insertBefore(socialLinks, topbar.querySelector('.topbar-actions'));
        }
      }
    }

    placeElements();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', placeElements);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(placeElements);
    }
  }

  function setupMobileMenu() {
    if (!menuToggle || !mobileMenu) return;

    menuToggle.setAttribute('aria-expanded', 'false');

    menuToggle.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('is-open');

      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.addEventListener('click', function (event) {
      const target = event.target;

      if (target && target.tagName === 'A') {
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;

      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('click', function (event) {
      if (!mobileMenu.classList.contains('is-open')) return;
      if (mobileMenu.contains(event.target)) return;
      if (menuToggle.contains(event.target)) return;

      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  }

  function setupLocalStaticMode() {
    const links = document.querySelectorAll('a[href^="/"]');

    links.forEach(function (link) {
      const originalHref = link.getAttribute('href');

      if (!originalHref) return;

      link.dataset.originalHref = originalHref;
      link.setAttribute('href', '#');
      link.setAttribute('title', `Ruta original del POS: ${originalHref}`);

      link.addEventListener('click', function (event) {
        event.preventDefault();
        showLocalMessage(originalHref);
      });
    });
  }

  function showLocalMessage(originalHref) {
    let message = document.getElementById('localModeMessage');

    if (!message) {
      message = document.createElement('div');
      message.id = 'localModeMessage';
      message.setAttribute('role', 'status');
      message.setAttribute('aria-live', 'polite');

      message.style.position = 'fixed';
      message.style.left = '50%';
      message.style.bottom = '22px';
      message.style.transform = 'translateX(-50%)';
      message.style.zIndex = '9999';
      message.style.maxWidth = 'min(520px, 92%)';
      message.style.padding = '14px 18px';
      message.style.borderRadius = '18px';
      message.style.border = '1px solid rgba(201, 167, 77, 0.55)';
      message.style.background = 'rgba(5, 5, 5, 0.92)';
      message.style.color = '#ffe39a';
      message.style.boxShadow = '0 0 34px rgba(201, 167, 77, 0.35)';
      message.style.backdropFilter = 'blur(14px)';
      message.style.fontFamily = 'Arial, Helvetica, sans-serif';
      message.style.fontSize = '0.92rem';
      message.style.lineHeight = '1.45';
      message.style.textAlign = 'center';

      document.body.appendChild(message);
    }

    message.textContent = `Esta sección (${originalHref}) estará disponible cuando la página se conecte al sistema Cura.`;

    window.clearTimeout(localMessageTimeoutId);

    localMessageTimeoutId = window.setTimeout(function () {
      if (message && message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 4200);
  }

  function checkStaticFiles() {
    const hasCss = Boolean(
      document.querySelector('link[href="./pos-home-3d.css"], link[href="pos-home-3d.css"]')
    );

    if (!hasCss) {
      console.warn(
        'No encontré el CSS relativo. En tu index.html usa: <link rel="stylesheet" href="./pos-home-3d.css" />'
      );
    }
  }

  function setupCardTilt() {
    if (isTouchDevice) return;

    const cards = document.querySelectorAll(
      '.module-card, .analytics-card, .intelligence-card, .rhythm-cards article, .hybrid-card, .loyalty-card, .ai-prompt-card, .supplier-mini-card, .hero-offer-card'
    );

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (event) {
        const rect = card.getBoundingClientRect();

        if (!rect.width || !rect.height) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const rotateY = ((x / rect.width) - 0.5) * 10;
        const rotateX = -((y / rect.height) - 0.5) * 10;

        card.style.transform = `
          perspective(900px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateY(-8px)
        `;
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  function setupSmoothHashScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function (link) {
      link.addEventListener('click', function (event) {
        const href = link.getAttribute('href');

        if (!href || href === '#') return;

        const target = document.querySelector(href);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    });
  }

  function setupScrollReveal() {
    const elements = document.querySelectorAll(
      '.modules-section, .cube-showcase-section, .finance-section, .analytics-section, .intelligence-section, .diagnostic-section, .sales-rhythm-section, .hybrid-section, .loyalty-section, .ai-chat-section, .supplier-section, .module-card, .analytics-card, .loyalty-card, .ai-prompt-card, .supplier-panel, .supplier-table-card'
    );

    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (element) {
        element.classList.add('is-visible');
      });

      return;
    }

    injectRevealStyles();

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12
      }
    );

    elements.forEach(function (element) {
      element.classList.add('reveal-item');
      observer.observe(element);
    });
  }

  function injectRevealStyles() {
    if (document.getElementById('revealStyles')) return;

    const style = document.createElement('style');
    style.id = 'revealStyles';

    style.textContent = `
      .reveal-item {
        opacity: 0;
        transform: translateY(34px);
        transition:
          opacity 0.7s ease,
          transform 0.7s ease;
      }

      .reveal-item.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;

    document.head.appendChild(style);
  }

  function setupReducedMotion() {
    const prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) return;

    document.documentElement.classList.add('reduce-motion');

    const style = document.createElement('style');

    style.textContent = `
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }
    `;

    document.head.appendChild(style);
  }

  function setupBackToTop() {
    const button = document.createElement('button');

    button.className = 'back-to-top';
    button.type = 'button';
    button.setAttribute('aria-label', 'Volver arriba');
    button.textContent = '↑';

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(button);

    let ticking = false;

    window.addEventListener('scroll', function () {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(function () {
        button.classList.toggle('is-visible', window.scrollY > 500);
        ticking = false;
      });
    }, { passive: true });
  }

  function init() {
    checkStaticFiles();
    setupReducedMotion();
    createParticles();
    setup3DMouseMove();
    setupMobileLogo();
    setupMobileMenu();
    setupLocalStaticMode();
    setupCardTilt();
    setupSmoothHashScroll();
    setupScrollReveal();
    setupBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
