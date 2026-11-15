import { Component, signal, ElementRef, viewChild, afterNextRender } from '@angular/core';
import gsap from 'gsap';
import { Home } from './home/home';
import { SelectScreen } from './select-screen/select-screen';

@Component({
  selector: 'app-root',
  imports: [Home, SelectScreen],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  currentScreen = signal<'home' | 'select' | 'gameplay'>('home');

  // Lấy tham chiếu đến phần tử màn hình đang hiển thị để GSAP tác động
  screenEl = viewChild<ElementRef<HTMLElement>>('screenEl');

  constructor() {
    // Chạy hiệu ứng xuất hiện mỗi khi màn hình thay đổi trong Angular 21
    afterNextRender(() => {
      this.playEnterAnimation();
    });
  }

  // Hàm chuyển màn hình mượt mà có hiệu ứng GSAP
  switchToScreen(target: 'home' | 'select'): void {
    const el = this.screenEl()?.nativeElement;
    if (!el) {
      this.currentScreen.set(target);
      return;
    }

    // Hiệu ứng thu nhỏ và mờ dần khi rời màn hình cũ
    gsap.to(el, {
      scale: 0.9,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        // Cập nhật state đổi màn hình
        this.currentScreen.set(target);
      }
    });
  }

  // Hiệu ứng nảy bồng bềnh (Bounce/Elastic) cực kỳ cuốn hút khi màn hình mới hiện lên
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
        ease: 'back.out(1.7)', // Tạo hiệu ứng nảy nhẹ rất vui mắt cho trẻ em
        clearProps: 'transform'
      }
    );
  }

  handleSelectGame(gameId: string): void {
    console.log('Vào màn chơi:', gameId);
  }
}
