import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { HeroComponent } from './features/hero/hero.component';
import { AboutComponent } from './features/about/about.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { ExperienceComponent } from "./features/experience/experience.component";
import { ProfileIntroComponent } from './features/profile-intro/profile-intro.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, HeroComponent, ProfileIntroComponent, AboutComponent, ProjectsComponent, ExperienceComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dotCanvas') private dotCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('contactSection') private contactSection?: ElementRef<HTMLElement>;
  readonly currentYear = new Date().getFullYear();
  isLoading = true;
  isLoaderExiting = false;
  loadingProgress = 0;
  private loadingFrame?: number;
  private dotFrame?: number;
  private loaderExitTimer?: ReturnType<typeof setTimeout>;
  private dotResizeObserver?: ResizeObserver;
  private pointer = { x: -1000, y: -1000, active: false };
  ngOnInit(): void {
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 250 : 1800;
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      this.loadingProgress = Math.round(progress * 100);
      if (progress < 1) {
        this.loadingFrame = requestAnimationFrame(update);
      } else {
        this.isLoaderExiting = true;
        this.loaderExitTimer = setTimeout(() => {
          this.isLoading = false;
          window.dispatchEvent(new Event('portfolio-ready'));
        }, reduceMotion ? 0 : 650);
      }
    };
    this.loadingFrame = requestAnimationFrame(update);
  }

  ngAfterViewInit(): void {
    this.initDotField();
  }

  private initDotField(): void {
    const canvas = this.dotCanvas?.nativeElement;
    const section = this.contactSection?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !section || !context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots: Array<{
      x: number;
      y: number;
      homeX: number;
      homeY: number;
      velocityX: number;
      velocityY: number;
      energy: number;
    }> = [];

    const buildGrid = () => {
      const rect = section.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dots.length = 0;
      const spacing = window.innerWidth < 700 ? 29 : 32;
      for (let y = spacing / 2; y < rect.height; y += spacing) {
        for (let x = spacing / 2; x < rect.width; x += spacing) {
          dots.push({ x, y, homeX: x, homeY: y, velocityX: 0, velocityY: 0, energy: 0 });
        }
      }
    };

    const setPointer = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      this.pointer.x = event.clientX - rect.left;
      this.pointer.y = event.clientY - rect.top;
      this.pointer.active = true;
    };
    const clearPointer = () => { this.pointer.active = false; };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      for (const dot of dots) {
        let proximity = 0;
        if (!reduceMotion) {
          dot.velocityX += (dot.homeX - dot.x) * .022;
          dot.velocityY += (dot.homeY - dot.y) * .022;
          if (this.pointer.active) {
            const dx = dot.x - this.pointer.x;
            const dy = dot.y - this.pointer.y;
            const distance = Math.hypot(dx, dy);
            const radius = 185;
            if (distance < radius && distance > 0) {
              proximity = 1 - distance / radius;
              const force = Math.pow(proximity, 2) * 1.25;
              dot.velocityX += (dx / distance) * force;
              dot.velocityY += (dy / distance) * force;
            }
          }
          dot.velocityX *= .87;
          dot.velocityY *= .87;
          dot.x += dot.velocityX;
          dot.y += dot.velocityY;
          dot.energy += (proximity - dot.energy) * (proximity > dot.energy ? .2 : .08);
        }
        const size = 1.5 + dot.energy * 1.65;
        const red = Math.round(238 + (213 - 238) * dot.energy);
        const green = Math.round(231 + (160 - 231) * dot.energy);
        const blue = Math.round(223 + (168 - 223) * dot.energy);
        const opacity = .32 + dot.energy * .38;
        context.beginPath();
        context.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${opacity})`;
        context.fill();
      }
      if (!reduceMotion) this.dotFrame = requestAnimationFrame(draw);
    };

    buildGrid();
    section.addEventListener('pointermove', setPointer);
    section.addEventListener('pointerleave', clearPointer);
    this.dotResizeObserver = new ResizeObserver(buildGrid);
    this.dotResizeObserver.observe(section);
    draw();
  }

  ngOnDestroy(): void {
    if (this.loadingFrame) cancelAnimationFrame(this.loadingFrame);
    if (this.dotFrame) cancelAnimationFrame(this.dotFrame);
    if (this.loaderExitTimer) clearTimeout(this.loaderExitTimer);
    this.dotResizeObserver?.disconnect();
  }
}
