import { Component } from '@angular/core';
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
export class AppComponent {
  constructor(public themeService: ThemeService) {}

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}