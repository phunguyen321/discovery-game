
import {
  Component,
  signal,
  ElementRef,
  afterNextRender,
  viewChild,
  inject
} from '@angular/core';

import gsap from 'gsap';

import { Home } from './home/home';
import { SelectScreen } from './select-screen/select-screen';
import { FindItem } from './find-item/find-item';
import { FindAnimal } from './find-animal/find-animal';
import { FindColor } from './find-color/find-color';

import {
  ImagePreloader,
  ImageScreen
} from './services/image-preloader';

type ScreenType =
  | 'home'
  | 'select'
  | 'gameplay'
  | 'gameplay-animal'
  | 'gameplay-color';

@Component({
  selector: 'app-root',
  imports: [
    Home,
    SelectScreen,
    FindItem,
    FindAnimal,
    FindColor
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  // ============================================
  // SERVICES
  // ============================================

  private imagePreloader = inject(ImagePreloader);

  // ============================================
  // SCREEN STATE
  // ============================================

  currentScreen = signal<ScreenType>('home');

  screenEl = viewChild<ElementRef<HTMLElement>>('screenEl');

  private isTransitioning = false;

  // Chống việc một yêu cầu điều hướng cũ
  // ghi đè một yêu cầu điều hướng mới.
  private transitionId = 0;

  // Ánh xạ tên màn hình sang nhóm ảnh cần preload.
  private readonly screenImageMap: Record<ScreenType, ImageScreen> = {
    home: 'home',
    select: 'select',
    gameplay: 'find-item',
    'gameplay-animal': 'find-animal',
    'gameplay-color': 'find-color'
  };

  // ============================================
  // INIT
  // ============================================

  constructor() {

    // Tải trước toàn bộ ảnh ngay khi App khởi tạo.
    // Không chặn việc hiển thị Home.
    void this.imagePreloader.preloadAll();

    afterNextRender(() => {
      this.playEnterAnimation();
    });
  }

  // ============================================
  // SCREEN NAVIGATION
  // ============================================

  async switchToScreen(target: ScreenType): Promise<void> {

    if (this.isTransitioning) {
      return;
    }

    if (this.currentScreen() === target) {
      return;
    }

    this.isTransitioning = true;

    const currentTransitionId = ++this.transitionId;

    try {

      // Bước 1: Đảm bảo ảnh của màn hình sắp mở đã sẵn sàng.
      const imageScreen = this.screenImageMap[target];

      await this.imagePreloader.preloadScreen(imageScreen);

      // Bước 2: Kiểm tra yêu cầu điều hướng còn hợp lệ.
      if (currentTransitionId !== this.transitionId) {
        return;
      }

      // Bước 3: Chạy animation thoát màn hình hiện tại.
      const el = this.screenEl()?.nativeElement;

      if (!el) {
        this.currentScreen.set(target);
        return;
      }

      await new Promise<void>((resolve) => {

        gsap.to(el, {
          scale: 0.9,
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',

          onComplete: () => {
            this.currentScreen.set(target);
            resolve();
          }
        });

      });

    } finally {
      this.isTransitioning = false;
    }
  }

  // ============================================
  // ENTER ANIMATION
  // ============================================

  private playEnterAnimation(): void {

    const el = this.screenEl()?.nativeElement;

    if (!el) {
      return;
    }

    gsap.fromTo(
      el,
      {
        scale: 0.8,
        opacity: 0,
        y: 30
      },
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

  // ============================================
  // SELECT GAME
  // ============================================

  handleSelectGame(gameId: string): void {

    console.log('Vào màn chơi:', gameId);

    if (gameId === 'game-3a') {
      void this.switchToScreen('gameplay');

    } else if (gameId === 'game-3b') {
      void this.switchToScreen('gameplay-animal');

    } else if (gameId === 'game-3c') {
      void this.switchToScreen('gameplay-color');
    }
  }
}
