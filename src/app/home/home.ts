import { Component, output, signal, OnInit } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  // Event phát ra khi bé bấm BẮT ĐẦU
  startGame = output<void>();

  isMuted = signal<boolean>(false);
  isStarting = signal<boolean>(false);

  // Chia từng chữ cái với màu sắc chuẩn theo mockup
  titleRow1 = [
    { char: 'B', color: '#FF7EB3' },
    { char: 'É', color: '#FF7EB3', spaceAfter: true },
    { char: 'Ơ', color: '#7ED957' },
    { char: 'I', color: '#FFBD59' },
    { char: ',', color: '#FF914D' }
  ];

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

  ngOnInit(): void {
    // Khởi tạo giọng nói ngay khi load (lưu ý trình duyệt mobile cần 1 chạm đầu tiên mới phát audio)
  }

  toggleAudio(event: Event): void {
    event.stopPropagation();
    this.isMuted.update(m => !m);
    if (this.isMuted()) {
      window.speechSynthesis?.cancel();
    } else {
      this.playWelcomeVoice();
    }
  }

  onStartClick(): void {
    if (this.isStarting()) return;
    this.isStarting.set(true);
    this.playWelcomeVoice();

    // Hiệu ứng nút nảy nhẹ 350ms trước khi chuyển màn 2
    setTimeout(() => {
      this.startGame.emit();
    }, 350);
  }

  private playWelcomeVoice(): void {
    if (this.isMuted() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance('Xin chào các bé! Hôm nay chúng mình cùng khám phá nhé!');
    msg.lang = 'vi-VN';
    msg.rate = 0.9;
    msg.pitch = 1.15;
    window.speechSynthesis.speak(msg);
  }
}