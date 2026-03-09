import { Injectable, EventEmitter } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class ThemeService {
    onThemeChange = new EventEmitter<void>();
  isDark = false;

  constructor() {
    const saved = localStorage.getItem('theme');
    this.isDark = saved === 'dark';
    this.applyTheme();
  }

toggleTheme() {
  this.isDark = !this.isDark;
  localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  this.applyTheme();
  this.onThemeChange.emit();  // 🔥 tell components the theme changed
}


  applyTheme() {
    document.documentElement.classList.toggle('dark', this.isDark);
    document.documentElement.classList.toggle('light', !this.isDark);
  }



}

