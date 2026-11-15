import { Component, signal, ElementRef, afterNextRender, viewChild } from '@angular/core';
import gsap from 'gsap';
import { Home } from './home/home';
import { SelectScreen } from './select-screen/select-screen';
import { FindItem } from './find-item/find-item';

@Component({
  selector: 'app-root',
  imports: [Home, SelectScreen, FindItem],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  currentScreen = signal<'home' | 'select' | 'gameplay'>('home');
  screenEl = viewChild<ElementRef<HTMLElement>>('screenEl');

  constructor() {
    afterNextRender(() => {
      this.playEnterAnimation();
    });
  }

  switchToScreen(target: 'home' | 'select' | 'gameplay'): void {
    const el = this.screenEl()?.nativeElement;
    if (!el) {
      this.currentScreen.set(target);
      return;
    }

    gsap.to(el, {
      scale: 0.9,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        this.currentScreen.set(target);
      }
    });
  }

  private playEnterAnimation(): void {
    const el = this.screenEl()?.nativeElement;
    if (!el) return;

    gsap.fromTo(el,
      { scale: 0.8, opacity: 0, y: 30 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
        clearProps: 'transform'
      }
    );
  }

  handleSelectGame(gameId: string): void {
    console.log('Vào màn chơi:', gameId);
    // Chuyển sang màn hình gameplay khi bé bấm vào cửa
    this.switchToScreen('gameplay');
  }
}