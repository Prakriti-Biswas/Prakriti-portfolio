import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// --- function that wires Lenis + ScrollTrigger ---
function setupLenisAndScrollTrigger() {
  // Use document scrolling rather than a nested scroll container. This keeps
  // ScrollTrigger's pinned scenes stable across browsers.
  const lenis = new Lenis({
    smoothWheel: true,
    syncTouch: true,
    gestureOrientation: 'vertical',
    wheelMultiplier: 1.1,
    touchMultiplier: 2.5,
    lerp: 0.1,
    duration: 1.4,
  });

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
  window.addEventListener('portfolio-ready', () => ScrollTrigger.refresh(), { once: true });

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
