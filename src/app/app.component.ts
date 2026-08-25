import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { HeroComponent } from './features/hero/hero.component';
import { AboutComponent } from './features/about/about.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { ThemeService } from './services/theme.service';
import { ExperienceComponent } from "./features/experience/experience.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, HeroComponent, AboutComponent, ProjectsComponent, ExperienceComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly currentYear = new Date().getFullYear();
  isLoading = true;
  isLoaderExiting = false;
  loadingProgress = 0;
  private loadingFrame?: number;
  private loaderExitTimer?: ReturnType<typeof setTimeout>;
  constructor(public themeService: ThemeService) {}

  toggleTheme() {
    this.themeService.toggleTheme();
  }

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

  ngOnDestroy(): void {
    if (this.loadingFrame) cancelAnimationFrame(this.loadingFrame);
    if (this.loaderExitTimer) clearTimeout(this.loaderExitTimer);
  }
}
