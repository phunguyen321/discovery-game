
import {
  Component,
  output,
  signal,
  OnInit,
  OnDestroy
} from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {

  // Event phát ra khi bé bấm BẮT ĐẦU
  startGame = output<void>();

  // Trạng thái âm thanh
  isMuted = signal<boolean>(false);
  isStarting = signal<boolean>(false);

  // Đối tượng âm thanh
  private welcomeAudio?: HTMLAudioElement;

  // Tiêu đề dòng 1
  titleRow1 = [
    { char: 'B', color: '#FF7EB3' },
    { char: 'É', color: '#FF7EB3', spaceAfter: true },
    { char: 'Ơ', color: '#7ED957' },
    { char: 'I', color: '#FFBD59' },
    { char: ',', color: '#FF914D' }
  ];

  // Tiêu đề dòng 2
  titleRow2 = [
    { char: 'C', color: '#FF7EB3' },
    { char: 'Ù', color: '#FF7EB3' },
    { char: 'N', color: '#FF7EB3' },
    { char: 'G', color: '#FF7EB3', spaceAfter: true },
    { char: 'K', color: '#38B6FF' },
    { char: 'H', color: '#5271FF' },
    { char: 'Á', color: '#38B6FF' },
    { char: 'M', color: '#5271FF', spaceAfter: true },
    { char: 'P', color: '#FFBD59' },
    { char: 'H', color: '#FFDE59' },
    { char: 'Á', color: '#FF914D' },
    { char: '!', color: '#FFBD59' }
  ];

  // Khởi tạo khi vào màn hình
  ngOnInit(): void {
    this.initWelcomeAudio();
  }

  // Khởi tạo audio
  private initWelcomeAudio(): void {
    this.welcomeAudio = new Audio('/audio/intro.m4a');

    this.welcomeAudio.preload = 'auto';
    this.welcomeAudio.volume = 1;
    this.welcomeAudio.loop = false;

    // Tự động phát khi vào màn hình
    this.playWelcomeAudio();
  }

  // Bật / tắt âm thanh
  toggleAudio(event: Event): void {
    event.stopPropagation();

    this.isMuted.update(muted => !muted);

    if (this.isMuted()) {
      this.welcomeAudio?.pause();
    } else {
      this.playWelcomeAudio();
    }
  }

  // Khi bé bấm BẮT ĐẦU
  onStartClick(): void {
    if (this.isStarting()) return;

    this.isStarting.set(true);

    // Dừng âm thanh trước khi chuyển màn
    this.welcomeAudio?.pause();

    // Hiệu ứng nút nảy nhẹ 350ms
    setTimeout(() => {
      this.startGame.emit();
    }, 350);
  }

  // Phát âm thanh chào mừng
  private playWelcomeAudio(): void {
    if (this.isMuted() || !this.welcomeAudio) return;

    // Phát lại từ đầu
    this.welcomeAudio.currentTime = 0;

    this.welcomeAudio.play().catch(error => {
      console.warn(
        'Trình duyệt chưa cho phép phát âm thanh:',
        error
      );
    });
  }

  // Hủy audio khi rời màn hình
  ngOnDestroy(): void {
    if (this.welcomeAudio) {
      this.welcomeAudio.pause();
      this.welcomeAudio.currentTime = 0;
      this.welcomeAudio = undefined;
    }
  }
}
