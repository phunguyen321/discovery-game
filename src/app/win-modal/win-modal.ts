import { Component, output } from '@angular/core';

@Component({
  selector: 'app-win-modal',
  standalone: true,
  templateUrl: './win-modal.html',
  styleUrl: './win-modal.scss'
})
export class WinModal {
  replay = output<void>();
  goHome = output<void>();
}