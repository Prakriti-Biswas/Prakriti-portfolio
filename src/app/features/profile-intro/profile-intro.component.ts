import { Component, HostListener } from '@angular/core';

type InterfaceMode = 'system' | 'access' | 'motion';
type PrototypeView = 'overview' | 'people' | 'insights';

@Component({
  selector: 'app-profile-intro',
  standalone: true,
  templateUrl: './profile-intro.component.html',
  styleUrl: './profile-intro.component.css',
})
export class ProfileIntroComponent {
  activeMode: InterfaceMode = 'system';
  activeView: PrototypeView = 'overview';
  workflowOpen = false;
  commandOpen = false;
  workflowCreated = false;
  reviewed = false;

  setMode(mode: InterfaceMode): void {
    this.activeMode = mode;
  }

  setView(view: PrototypeView): void {
    this.activeView = view;
  }

  createWorkflow(): void {
    this.workflowOpen = false;
    this.workflowCreated = true;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commandOpen = !this.commandOpen;
    }

    if (event.key === 'Escape') {
      this.commandOpen = false;
      this.workflowOpen = false;
    }
  }
}
