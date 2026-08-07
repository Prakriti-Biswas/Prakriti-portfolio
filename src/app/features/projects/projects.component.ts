import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-projects',
  standalone: true,
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sectionRef', { static: true }) sectionRef!: ElementRef<HTMLElement>;
  private ctx?: gsap.Context;

  ngAfterViewInit(): void {
    this.ctx = gsap.context(() => {
      const track = this.sectionRef.nativeElement.querySelector<HTMLElement>('.project-track');
      const scenes = gsap.utils.toArray<HTMLElement>('.project-scene');

      if (!track || scenes.length < 2) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: this.sectionRef.nativeElement,
          start: 'top top',
          end: () => `+=${window.innerWidth * (scenes.length - 1)}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(track, { xPercent: -75, ease: 'none', duration: 4 }, 0);
      timeline.to('.orb', { rotation: 220, scale: 1.22, ease: 'none', duration: 4 }, 0);
      timeline.fromTo(scenes.slice(1), { opacity: 0.7 }, { opacity: 1, stagger: 1, duration: 0.65 }, 0.25);
      ScrollTrigger.refresh();
    }, this.sectionRef.nativeElement);
  }

  ngOnDestroy(): void { this.ctx?.revert(); }
}
