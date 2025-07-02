import { Service } from '@tdi2/di-core';
import type { AppStateServiceInterface } from './types';

@Service()
export class AppStateService implements AppStateServiceInterface {
  state = {
    theme: 'light' as 'light' | 'dark',
    sidebarOpen: false,
    currentView: 'list' as 'list' | 'kanban'
  };

  constructor() {
    this.loadFromStorage();
    this.applyTheme();
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.state.theme = theme;
    this.applyTheme();
    this.saveToStorage();
  }

  toggleSidebar(): void {
    this.state.sidebarOpen = !this.state.sidebarOpen;
  }

  setView(view: 'list' | 'kanban'): void {
    this.state.currentView = view;
    this.saveToStorage();
  }

  private applyTheme(): void {
    document.body.className = `theme-${this.state.theme}`;
    document.documentElement.setAttribute('data-theme', this.state.theme);
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('tdi2-app-state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.state.theme = parsed.theme || 'light';
        this.state.currentView = parsed.currentView || 'list';
      } catch (e) {
        console.warn('Failed to parse stored app state');
      }
    }
  }

  private saveToStorage(): void {
    const toStore = {
      theme: this.state.theme,
      currentView: this.state.currentView
    };
    localStorage.setItem('tdi2-app-state', JSON.stringify(toStore));
  }
}