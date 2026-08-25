import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// Browsers may restore the previous scroll position on a reload. This portfolio
// always begins at its hero, so take control before Angular paints the page.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// --- function that wires Lenis + ScrollTrigger ---
function setupLenisAndScrollTrigger() {
  // Use document scrolling rather than a nested scroll container. This keeps
  // ScrollTrigger's pinned scenes stable across browsers.
  const lenis = new Lenis({
    smoothWheel: true,
    syncTouch: true,
    gestureOrientation: 'vertical',
    wheelMultiplier: 1,
    touchMultiplier: 1.8,
    duration: 1.2,
    // The exponential falloff gives scrolling the weighted, cinematic glide
    // used by the WLT reference without turning the page into scroll-jacking.
    easing: (progress: number) => progress === 1
      ? 1
      : 1 - Math.pow(2, -10 * progress),
  });

  // Synchronize Lenis with the native scroll position before it starts ticking.
  lenis.scrollTo(0, { immediate: true, force: true });

  // Keep GSAP and Lenis on one animation clock.
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ({ velocity }: { velocity: number }) => {
    ScrollTrigger.update();

    // A small, velocity-driven visual response keeps the page feeling organic
    // while preserving the geometry ScrollTrigger uses for pinned sections.
    const intensity = Math.min(Math.abs(velocity) / 35, 1);
    document.documentElement.style.setProperty('--liquid-speed', intensity.toFixed(3));
    document.documentElement.style.setProperty('--liquid-opacity', (intensity * 0.12).toFixed(3));
    document.documentElement.style.setProperty('--liquid-scale', (1 + intensity * 0.045).toFixed(3));
    document.documentElement.style.setProperty('--liquid-shift', `${Math.max(-18, Math.min(18, velocity * 0.45)).toFixed(1)}px`);
  });

  // The intro loader briefly covers the page. Measure pinned scenes again once
  // it has cleared so their start/end positions use the final layout.
  window.addEventListener('portfolio-ready', () => {
    // Run this again after the loader clears. Safari and Chrome can apply their
    // saved position late, after the initial JavaScript has already executed.
    lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    ScrollTrigger.clearScrollMemory('manual');
    ScrollTrigger.refresh();
  }, { once: true });

  // ---- GLOBAL FADE-IN ANIMATIONS ----
  gsap.utils.toArray('.fade-in').forEach((el: any) => {
    gsap.fromTo(
      el,
      { y: 80, opacity: 0, filter: 'blur(6px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'top 60%',
          scrub: true,
        },
      }
    );
  });

  // Keep Lenis + ScrollTrigger fully synced
  ScrollTrigger.refresh();
}


// Bootstrap Angular, THEN wire Lenis/ScrollTrigger
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    setupLenisAndScrollTrigger();
  })
  .catch((err) => console.error(err));
