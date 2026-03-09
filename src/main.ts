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
  const scroller = document.querySelector('#lenis-scroll') as HTMLElement | null;

  if (!scroller) {
    console.warn('Lenis: #lenis-scroll container not found');
    return;
  }

  // Create Lenis instance
  const lenis = new Lenis({
    wrapper: scroller,
    content: scroller,
    smoothWheel: true,
    syncTouch: true,
    lerp: 0.08,
  });

  // RAF LOOP — CRITICAL FIX
  function raf(time: number) {
    lenis.raf(time);
    ScrollTrigger.update();   // ← THIS is what makes horizontal scroll work
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Tell ScrollTrigger to use the lenis scroller
  ScrollTrigger.scrollerProxy(scroller, {
    scrollTop(value) {
      if (value !== undefined) {
        lenis.scrollTo(value, { immediate: false });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  // Make this scroller default for all ScrollTriggers
  ScrollTrigger.defaults({ scroller });

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
  ScrollTrigger.addEventListener('refresh', () => {
    lenis.raf(performance.now());
  });

  ScrollTrigger.refresh();
}


// Bootstrap Angular, THEN wire Lenis/ScrollTrigger
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    setupLenisAndScrollTrigger();
  })
  .catch((err) => console.error(err));
