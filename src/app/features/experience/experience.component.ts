import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-experience',
  standalone: true,
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css',
})
export class ExperienceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sectionRef', { static: true })
  sectionRef!: ElementRef<HTMLElement>;

  private ctx?: gsap.Context;

  ngAfterViewInit(): void {
    this.ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('.exp-panel');

      // Initial state: stacked back in space
      gsap.set(panels, {
        yPercent: 100,
        scale: 0.9,
        opacity: 0,
        z: -200,
        rotationX: 12,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: this.sectionRef.nativeElement,
          start: 'top top',
          end: `+=${panels.length * 100}%`,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          scroller: '#lenis-scroll',
        },
      });

      panels.forEach((panel, i) => {
        tl.to(
          panel,
          {
            yPercent: 0,
            opacity: 1,
            scale: 1,
            z: 0,
            rotationX: 0,
            ease: 'power3.out',
            duration: 1,
          },
          i
        );

        // Push previous cards back
        if (i > 0) {
          tl.to(
            panels.slice(0, i),
            {
              scale: 0.92,
              z: -120,
              opacity: 0.6,
              ease: 'power3.out',
              duration: 1,
            },
            i
          );
        }
      });
    }, this.sectionRef);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
